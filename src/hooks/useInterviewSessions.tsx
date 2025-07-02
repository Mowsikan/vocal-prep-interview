
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type DatabaseSession = Database['public']['Tables']['interview_sessions']['Row'];

interface InterviewSession {
  id: string;
  questions: string[];
  answers: string[] | null;
  feedback: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  resume_text: string | null;
  pdf_report_url: string | null;
  created_at: string;
  completed_at: string | null;
}

const transformDatabaseSession = (dbSession: DatabaseSession): InterviewSession => {
  return {
    ...dbSession,
    questions: Array.isArray(dbSession.questions) ? dbSession.questions as string[] : [],
    answers: Array.isArray(dbSession.answers) ? dbSession.answers as string[] : null,
    status: (dbSession.status as 'in_progress' | 'completed' | 'abandoned') || 'in_progress'
  };
};

export const useInterviewSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);

  useEffect(() => {
    if (user) {
      fetchSessions();
    } else {
      setSessions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      setSessions((data || []).map(transformDatabaseSession));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (questions: string[], resumeText: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          questions: questions,
          resume_text: resumeText,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create interview session.",
          variant: "destructive",
        });
        return null;
      }

      setCurrentSession(transformDatabaseSession(data));
      await fetchSessions();
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<InterviewSession>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('interview_sessions')
        .update({
          ...updates,
          completed_at: updates.status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update interview session.",
          variant: "destructive",
        });
        return;
      }

      await fetchSessions();
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const completeSession = async (sessionId: string, answers: string[], feedback?: string) => {
    await updateSession(sessionId, {
      answers,
      feedback,
      status: 'completed'
    });
  };

  return {
    sessions,
    loading,
    currentSession,
    setCurrentSession,
    createSession,
    updateSession,
    completeSession,
    refetch: fetchSessions
  };
};
