import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: Request) {
  const startTime = Date.now();
  const { content } = await req.json();

  try {
    const { data: contentItem, error: insertError } = await supabase
      .from('content_items')
      .insert({ content })
      .select()
      .single();

    if (insertError) throw insertError;

    await supabase
      .from('ai_queue')
      .insert({ content_id: contentItem.id, status: 'processing' });

    const prompt = `Analyze this content and return JSON only (no markdown, no code blocks):
{
  "summary": "brief 1-sentence summary",
  "sentiment": "positive|negative|neutral",
  "tags": ["tag1", "tag2", "tag3"]
}

Content: ${content}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    // Clean up markdown code blocks if present
    const cleanedResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysis = JSON.parse(cleanedResponse);
    const processingTime = Date.now() - startTime;

    await supabase
      .from('content_items')
      .update({
        ai_summary: analysis.summary,
        ai_sentiment: analysis.sentiment,
        ai_tags: analysis.tags,
        processed_at: new Date().toISOString()
      })
      .eq('id', contentItem.id);

    await supabase
      .from('ai_queue')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('content_id', contentItem.id);

    await supabase
      .from('processing_metrics')
      .insert({
        content_id: contentItem.id,
        processing_time_ms: processingTime,
        model_used: 'gemini-1.5-flash',
        tokens_used: 0 // Gemini doesn't provide token usage in free tier
      });

    return Response.json({
      success: true,
      data: {
        id: contentItem.id,
        ...analysis,
        processing_time_ms: processingTime
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({
      error: 'Analysis failed',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
