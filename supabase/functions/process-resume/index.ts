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

    const { resumeText } = await req.json();

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: 'Resume text is required' }),
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

    // Generate personalized questions based on resume
    const questionsPrompt = `Based on the following resume, generate 7 personalized interview questions that are relevant to the candidate's experience, skills, and background. Make the questions specific and tailored to their expertise:

Resume:
${resumeText}

Please return the questions as a JSON array of strings. Each question should be professional and relevant to their background.`;

    console.log('Generating questions for resume...');

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
            content: 'You are an expert HR interviewer. Generate relevant, professional interview questions based on the candidate\'s resume. Return only a valid JSON array of 7 question strings.' 
          },
          { role: 'user', content: questionsPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let questions;
    
    try {
      // Parse the AI response to extract questions
      const questionsText = data.choices[0].message.content.trim();
      // Remove any markdown formatting if present
      const cleanText = questionsText.replace(/```json\n?|\n?```/g, '');
      questions = JSON.parse(cleanText);
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback questions if AI response parsing fails
      questions = [
        "Tell me about yourself and your professional background.",
        "What motivated you to apply for this position?",
        "Describe a challenging project you've worked on and how you overcame obstacles.",
        "What are your greatest strengths and how do they relate to this role?",
        "Where do you see yourself professionally in the next 5 years?",
        "How do you handle working under pressure and tight deadlines?",
        "What experience do you have with the technologies mentioned in your resume?"
      ];
    }

    console.log('Generated questions:', questions);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-resume function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process resume', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});