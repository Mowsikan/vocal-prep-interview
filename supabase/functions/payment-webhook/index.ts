
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

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

    // Get Razorpay webhook secret
    const razorpayWebhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    
    // Parse the webhook payload
    const body = await req.text();
    const payload = JSON.parse(body);
    console.log('Razorpay webhook received:', payload.event);

    // Verify webhook signature if secret is provided
    if (razorpayWebhookSecret) {
      const signature = req.headers.get('x-razorpay-signature');
      if (!signature) {
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const expectedSignature = createHmac('sha256', razorpayWebhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Handle payment success
    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // Update payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .update({
          payment_id: paymentId,
          status: 'completed',
          payment_method: payment.method,
          updated_at: new Date().toISOString(),
          metadata: payment
        })
        .eq('order_id', orderId)
        .select('user_id')
        .single();

      if (paymentError || !paymentRecord) {
        console.error('Error updating payment record:', paymentError);
        return new Response(
          JSON.stringify({ error: 'Payment record not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update user's premium status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          premium_status: true,
          premium_purchased_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.user_id);

      if (profileError) {
        console.error('Error updating premium status:', profileError);
        return new Response(
          JSON.stringify({ error: 'Failed to update premium status' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`Premium status updated for user: ${paymentRecord.user_id}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Premium status updated successfully',
          payment_id: paymentId 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle payment failure
    if (payload.event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;

      // Update payment record
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          metadata: payment
        })
        .eq('order_id', orderId);

      console.log(`Payment failed for order: ${orderId}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
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
