
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

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Create HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Interview Report</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #3b82f6;
                margin: 0;
            }
            .section {
                margin-bottom: 30px;
            }
            .section h2 {
                color: #1f2937;
                border-left: 4px solid #3b82f6;
                padding-left: 15px;
                margin-bottom: 15px;
            }
            .qa-item {
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f8fafc;
                border-radius: 5px;
            }
            .question {
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
            }
            .answer {
                color: #4b5563;
                font-style: italic;
            }
            .feedback {
                background-color: #eff6ff;
                padding: 20px;
                border-radius: 5px;
                border-left: 4px solid #3b82f6;
            }
            .date {
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>AI Interview Report</h1>
            <p class="date">Generated on ${new Date(session.completed_at || session.created_at).toLocaleDateString()}</p>
        </div>

        <div class="section">
            <h2>Interview Questions & Answers</h2>
            ${session.questions.map((question: string, index: number) => `
                <div class="qa-item">
                    <div class="question">Q${index + 1}: ${question}</div>
                    <div class="answer">A${index + 1}: ${session.answers && session.answers[index] ? session.answers[index] : 'No answer provided'}</div>
                </div>
            `).join('')}
        </div>

        ${session.feedback ? `
        <div class="section">
            <h2>AI Feedback & Analysis</h2>
            <div class="feedback">
                ${session.feedback.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>Session Information</h2>
            <p><strong>Session ID:</strong> ${session.id}</p>
            <p><strong>Started:</strong> ${new Date(session.created_at).toLocaleString()}</p>
            <p><strong>Completed:</strong> ${session.completed_at ? new Date(session.completed_at).toLocaleString() : 'Not completed'}</p>
            <p><strong>Status:</strong> ${session.status}</p>
        </div>
    </body>
    </html>
    `;

    // Generate PDF using Puppeteer
    const puppeteer = await import('https://deno.land/x/puppeteer@16.2.0/mod.ts');
    
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1in',
        bottom: '1in',
        left: '1in',
        right: '1in'
      }
    });
    
    await browser.close();

    // Upload PDF to Supabase Storage
    const fileName = `${session.user_id}/interview-report-${sessionId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    // Update session with PDF URL
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({ pdf_report_url: urlData.publicUrl })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log('PDF report generated for session:', sessionId);

    return new Response(
      JSON.stringify({ 
        pdfUrl: urlData.publicUrl,
        message: 'PDF report generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-pdf-report function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF report', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
