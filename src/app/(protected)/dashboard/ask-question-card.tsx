"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectsCtx } from '@/hooks/project-context';
import { Loader2, Save, Clock } from "lucide-react";
import { api } from '@/trpc/react';

interface SavedQuestion {
  id: string;
  question: string;
  answer: string;
  referencedFiles: any[];
  createdAt: string;
}

interface AskQuestionCardProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  project?: any;
  onQuestionSaved?: () => void;
}

const AskQuestionCard = (props: AskQuestionCardProps = {}) => {
  // Use props if provided, otherwise use context
  const projectContext = useProjectsCtx();
  const projectToUse = props.project || projectContext.project;
  
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [referencedFiles, setReferencedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Use props for open/setOpen if provided, otherwise use local state
  const open = props.open !== undefined ? props.open : localOpen;
  const setOpen = props.setOpen || setLocalOpen;
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<SavedQuestion | null>(null);
  const [viewingSaved, setViewingSaved] = useState(false);
  
  // Check if we're on the Q&A page
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isQAPage = pathname.includes('/qa');

  // Fetch saved questions when the project changes
  useEffect(() => {
    if (projectToUse?.id) {
      fetchSavedQuestions();
    }
  }, [projectToUse?.id]);

  // Function to fetch saved questions
  const fetchSavedQuestions = async () => {
    if (!projectToUse?.id) return;
    
    setLoadingSaved(true);
    try {
      const response = await fetch(`/api/get-saved-questions?projectId=${projectToUse.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch saved questions');
      }
      
      setSavedQuestions(data.savedQuestions || []);
    } catch (err) {
      console.error("Error fetching saved questions:", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Function to view a saved question
  const viewSavedQuestion = (question: SavedQuestion) => {
    setSelectedQuestion(question);
    setViewingSaved(true);
    setOpen(true);
    setActiveFileIndex(0);
  };

  async function handleAskQuestion(e: React.FormEvent) {
    e.preventDefault();
    setAnswer("");
    setReferencedFiles([]);
    setLoading(true);
    setOpen(true);
    const projectId = projectToUse?.id;
    if (!question.trim() || !projectId) return;
    
    setLoading(true);
    setAnswer("");
    setReferencedFiles([]);
    
    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          projectId,
        }),
      });
      let data: any = {};
      try {
        data = await response.json();
      } catch (jsonErr) {
        // If JSON parsing fails, show generic error
        setAnswer('Sorry, there was a problem processing the server response.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        // Always show the error or answer from backend
        setAnswer(data.answer || data.message || 'Failed to get answer');
        setLoading(false);
        return;
      }

      if (data.referencedFiles && Array.isArray(data.referencedFiles)) {
        setReferencedFiles(data.referencedFiles);
      }

      if (data.answer) {
        setAnswer(data.answer);
      } else {
        setAnswer("Sorry, no answer was generated.");
      }
    } catch (err: any) {
      console.error("Error in handleAskQuestion:", err);
      setAnswer(err?.message || 'Sorry, there was an unexpected error.');
      setLoading(false);
      setAnswer("Sorry, there was an error getting the answer.");
      setReferencedFiles([]);
    } finally {
      setLoading(false);
    }
  }

  // Get the saveAnswer mutation
  const saveAnswer = api.project.saveAnswer.useMutation();

  async function handleSaveAnswer() {
    if (!projectToUse?.id || !question || !answer) return;
    
    setSaving(true);
    try {
      // Use TRPC mutation instead of fetch
      const result = await saveAnswer.mutateAsync({
        projectId: projectToUse.id,
        question,
        answer,
        referencedFiles
      });
      
      alert("Answer saved successfully");
      // Refresh saved questions if we're on the QA page
      if (isQAPage) {
        fetchSavedQuestions();
      }
    } catch (err) {
      console.error("Error saving answer:", err);
      alert("Failed to save answer");
    } finally {
      setSaving(false);
    }
  }

  // Main render for dashboard
  if (!isQAPage) {
    return (
      <div className="w-full">
        <form onSubmit={(e) => handleAskQuestion(e)}>
          <textarea
            placeholder="Which file should I edit to change the homepage?"
            className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="mt-4">
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Processing...' : 'Ask RepoBrief!'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <Card className="relative col-span-3">
      <CardHeader>
        <CardTitle>Ask a question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAskQuestion} className="flex flex-col gap-4">
          <textarea
            className="w-full rounded border p-2"
            placeholder="Which file should I edit to change the homepage?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={4}
          />
          <Button type="submit" disabled={loading || !question.trim()}>{loading ? "Asking..." : "Ask RepoBrief"}</Button>
        </form>

        {/* Saved Questions section removed from dashboard */}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col items-start gap-4 py-6 px-6 max-w-4xl mx-auto bg-white" style={{background: 'white', maxHeight: '90vh', overflowY: 'auto'}}>
          <DialogTitle className="sr-only">Ask a Question Result</DialogTitle>
          
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-full shadow p-2" style={{height: 40, width: 40}}>
                <img src="/logo.png" alt="repobrief logo" style={{height: 30, width: 30, objectFit: 'contain'}} />
              </div>
              {!viewingSaved && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveAnswer} 
                  disabled={saving || !answer}
                  className="flex items-center gap-1"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  <span>Save Answer</span>
                </Button>
              )}
            </div>
          </div>
          
          <div className="w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            ) : (
              <>
                {/* Question */}
                <div className="font-medium text-lg mb-4">
                  {viewingSaved && selectedQuestion 
                    ? selectedQuestion.question 
                    : question}
                </div>
                
                {/* Answer */}
                <div className="text-sm">
                  <div className="whitespace-pre-wrap">
                    <div className="text-base leading-relaxed">
                      {(viewingSaved && selectedQuestion 
                        ? selectedQuestion.answer 
                        : answer).split('\n').map((line: string, i: number) => {
                        // Check if this is a section heading (all caps followed by colon)
                        const isSectionHeading = /^[A-Z\s]+:/.test(line);
                        
                        // Check if this is a code snippet line
                        const isCodeLine = line.trim().startsWith('<') || 
                                          line.trim().startsWith('function') ||
                                          line.trim().startsWith('import') ||
                                          line.trim().startsWith('export') ||
                                          line.trim().startsWith('class') ||
                                          line.trim().startsWith('const') ||
                                          line.trim().startsWith('let') ||
                                          line.trim().startsWith('var') ||
                                          /^\s*[a-zA-Z_]+\([^)]*\)\s*{/.test(line);
                        
                        // Check if this is a line number reference
                        const isLineReference = /^Lines \d+-\d+|^Line \d+/.test(line);
                        
                        // Check if this is a list item
                        const isList = /^[\-\*]\s/.test(line);
                        
                        if (isSectionHeading) {
                          return (
                            <div key={i} className="font-bold text-lg mt-6 mb-3 text-blue-700 border-b pb-1">
                              {line}
                            </div>
                          );
                        } else if (isLineReference) {
                          return (
                            <div key={i} className="font-semibold text-md mt-3 mb-2 text-gray-700">
                              {line}
                            </div>
                          );
                        } else if (isCodeLine) {
                          return (
                            <div key={i} className="font-mono text-sm bg-gray-100 p-1 my-1 rounded">
                              {line}
                            </div>
                          );
                        } else if (isList) {
                          return (
                            <div key={i} className="ml-4 mb-1">
                              {/* Render HTML content if it contains HTML tags */}
                              {line.includes('<b>') || line.includes('</b>') ? (
                                <div dangerouslySetInnerHTML={{ __html: line }} />
                              ) : (
                                line
                              )}
                            </div>
                          );
                        } else if (line.trim() === '') {
                          return <div key={i} className="h-3"></div>; // Empty line spacing
                        } else {
                          // Render HTML content if it contains HTML tags
                          return (
                            <div key={i} className="mb-2">
                              {line.includes('<b>') || line.includes('</b>') ? (
                                <div dangerouslySetInnerHTML={{ __html: line }} />
                              ) : (
                                line
                              )}
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                </div>
                
                {/* File tabs at the bottom */}
                {(viewingSaved && selectedQuestion 
                  ? selectedQuestion.referencedFiles 
                  : referencedFiles).length > 0 && (
                  <div className="w-full mt-6 border rounded-md overflow-hidden" style={{ maxHeight: '400px' }}>
                    {/* File tabs - only show unique file names */}
                    <div className="flex overflow-x-auto bg-gray-100">
                      {/* Filter to unique file names */}
                      {Array.from(new Set((viewingSaved && selectedQuestion 
                        ? selectedQuestion.referencedFiles 
                        : referencedFiles).map(file => 
                        file.fileName.split('/').pop() || file.fileName
                      ))).map((uniqueFileName, index) => {
                        // Find the first file with this name
                        const fileIndex = (viewingSaved && selectedQuestion 
                          ? selectedQuestion.referencedFiles 
                          : referencedFiles).findIndex(file => 
                          (file.fileName.split('/').pop() || file.fileName) === uniqueFileName
                        );
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setActiveFileIndex(fileIndex)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                              fileIndex === activeFileIndex ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                            }`}
                          >
                            {uniqueFileName}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* File content - show a cleaner preview with highlighted lines */}
                    <div className="bg-gray-900 text-white p-4 overflow-x-auto" style={{ minHeight: '200px', maxHeight: '300px', overflowY: 'auto' }}>
                      {(viewingSaved && selectedQuestion 
                        ? selectedQuestion.referencedFiles 
                        : referencedFiles)[activeFileIndex]?.sourceCode ? (
                        <div className="font-mono text-xs">
                          {/* Show matching lines if available */}
                          {(viewingSaved && selectedQuestion 
                            ? selectedQuestion.referencedFiles 
                            : referencedFiles)[activeFileIndex]?.matchingLines && 
                           (viewingSaved && selectedQuestion 
                            ? selectedQuestion.referencedFiles 
                            : referencedFiles)[activeFileIndex]?.matchingLines.length > 0 && (
                            <div className="bg-gray-800 p-2 mb-4 rounded border border-yellow-500">
                              <div className="font-bold text-yellow-400 mb-2">Matching Lines:</div>
                              {(viewingSaved && selectedQuestion 
                                ? selectedQuestion.referencedFiles 
                                : referencedFiles)[activeFileIndex]?.matchingLines.map((lineNum: number, idx: number) => (
                                <div key={idx} className="mb-1">
                                  <span className="text-yellow-400">Line {lineNum}:</span>{' '}
                                  <span className="text-green-300">
                                    {(viewingSaved && selectedQuestion 
                                      ? selectedQuestion.referencedFiles 
                                      : referencedFiles)[activeFileIndex]?.matchingLineContents[idx]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Show full source code */}
                          {(viewingSaved && selectedQuestion 
                            ? selectedQuestion.referencedFiles 
                            : referencedFiles)[activeFileIndex].sourceCode.split('\n').map((line: string, idx: number) => {
                            const lineNumber = idx + 1;
                            const isMatchingLine = (viewingSaved && selectedQuestion 
                              ? selectedQuestion.referencedFiles 
                              : referencedFiles)[activeFileIndex]?.matchingLines?.includes(lineNumber);
                            
                            return (
                              <div 
                                key={idx} 
                                className={`${isMatchingLine ? 'bg-yellow-900 -mx-4 px-4' : ''}`}
                              >
                                <span className="text-gray-500 mr-2 select-none">{lineNumber}</span>
                                {line}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-gray-400">No source code available</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Close button at the bottom */}
          <div className="w-full mt-4 border-t pt-4 flex justify-center">
            <div className="w-full h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <button 
                onClick={() => {
                  setOpen(false);
                  setViewingSaved(false);
                  setSelectedQuestion(null);
                }}
                className="text-white font-medium w-full h-full"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AskQuestionCard;
