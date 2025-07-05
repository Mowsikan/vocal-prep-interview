
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { questions, answers, sessionId } = await req.json();

    if (!questions || !answers || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Questions, answers, and session ID are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Call Gemini API to generate feedback
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Create Q&A pairs for analysis
    const qaContent = questions.map((q: string, i: number) => 
      `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || 'No answer provided'}`
    ).join('\n\n');

    const prompt = `Analyze this interview session and provide comprehensive feedback:

${qaContent}

Please provide detailed feedback covering:

1. **Overall Performance Assessment**
   - Rate the candidate's performance (1-10 scale)
   - Highlight strengths and areas for improvement

2. **Individual Answer Analysis**
   - Evaluate each answer for relevance, depth, and clarity
   - Suggest improvements for weak responses

3. **Communication Skills**
   - Assess articulation, structure, and professionalism
   - Note any communication strengths or weaknesses

4. **Technical Competency** (if applicable)
   - Evaluate technical knowledge demonstrated
   - Identify gaps or strong technical points

5. **Recommendations for Improvement**
   - Specific actionable advice
   - Suggested areas for further development
   - Interview preparation tips

6. **Key Takeaways**
   - Main strengths to leverage
   - Priority areas to work on before next interviews

Format the response in a clear, professional manner that would be helpful for the candidate's development.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const feedback = geminiData.candidates[0].content.parts[0].text;

    // Update the session with the generated feedback
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({ feedback })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log('Feedback generated for session:', sessionId);

    return new Response(
      JSON.stringify({ 
        feedback,
        message: 'Feedback generated successfully'
      }),
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
