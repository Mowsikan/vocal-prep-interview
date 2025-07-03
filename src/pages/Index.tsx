
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Mic, FileText, Star, Zap, CheckCircle, LogOut, User, BarChart3 } from "lucide-react";
import ResumeUpload from "@/components/ResumeUpload";
import InterviewSession from "@/components/InterviewSession";
import PremiumUpgrade from "@/components/PremiumUpgrade";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useInterviewSessions } from "@/hooks/useInterviewSessions";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, signOut } = useAuth();
  const { profile, isPremium, initializePayment, verifyPayment } = useProfile();
  const { createSession, currentSession, setCurrentSession, completeSession } = useInterviewSessions();
  const [currentStep, setCurrentStep] = useState<'upload' | 'questions' | 'interview' | 'feedback'>('upload');
  const [questions, setQuestions] = useState<string[]>([]);
  const [resumeData, setResumeData] = useState<string | null>(null);

  const handleResumeProcessed = async (extractedText: string, generatedQuestions: string[]) => {
    setResumeData(extractedText);
    setQuestions(generatedQuestions);
    
    // Create interview session in database
    if (user) {
      const session = await createSession(generatedQuestions, extractedText);
      if (session) {
        // Session is already transformed in the hook
      }
    }
    
    setCurrentStep('questions');
  };

  const handleStartInterview = () => {
    if (isPremium) {
      setCurrentStep('interview');
    }
  };

  const handleUpgradeToPremium = async () => {
    return await initializePayment();
  };

  const handleInterviewComplete = async (answers: string[]) => {
    if (currentSession) {
      await completeSession(currentSession.id, answers, "Interview completed successfully");
    }
    setCurrentStep('feedback');
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Interviewer
                </h1>
              </div>
              <Link to="/auth">
                <Button variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Master Your Next Interview
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get personalized AI-generated questions based on your resume. Practice with voice interactions and receive detailed feedback.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Get Started - Sign Up Free
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Interviewer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Badge variant={isPremium ? 'default' : 'secondary'} className="px-3 py-1">
                {isPremium ? (
                  <><Star className="w-3 h-3 mr-1" />Premium</>
                ) : (
                  'Free User'
                )}
              </Badge>
              <span className="text-sm text-gray-600">
                Welcome, {profile?.full_name || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            {['Upload Resume', 'Review Questions', 'Interview', 'Feedback'].map((step, index) => {
              const stepKeys = ['upload', 'questions', 'interview', 'feedback'];
              const isActive = stepKeys[index] === currentStep;
              const isCompleted = stepKeys.indexOf(currentStep) > index;
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                    {step}
                  </span>
                  {index < 3 && <div className="w-8 h-px bg-gray-300 mx-4" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hero Section (when on upload step) */}
        {currentStep === 'upload' && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Master Your Next Interview
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get personalized AI-generated questions based on your resume. Practice with voice interactions and receive detailed feedback.
            </p>
            
            {/* Feature Comparison */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Free Experience
                    <Badge variant="secondary">$0</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Upload resume (PDF)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">7 AI-generated questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">View questions only</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Premium Experience
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">₹1</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Everything in Free</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Voice-based interviews</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">AI feedback on answers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Downloadable PDF report</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'upload' && (
          <ResumeUpload onResumeProcessed={handleResumeProcessed} />
        )}

        {currentStep === 'questions' && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Your Interview Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {questions.map((question, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <p className="text-gray-700 flex-1">{question}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {!isPremium ? (
                  <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to Practice?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upgrade to Premium to start your voice-based interview and get detailed feedback
                    </p>
                    <PremiumUpgrade onUpgrade={handleUpgradeToPremium} />
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      onClick={handleStartInterview}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Start Voice Interview
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'interview' && isPremium && (
          <InterviewSession 
            questions={questions}
            onComplete={handleInterviewComplete}
          />
        )}

        {currentStep === 'feedback' && isPremium && (
          <div className="max-w-4xl mx-auto text-center">
            <Card>
              <CardContent className="py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Interview Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your feedback report is being generated. You can view all your interview history in your dashboard.
                </p>
                <div className="flex justify-center space-x-4">
                  <Link to="/dashboard">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Dashboard
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" onClick={() => setCurrentStep('upload')}>
                    Start New Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 AI Interviewer. Powered by Advanced AI Technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
