-- AI Content Analyzer Demo Schema
-- Shows: AI integration + real-time DB + performance

-- Main content table
create table public.content_items (
  id            bigserial primary key,
  user_id       uuid not null default gen_random_uuid(),
  content       text not null,
  ai_summary    text,
  ai_sentiment  text check (ai_sentiment in ('positive', 'negative', 'neutral')),
  ai_tags       text[],
  processed_at  timestamptz,
  created_at    timestamptz default now()
);

-- AI processing queue
create table public.ai_queue (
  id            bigserial primary key,
  content_id    bigint references public.content_items(id),
  status        text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts      int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Performance metrics table
create table public.processing_metrics (
  id                bigserial primary key,
  content_id        bigint references public.content_items(id),
  processing_time_ms int not null,
  model_used        text not null,
  tokens_used       int,
  created_at        timestamptz default now()
);

-- Indexes for performance
create index idx_content_user on public.content_items(user_id, created_at desc);
create index idx_content_sentiment on public.content_items(ai_sentiment) where ai_sentiment is not null;
create index idx_queue_status on public.ai_queue(status, created_at) where status = 'pending';
create index idx_metrics_time on public.processing_metrics(processing_time_ms);

-- Enable Row Level Security
alter table public.content_items enable row level security;
alter table public.ai_queue enable row level security;
alter table public.processing_metrics enable row level security;

-- Public read policy for demo
create policy "Enable read access for demo" on public.content_items for select using (true);
create policy "Enable read access for demo queue" on public.ai_queue for select using (true);
create policy "Enable read access for demo metrics" on public.processing_metrics for select using (true);
