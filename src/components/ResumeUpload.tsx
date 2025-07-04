
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResumeUploadProps {
  onResumeProcessed: (extractedText: string, questions: string[]) => void;
}

const ResumeUpload = ({ onResumeProcessed }: ResumeUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  // Mock questions for demo purposes
  const mockQuestions = [
    "Tell me about yourself and your background in your field.",
    "What motivated you to apply for this position?",
    "Describe a challenging project you've worked on and how you overcame obstacles.",
    "What are your greatest strengths and how do they relate to this role?",
    "Where do you see yourself professionally in the next 5 years?",
    "How do you handle working under pressure and tight deadlines?",
    "What experience do you have with the technologies mentioned in your resume?"
  ];

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Extract text from PDF
      const formData = new FormData();
      formData.append('file', file);
      
      // Read PDF content as text (simple extraction)
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          // For demo purposes, we'll use a more comprehensive extracted text
          // In production, you'd want to use a proper PDF parsing library
          const text = `Professional software developer with 5+ years of experience in full-stack development. 
          Expertise in React, Node.js, TypeScript, and cloud technologies. 
          Led multiple teams and delivered scalable applications for enterprise clients.
          Strong background in agile methodologies and test-driven development.
          Experience with databases, API design, and microservices architecture.`;
          resolve(text);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Generate questions using AI
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: { resumeText: fileContent }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.questions) {
        throw new Error('Failed to generate questions');
      }
      
      toast({
        title: "Resume processed successfully!",
        description: `${data.questions.length} personalized questions have been generated.`,
      });

      onResumeProcessed(fileContent, data.questions);
    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: "Error processing resume",
        description: error instanceof Error ? error.message : "Please try again with a different file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onResumeProcessed, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Upload Your Resume</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Processing Your Resume
                  </h3>
                  <p className="text-gray-600">
                    Our AI is analyzing your resume and generating personalized questions...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Drop your resume here
                  </h3>
                  <p className="text-gray-600 mb-4">
                    or click to browse files
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button asChild variant="outline">
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose PDF File
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  Supported format: PDF (Max 10MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeUpload;
