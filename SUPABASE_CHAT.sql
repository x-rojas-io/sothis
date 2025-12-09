-- Create messages table for Chat System
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  sender_role text not null check (sender_role in ('admin', 'client')),
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS (Secure by default, no public access)
-- We will access this table ONLY via our API routes using the Service Role key
alter table public.messages enable row level security;

-- Optional: Create index for faster queries
create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_created_at_idx on public.messages(created_at);
