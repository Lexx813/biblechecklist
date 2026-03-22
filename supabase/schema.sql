-- Run this in your Supabase SQL Editor

create table public.reading_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security so users can only access their own data
alter table public.reading_progress enable row level security;

create policy "Users can manage own progress"
  on public.reading_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
