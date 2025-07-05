
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

  const initializePayment = async () => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Please log in to upgrade to premium.",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log('Initializing payment for user:', user.id);

      toast({
        title: "Initializing Payment",
        description: "Please wait while we set up your payment...",
      });

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to make a payment');
      }

      // Create payment order
      const { data, error } = await supabase.functions.invoke('create-payment-order', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data) {
        console.error('Payment initialization error:', error);
        throw new Error(error?.message || 'Failed to create payment order');
      }

      console.log('Payment order created successfully:', data.orderId);
      return data;
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const verifyPayment = async (paymentData: any) => {
    try {
      console.log('Payment successful, refreshing profile...');
      
      // Payment verification is handled by webhook
      // Just refresh the profile to get updated status
      await fetchProfile();
      
      toast({
        title: "Payment Successful!",
        description: "Welcome to Premium! All features are now unlocked.",
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support if the issue persists.",
        variant: "destructive",
      });
    }
  };

  return {
    profile,
    loading,
    isPremium: profile?.premium_status || false,
    initializePayment,
    verifyPayment,
    refetch: fetchProfile
  };
};
