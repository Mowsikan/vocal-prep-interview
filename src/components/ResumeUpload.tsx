
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploadProps {
  onResumeProcessed: (extractedText: string, questions: string[]) => void;
}

const ResumeUpload = ({ onResumeProcessed }: ResumeUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // For now, we'll use a simulated text extraction
          // In a real implementation, you'd use a PDF parsing library
          const mockExtractedText = `
Professional Software Developer
5+ years of experience in full-stack web development

TECHNICAL SKILLS:
- Frontend: React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express.js, Python, Django
- Databases: PostgreSQL, MongoDB, Redis
- Cloud: AWS, Google Cloud Platform, Docker, Kubernetes
- Tools: Git, GitHub, VS Code, Figma

EXPERIENCE:
Senior Software Engineer | TechCorp Inc. | 2021 - Present
- Led development of scalable web applications serving 100K+ users
- Implemented microservices architecture reducing system downtime by 40%
- Mentored junior developers and conducted code reviews
- Technologies: React, Node.js, PostgreSQL, AWS

Software Developer | StartupXYZ | 2019 - 2021
- Built responsive web applications from scratch
- Collaborated with cross-functional teams in agile environment
- Optimized database queries improving application performance by 60%
- Technologies: JavaScript, Python, MongoDB, Docker

EDUCATION:
Bachelor of Science in Computer Science | University ABC | 2015 - 2019
- Relevant coursework: Data Structures, Algorithms, Database Systems
- Capstone project: E-commerce platform with real-time analytics

PROJECTS:
Task Management App
- Full-stack application with React frontend and Node.js backend
- Implemented user authentication, real-time updates, and data visualization
- Deployed on AWS with CI/CD pipeline

Personal Portfolio Website
- Responsive design showcasing projects and skills
- Built with React and deployed on Vercel
- Integrated with headless CMS for content management

CERTIFICATIONS:
- AWS Certified Solutions Architect Associate
- Google Cloud Professional Cloud Architect
- Certified Scrum Master (CSM)
          `.trim();
          
          resolve(mockExtractedText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('Starting PDF text extraction...');
      
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file);
      console.log('PDF text extracted successfully');
      
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to upload your resume');
      }

      console.log('Calling process-resume function...');

      // Generate questions using AI
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: { resumeText: extractedText },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw new Error(error.message || 'Failed to process resume');
      }

      if (!data || !data.questions) {
        console.error('Invalid response from process-resume:', data);
        throw new Error('Failed to generate questions');
      }
      
      console.log('Questions generated successfully:', data.questions.length);

      toast({
        title: "Resume processed successfully!",
        description: `${data.questions.length} personalized questions have been generated.`,
      });

      onResumeProcessed(extractedText, data.questions);
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
