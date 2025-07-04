import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, SkipForward, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterviewSessionProps {
  questions: string[];
  onComplete: (answers: string[]) => void;
}

const InterviewSession = ({ questions, onComplete }: InterviewSessionProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Auto-speak the question when it changes
  useEffect(() => {
    speakQuestion();
  }, [currentQuestionIndex]);

  const speakQuestion = () => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setCurrentAnswer("");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentAnswer(finalTranscript);
        }
      };

      recognition.onerror = () => {
        toast({
          title: "Speech recognition error",
          description: "Please try again or check your microphone permissions.",
          variant: "destructive",
        });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Speech recognition not supported",
        description: "Please use a modern browser with speech recognition support.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      window.speechSynthesis.cancel();
    }
    setIsListening(false);
  };

  const handleCompleteInterview = async () => {
    setIsCompleting(true);
    
    try {
      // Generate AI feedback and PDF report
      const { supabase } = await import('@/integrations/supabase/client');
      
      // First, complete the interview with answers
      onComplete(userAnswers);
      
      toast({
        title: "Interview completed!",
        description: "Generating your feedback report...",
      });
    } catch (error) {
      console.error('Error completing interview:', error);
      toast({
        title: "Error",
        description: "Failed to complete interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentAnswer.trim()) {
      const newAnswers = [...userAnswers, currentAnswer];
      setUserAnswers(newAnswers);
      setCurrentAnswer("");

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Interview complete - pass answers to parent
        handleCompleteInterview();
      }
    } else {
      toast({
        title: "No answer recorded",
        description: "Please provide an answer before continuing.",
        variant: "destructive",
      });
    }
  };

  const handleSkipQuestion = () => {
    const newAnswers = [...userAnswers, ""];
    setUserAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleCompleteInterview();
    }
  };

  if (isCompleting) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto animate-spin mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Your Interview
            </h3>
            <p className="text-gray-600">
              Generating AI feedback and creating your detailed report...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Interview Progress</span>
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Interview Question</span>
            <Badge variant="outline">Question {currentQuestionIndex + 1}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
            <p className="text-lg text-gray-800 leading-relaxed">{currentQuestion}</p>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={speakQuestion}
              variant="outline"
              disabled={isSpeaking}
              className="flex-shrink-0"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {isSpeaking ? 'Speaking...' : 'Repeat Question'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Answer Recording */}
      <Card>
        <CardHeader>
          <CardTitle>Your Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Answer Display */}
            <div className="min-h-[120px] p-4 bg-gray-50 rounded-lg border">
              {currentAnswer ? (
                <p className="text-gray-800">{currentAnswer}</p>
              ) : (
                <p className="text-gray-500 italic">
                  {isListening ? 'Listening... speak your answer' : 'Click the microphone to start recording your answer'}
                </p>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  className={`${
                    isListening 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>

                {isListening && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSkipQuestion}
                  variant="outline"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer.trim()}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>Next Question</>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Interview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewSession;