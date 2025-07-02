
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Star, FileText, Clock, Download, Eye } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useInterviewSessions } from "@/hooks/useInterviewSessions";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const UserDashboard = () => {
  const { user } = useAuth();
  const { profile, isPremium, upgradeToPremium } = useProfile();
  const { sessions, loading } = useInterviewSessions();

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const inProgressSessions = sessions.filter(s => s.status === 'in_progress');

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'in_progress': 'secondary',
      'abandoned': 'destructive'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* User Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="font-medium">{profile?.full_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Status</p>
              <Badge variant={isPremium ? 'default' : 'secondary'} className="px-3 py-1">
                {isPremium ? (
                  <><Star className="w-3 h-3 mr-1" />Premium</>
                ) : (
                  'Free Account'
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Interviews</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{inProgressSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interview History */}
      <Card>
        <CardHeader>
          <CardTitle>Interview History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Sessions</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No interview sessions yet. Start your first interview to see your history here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>{session.questions.length} questions</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            {session.pdf_report_url && (
                              <Button variant="outline" size="sm">
                                <Download className="w-3 h-3 mr-1" />
                                Report
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{session.questions.length} questions</TableCell>
                      <TableCell>
                        {session.feedback ? (
                          <Badge variant="default">Available</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {session.pdf_report_url && (
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3 mr-1" />
                              Report
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="in_progress">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inProgressSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{session.questions.length} questions</TableCell>
                      <TableCell>
                        <Badge variant="secondary">In Progress</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Continue
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Premium Upgrade Section */}
      {!isPremium && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-blue-600" />
              <span>Upgrade to Premium</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-2">
                  Unlock voice interviews, AI feedback, and detailed reports
                </p>
                <p className="text-2xl font-bold text-blue-600">₹199 one-time</p>
              </div>
              <Button 
                onClick={upgradeToPremium}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Star className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserDashboard;
