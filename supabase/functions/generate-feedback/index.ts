import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { questions, answers, sessionId } = await req.json();

    if (!questions || !answers || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Questions, answers, and sessionId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create detailed feedback prompt
    const feedbackPrompt = `Analyze the following interview responses and provide detailed, constructive feedback:

QUESTIONS AND ANSWERS:
${questions.map((q: string, i: number) => `
Q${i + 1}: ${q}
A${i + 1}: ${answers[i] || 'No answer provided'}
`).join('\n')}

Please provide:
1. Overall assessment of the interview performance
2. Specific feedback for each answer (strengths and areas for improvement)
3. Communication skills assessment
4. Technical competency evaluation (if applicable)
5. Recommended next steps for improvement
6. Overall score out of 10

Format the response as a comprehensive feedback report that would be helpful for the candidate's professional development.`;

    console.log('Generating feedback for session:', sessionId);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an experienced interview coach and HR professional. Provide detailed, constructive feedback that helps candidates improve their interview skills and professional presentation.' 
          },
          { role: 'user', content: feedbackPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    // Update the interview session with feedback
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({ 
        feedback,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log('Feedback generated and saved for session:', sessionId);

    return new Response(
      JSON.stringify({ feedback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-feedback function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate feedback', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});