
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  premium_status: boolean;
  premium_purchased_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          premium_status: true,
          premium_purchased_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to upgrade to premium. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        premium_status: true,
        premium_purchased_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : null);

      toast({
        title: "Premium Upgrade Successful!",
        description: "Welcome to Premium! All features are now unlocked.",
      });

    } catch (error) {
      console.error('Error upgrading to premium:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    profile,
    loading,
    isPremium: profile?.premium_status || false,
    upgradeToPremium,
    refetch: fetchProfile
  };
};
