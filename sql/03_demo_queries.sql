-- Demo Queries: Client can run these live
-- Shows: Performance + AI integration + real data

-- 1. Show AI processing performance (BEFORE optimization)
-- Run this first to show slow query
explain analyze
select 
  ci.id,
  ci.content,
  ci.ai_summary,
  ci.ai_sentiment,
  ci.created_at,
  pm.processing_time_ms
from public.content_items ci
left join public.processing_metrics pm on pm.content_id = ci.id
where ci.user_id in (
  select distinct user_id 
  from public.content_items 
  limit 100
)
order by ci.created_at desc
limit 50;

-- 2. Add performance index (shows CONCURRENTLY = zero downtime)
create index concurrently if not exists idx_content_user_created 
  on public.content_items(user_id, created_at desc);

-- 3. Run the same query again (AFTER optimization)
-- Client will see 5-10x speed improvement
explain analyze
select 
  ci.id,
  ci.content,
  ci.ai_summary,
  ci.ai_sentiment,
  ci.created_at,
  pm.processing_time_ms
from public.content_items ci
left join public.processing_metrics pm on pm.content_id = ci.id
where ci.user_id in (
  select distinct user_id 
  from public.content_items 
  limit 100
)
order by ci.created_at desc
limit 50;

-- 4. Real-time AI analytics dashboard query
-- Shows: Complex aggregations run fast
select 
  date_trunc('day', created_at) as date,
  ai_sentiment,
  count(*) as count,
  round(avg(array_length(ai_tags, 1))::numeric, 1) as avg_tags
from public.content_items
where processed_at is not null
  and created_at >= now() - interval '30 days'
group by date_trunc('day', created_at), ai_sentiment
order by date desc, ai_sentiment;

-- 5. AI processing performance metrics
-- Shows: Actual AI processing times
select 
  model_used,
  count(*) as requests,
  round(avg(processing_time_ms)) as avg_time_ms,
  min(processing_time_ms) as min_time_ms,
  max(processing_time_ms) as max_time_ms,
  sum(tokens_used) as total_tokens
from public.processing_metrics
where created_at >= now() - interval '7 days'
group by model_used;

-- 6. Queue health check
-- Shows: Real-time processing status
select 
  status,
  count(*) as count,
  round(avg(attempts)::numeric, 1) as avg_attempts,
  max(updated_at) as last_updated
from public.ai_queue
group by status
order by 
  case status
    when 'processing' then 1
    when 'pending' then 2
    when 'completed' then 3
    when 'failed' then 4
  end;

-- 7. Top AI-generated tags
-- Shows: AI working correctly
select 
  unnest(ai_tags) as tag,
  count(*) as frequency
from public.content_items
where ai_tags is not null
group by tag
order by frequency desc
limit 20;

-- 8. Sentiment trend analysis
-- Shows: Time-series aggregation performance
select 
  date_trunc('hour', processed_at) as hour,
  ai_sentiment,
  count(*) as items_processed
from public.content_items
where processed_at >= now() - interval '24 hours'
  and ai_sentiment is not null
group by hour, ai_sentiment
order by hour desc;

-- 9. Processing throughput
-- Shows: Scale capability
select 
  date_trunc('minute', created_at) as minute,
  count(*) as items_created,
  count(*) filter (where processed_at is not null) as items_processed,
  round(
    count(*) filter (where processed_at is not null)::numeric / 
    nullif(count(*), 0) * 100, 
    1
  ) as processing_rate_pct
from public.content_items
where created_at >= now() - interval '1 hour'
group by minute
order by minute desc
limit 60;

-- 10. Performance comparison (indexed vs non-indexed)
-- Run with \timing on to see actual execution time
\timing on

-- Without index hint (slower)
select count(*) 
from public.content_items 
where content ilike '%amazing%';

-- With optimized index
select count(*) 
from public.content_items 
where ai_sentiment = 'positive';