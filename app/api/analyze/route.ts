import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Analyze this content and return JSON only:
{
  "summary": "brief 1-sentence summary",
  "sentiment": "positive|negative|neutral",
  "tags": ["tag1", "tag2", "tag3"]
}

Content: ${content}`
      }]
    });

    const aiResponse = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
    
    const analysis = JSON.parse(aiResponse);
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
        model_used: 'claude-3-5-sonnet-20241022',
        tokens_used: message.usage.input_tokens + message.usage.output_tokens
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
