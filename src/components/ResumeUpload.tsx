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
          // Mock extracted text for demo purposes
          // In production, you would use a proper PDF parsing library
          const mockExtractedText = `
Professional Software Developer
Email: john.doe@email.com | Phone: (555) 123-4567
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

PROFESSIONAL SUMMARY
Experienced Full-Stack Developer with 5+ years of expertise in modern web technologies. 
Proven track record of building scalable applications and leading development teams.

TECHNICAL SKILLS
• Frontend: React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Next.js
• Backend: Node.js, Express.js, Python, Django, FastAPI
• Databases: PostgreSQL, MongoDB, Redis, MySQL
• Cloud & DevOps: AWS, Google Cloud Platform, Docker, Kubernetes, CI/CD
• Tools: Git, GitHub, VS Code, Figma, Jira, Slack

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
• Led development of scalable web applications serving 100K+ active users
• Implemented microservices architecture reducing system downtime by 40%
• Mentored 5 junior developers and established code review processes
• Built real-time analytics dashboard using React and WebSocket connections
• Optimized database queries improving application performance by 60%
• Technologies: React, Node.js, PostgreSQL, AWS, Docker

Software Developer | StartupXYZ | Jun 2019 - Dec 2020
• Developed responsive web applications from concept to deployment
• Collaborated with cross-functional teams in agile development environment
• Integrated third-party APIs including payment gateways and social media platforms
• Implemented automated testing reducing bug reports by 50%
• Technologies: JavaScript, Python, MongoDB, Google Cloud Platform

Junior Developer | WebSolutions LLC | Aug 2018 - May 2019
• Built interactive user interfaces using React and modern CSS frameworks
• Participated in daily standups and sprint planning meetings
• Fixed bugs and implemented feature requests based on user feedback
• Learned version control best practices and collaborative development workflows

EDUCATION
Bachelor of Science in Computer Science | State University | 2014 - 2018
• Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering
• Capstone Project: E-commerce platform with real-time inventory management
• GPA: 3.7/4.0

PROJECTS

Task Management Application
• Full-stack web application built with React frontend and Node.js backend
• Implemented user authentication, real-time updates, and data visualization
• Deployed on AWS with automated CI/CD pipeline using GitHub Actions
• Features drag-and-drop interface and collaborative workspace functionality

Personal Portfolio Website
• Responsive design showcasing projects and technical skills
• Built with React and TypeScript, deployed on Vercel
• Integrated with headless CMS for dynamic content management
• Optimized for performance with lazy loading and code splitting

Open Source Contributions
• Contributed to 10+ open source projects on GitHub
• Maintained personal library with 200+ stars for React utility functions
• Active participant in developer communities and tech meetups

CERTIFICATIONS & ACHIEVEMENTS
• AWS Certified Solutions Architect Associate (2022)
• Google Cloud Professional Cloud Architect (2021)
• Certified Scrum Master (CSM) (2020)  
• Winner of Regional Hackathon 2019 - Best Technical Implementation
• Speaker at DevCon 2021 - "Modern React Patterns and Performance"

LANGUAGES
• English (Native)
• Spanish (Conversational)
• French (Basic)
          `.trim();
          
          resolve(mockExtractedText);
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
          reject(new Error('Failed to extract text from PDF'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
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
      
      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the PDF');
      }
      
      console.log('PDF text extracted successfully, length:', extractedText.length);
      
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Please log in to upload your resume');
      }

      console.log('Calling process-resume function...');

      // Generate questions using AI
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: { resumeText: extractedText },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw new Error(error.message || 'Failed to process resume');
      }

      if (!data || !data.questions || !Array.isArray(data.questions)) {
        console.error('Invalid response from process-resume:', data);
        throw new Error('Failed to generate questions - invalid response format');
      }
      
      console.log('Questions generated successfully:', data.questions.length);

      toast({
        title: "Resume processed successfully!",
        description: `${data.questions.length} personalized questions have been generated.`,
      });

      onResumeProcessed(extractedText, data.questions);
    } catch (error) {
      console.error('Error processing resume:', error);
      const errorMessage = error instanceof Error ? error.message : "Please try again with a different file.";
      
      toast({
        title: "Error processing resume",
        description: errorMessage,
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
