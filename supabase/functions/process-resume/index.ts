
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
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Invalid user token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('Processing resume for user:', user.id);

    const { resumeText } = await req.json();

    if (!resumeText) {
      console.error('No resume text provided');
      return new Response(
        JSON.stringify({ error: 'Resume text is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Call Gemini API to generate personalized questions
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }

    console.log('Calling Gemini API for question generation...');

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
              text: `Based on this resume, generate exactly 5 personalized interview questions that are specific to the candidate's experience and skills. Focus on their background, achievements, and technical skills mentioned in the resume.

Resume content:
${resumeText}

Please provide exactly 5 questions in a JSON array format like this:
["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]

Make the questions challenging but fair, focusing on:
1. Technical skills and experience
2. Past achievements and projects
3. Problem-solving scenarios
4. Leadership or teamwork experience
5. Career goals and motivation

Only return the JSON array, nothing else.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API response received');

    const generatedText = geminiData.candidates[0].content.parts[0].text;

    // Extract JSON from the response
    let questions;
    try {
      const jsonMatch = generatedText.match(/\[.*\]/s);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in Gemini response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText);
      // Fallback questions if parsing fails
      questions = [
        "Tell me about your most challenging project and how you overcame obstacles.",
        "How do you stay updated with the latest technologies in your field?",
        "Describe a time when you had to work with a difficult team member.",
        "What motivates you in your career, and where do you see yourself in 5 years?",
        "Can you walk me through your problem-solving approach for complex technical issues?"
      ];
    }

    // Ensure we have exactly 5 questions
    if (!Array.isArray(questions) || questions.length !== 5) {
      console.warn('Invalid questions format, using fallback');
      questions = [
        "Tell me about your most significant professional achievement.",
        "How do you handle challenging situations or conflicts at work?",
        "What technical skills from your resume are you most proud of?",
        "Describe a project where you had to learn something new quickly.",
        "What are your career goals and how does this role fit into them?"
      ];
    }

    console.log('Generated questions successfully:', questions.length);

    return new Response(
      JSON.stringify({ 
        questions,
        message: 'Resume processed and questions generated successfully'
      }),
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
