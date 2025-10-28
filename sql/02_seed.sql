-- Seed data: 50,000 realistic content items
-- Shows: Fast bulk insert + realistic AI use case

-- Sample content for AI analysis
with sample_content as (
  select unnest(array[
    'Just launched our new product! Customers are loving the AI-powered features. This is a game changer for our industry.',
    'Disappointed with the customer service. Waited 3 hours for a response. Not acceptable for a paid service.',
    'The documentation is comprehensive and well-organized. Made integration super easy.',
    'Experiencing severe performance issues. Dashboard takes 10+ seconds to load. Please fix ASAP.',
    'Absolutely thrilled with the results! ROI exceeded expectations within the first month.',
    'Neutral feedback: The product works as advertised. Nothing special, nothing bad.',
    'Amazing support team! They resolved my issue in under 5 minutes. Highly recommend.',
    'The pricing is too high for small businesses. Need a more affordable tier.',
    'Best decision we made this year. Team productivity increased by 40%.',
    'Bug in the export feature. Data gets corrupted when exporting large files.',
    'Love the new UI update! Much more intuitive and modern.',
    'Canceling subscription. Found a better alternative that costs half the price.',
    'Integration with Slack worked flawlessly. Saved us hours of manual work.',
    'The mobile app crashes constantly on Android 14. Unusable right now.',
    'Exceeded all expectations. This tool is exactly what we needed.',
    'Average product. Does the job but nothing extraordinary.',
    'Security features are top-notch. Passed our compliance audit easily.',
    'Onboarding process was confusing. Took us days to figure out basic features.',
    'Incredible AI capabilities! The insights are accurate and actionable.',
    'Not impressed. UI feels outdated and clunky compared to competitors.'
  ]) as content
)
insert into public.content_items (user_id, content, created_at)
select 
  gen_random_uuid(),
  sample_content.content,
  now() - (random() * interval '90 days')
from 
  sample_content,
  generate_series(1, 2500);

-- Add some already-processed items to show the "after" state
with processed_samples as (
  select 
    id,
    content,
    case 
      when content ilike '%love%' or content ilike '%amazing%' or content ilike '%excellent%' or content ilike '%thrilled%' then 'positive'
      when content ilike '%disappointed%' or content ilike '%terrible%' or content ilike '%awful%' or content ilike '%cancel%' then 'negative'
      else 'neutral'
    end as sentiment
  from public.content_items
  limit 10000
)
update public.content_items ci
set 
  ai_summary = left(ci.content, 100) || '...',
  ai_sentiment = ps.sentiment,
  ai_tags = array['customer-feedback', 'product-review'],
  processed_at = now() - (random() * interval '30 days')
from processed_samples ps
where ci.id = ps.id;

-- Insert processing metrics for demo
insert into public.processing_metrics (content_id, processing_time_ms, model_used, tokens_used)
select 
  id,
  (50 + random() * 200)::int,
  'claude-sonnet-4.5',
  (100 + random() * 400)::int
from public.content_items
where processed_at is not null;

-- Add items to queue
insert into public.ai_queue (content_id, status)
select 
  id,
  case 
    when random() < 0.8 then 'completed'
    when random() < 0.5 then 'processing'
    else 'pending'
  end
from public.content_items
where processed_at is not null;

-- Update queue updated_at
update public.ai_queue 
set updated_at = now() - (random() * interval '30 days')
select count(*) from content_items;
