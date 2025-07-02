
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload
    const payload = await req.json();
    console.log('Payment webhook received:', payload);

    // In a real implementation, you would:
    // 1. Verify the webhook signature from your payment provider
    // 2. Extract payment details (user_id, payment_id, amount, etc.)
    // 3. Update the user's premium status in the database

    // For demo purposes, we'll simulate a successful payment
    const { user_id, payment_status, payment_id } = payload;

    if (payment_status === 'completed' && user_id) {
      // Update user's premium status
      const { error } = await supabase
        .from('profiles')
        .update({
          premium_status: true,
          premium_purchased_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id);

      if (error) {
        console.error('Error updating premium status:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update premium status' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`Premium status updated for user: ${user_id}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Premium status updated successfully',
          payment_id 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid payment data' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Payment webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
