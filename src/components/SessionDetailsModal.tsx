
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

interface SessionDetailsModalProps {
  session: any;
  isOpen: boolean;
  onClose: () => void;
}

const SessionDetailsModal = ({ session, isOpen, onClose }: SessionDetailsModalProps) => {
  if (!session) return null;

  const handleDownloadReport = () => {
    if (session.pdf_report_url) {
      window.open(session.pdf_report_url, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Interview Session Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info */}
          <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{format(new Date(session.created_at), 'MMM dd, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(session.status)}>
                  {session.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="font-medium">{session.questions?.length || 0} questions</p>
              </div>
            </div>
          </div>

          {/* Questions and Answers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Questions & Answers</h3>
            {session.questions?.map((question: string, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-3">
                  <Badge variant="outline" className="mb-2">Q{index + 1}</Badge>
                  <p className="font-medium text-gray-900">{question}</p>
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">Answer</Badge>
                  <p className="text-gray-700 italic">
                    {session.answers && session.answers[index] 
                      ? session.answers[index] 
                      : "No answer provided"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Feedback */}
          {session.feedback && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">AI Feedback</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="whitespace-pre-wrap text-gray-700">
                  {session.feedback}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Session ID: {session.id}
            </div>
            <div className="flex space-x-2">
              {session.pdf_report_url && (
                <Button onClick={handleDownloadReport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailsModal;
