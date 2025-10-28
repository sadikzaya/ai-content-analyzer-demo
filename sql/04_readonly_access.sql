-- Grant read-only access for client demo
-- They can run all queries but cannot modify data

-- Create demo user role
create role client_demo_viewer with login password 'DemoSecure2024!';

-- Grant connection privileges
grant connect on database postgres to client_demo_viewer;

-- Grant usage on public schema
grant usage on schema public to client_demo_viewer;

-- Grant select on all tables
grant select on all tables in schema public to client_demo_viewer;

-- Grant select on future tables (if any are created)
alter default privileges in schema public 
  grant select on tables to client_demo_viewer;

-- Allow checking query performance
grant pg_read_all_stats to client_demo_viewer;

-- Connection string for client:
-- postgresql://client_demo_viewer:DemoSecure2024!@db.YOUR_PROJECT_REF.supabase.co:5432/postgres

-- Verification query (client should run this first)
-- Shows they have read access to all demo data
select 
  'content_items' as table_name,
  count(*) as row_count,
  min(created_at) as earliest_record,
  max(created_at) as latest_record
from public.content_items
union all
select 
  'processing_metrics',
  count(*),
  min(created_at),
  max(created_at)
from public.processing_metrics
union all
select 
  'ai_queue',
  count(*),
  min(created_at),
  max(created_at)
from public.ai_queue;