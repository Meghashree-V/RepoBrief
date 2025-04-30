import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Create a GoogleGenerativeAI instance directly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { question, projectId } = await req.json();
    
    if (!question || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields: question and projectId" },
        { status: 400 }
      );
    }

    console.log(`[QA API] Processing question: "${question}" for project: ${projectId}`);
    
    // Get all files for this project - no vector search
    console.log("[QA API] Fetching files for this project");
    const files = await prisma.sourceCodeEmbedding.findMany({
      where: { projectId },
      take: 10,
    });
    
    console.log(`[QA API] Found ${files.length} files`);
    
    // If no files found, return early
    if (files.length === 0) {
      return NextResponse.json({
        answer: "Sorry, no files were found for this project. Please add some files first.",
        referencedFiles: [],
      });
    }
    
    // Simple text-based relevance scoring
    const scoredFiles = files.map(file => {
      // Calculate a simple relevance score based on text matching
      const lowerQuestion = question.toLowerCase();
      const lowerFileName = file.fileName.toLowerCase();
      const lowerSummary = file.summary.toLowerCase();
      const lowerSourceCode = (file.sourceCode || '').toLowerCase();
      
      let score = 0;
      
      // Check for keyword matches in file name
      if (lowerFileName.includes(lowerQuestion)) score += 5;
      
      // Check for keyword matches in summary
      if (lowerSummary.includes(lowerQuestion)) score += 3;
      
      // Check for keyword matches in source code
      if (lowerSourceCode.includes(lowerQuestion)) score += 2;
      
      // Split question into words and check for individual word matches
      const words = lowerQuestion.split(/\s+/).filter(w => w.length > 3);
      for (const word of words) {
        if (lowerFileName.includes(word)) score += 2;
        if (lowerSummary.includes(word)) score += 1;
        if (lowerSourceCode.includes(word)) score += 0.5;
      }
      
      return { file, score };
    });
    
    // Sort by score and take top results
    const topFiles = scoredFiles
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.file);
    
    // Build context string from top files
    let context = "";
    for (const file of topFiles) {
      context += `File: ${file.fileName}\nSummary: ${file.summary}\nSource Code:\n${file.sourceCode || ''}\n---\n`;
    }
    
    // If still no context, use a generic response
    if (!context) {
      context = "No specific code context available for this project.";
    }
    
    // Construct prompt for Gemini
    console.log("[QA API] Constructing prompt for Gemini");
    const prompt = `You are an AI code assistant. Use the following context from the user's codebase to answer the question.\n\nContext:\n${context}\n\nQuestion: ${question}\nAnswer:`;
    
    // Generate answer from Gemini
    console.log("[QA API] Generating answer from Gemini");
    let answer = "";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      answer = result.response.text();
    } catch (error) {
      console.error("[QA API] Error generating content with Gemini:", error);
      answer = "Sorry, there was an error generating the answer. Please try again later.";
    }
    
    // Return the answer and referenced files
    return NextResponse.json({
      answer,
      referencedFiles: topFiles.map(file => ({
        id: file.id,
        fileName: file.fileName,
        summary: file.summary,
        sourceCode: file.sourceCode || ""
      })),
    });
  } catch (err) {
    // Log the detailed error
    console.error("[QA API] Error:", err);
    
    return NextResponse.json(
      { 
        error: "Error generating answer", 
        message: err instanceof Error ? err.message : "Unknown error",
        answer: "Sorry, there was an error generating the answer. Please try again later."
      },
      { status: 500 }
    );
  }
}
