import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Summarizes a git commit diff using Gemini
 * @param diff - The git diff string
 * @returns The summary text from Gemini
 */
export async function summarizeCommit(diff: string): Promise<string> {
  const prompt = `
You are an expert programmer. Summarize the following git diff in clear, concise language for a changelog or PR reviewer.
The diff is in standard unified format.

${diff}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Example usage (for testing, remove or comment out in production)
if (require.main === module) {
  // Example diff string
  const diff = `
--git a/README.md b/README.md
index cc23ebe..c8d7fad 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,2 @@
 # ComplainHub
-The Complaint Management System is a full-stack web application designed for students to register complaints related to various issues such as WiFi problems, hostel maintenance, food quality, and more. Admins can efficiently track, categorize, prioritize, and resolve complaints through an interactive dashboard.
+The Complaint Management System is a full-stack web application designed for students to register complaints related to various issues such as WiFi problems, hostel maintenance, food quality, and more.The Admin will efficiently track, categorize, prioritize, and resolve complaints through an interactive dashboard.
`;

  summarizeCommit(diff).then(summary => {
    console.log("Gemini summary:", summary);
  });
}
