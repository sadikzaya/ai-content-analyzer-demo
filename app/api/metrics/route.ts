
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';

    const daysAgo = period === '30d' ? 30 : period === '24h' ? 1 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [
      totalContent,
      processedContent,
      sentimentDistribution,
      avgProcessingTime,
      queueStatus
    ] = await Promise.all([
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),

      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .not('processed_at', 'is', null)
        .gte('created_at', startDate.toISOString()),

      supabase
        .from('content_items')
        .select('ai_sentiment')
        .not('ai_sentiment', 'is', null)
        .gte('created_at', startDate.toISOString()),

      supabase
        .from('processing_metrics')
        .select('processing_time_ms')
        .gte('created_at', startDate.toISOString()),

      supabase
        .from('ai_queue')
        .select('status')
        .gte('created_at', startDate.toISOString())
    ]);

    const sentimentCounts = sentimentDistribution.data?.reduce((acc: any, item: any) => {
      acc[item.ai_sentiment] = (acc[item.ai_sentiment] || 0) + 1;
      return acc;
    }, {});

    const avgTime = avgProcessingTime.data?.length
      ? avgProcessingTime.data.reduce((sum: number, m: any) => sum + m.processing_time_ms, 0) / avgProcessingTime.data.length
      : 0;

    const queueBreakdown = queueStatus.data?.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return Response.json({
      success: true,
      period,
      metrics: {
        total_items: totalContent.count || 0,
        processed_items: processedContent.count || 0,
        processing_rate: totalContent.count 
          ? ((processedContent.count || 0) / totalContent.count * 100).toFixed(1) + '%'
          : '0%',
        avg_processing_time_ms: Math.round(avgTime),
        sentiment_distribution: sentimentCounts || {},
        queue_status: queueBreakdown || {},
        items_per_day: Math.round((totalContent.count || 0) / daysAgo)
      }
    });

  } catch (error) {
    console.error('Metrics error:', error);
    return Response.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
