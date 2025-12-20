-- Enable monitoring by creating a logs table
create table if not exists chat_logs (
  id uuid default gen_random_uuid() primary key,
  user_message text not null,
  ai_response text not null,
  metadata jsonb default '{}'::jsonb, -- Store detected language, model used, latency etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table chat_logs enable row level security;

-- Allow the service role (API) to insert logs
create policy "Service role can insert logs"
  on chat_logs
  for insert
  to service_role
  with check (true);

-- Allow admins to view logs (optional, if you have auth)
-- create policy "Admins can view logs"
--   on chat_logs
--   for select
--   to authenticated
--   using (auth.jwt() ->> 'role' = 'admin');

-- QUERIES FOR MONITORING:

-- 1. View all conversations sorted by time
-- select * from chat_logs order by created_at desc;

-- 2. Find unanswered questions (if you log errors or fallback messages)
-- select * from chat_logs where ai_response like '%book a session%' order by created_at desc;
