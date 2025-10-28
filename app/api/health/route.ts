import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('count')
      .limit(1)
      .single();

    if (error) throw error;

    const responseTime = Date.now() - startTime;

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        response_time_ms: responseTime
      },
      uptime: process.uptime(),
    });

  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
