-- Daily AI briefs — per-user warm paragraph greeting on HomePage.
--
-- Generated once per user per day by /api/daily-brief, cached here so
-- repeated HomePage loads don't re-bill the AI. Dismissal sets
-- dismissed_until to skip generation on quiet days.
--
-- Run in Supabase SQL Editor.

create table if not exists public.daily_briefs (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  brief_text       text not null,
  generated_at     timestamptz not null default now(),
  dismissed_until  timestamptz
);

alter table public.daily_briefs enable row level security;

drop policy if exists "daily_briefs_owner_select" on public.daily_briefs;
create policy "daily_briefs_owner_select"
  on public.daily_briefs for select using (auth.uid() = user_id);

drop policy if exists "daily_briefs_owner_insert" on public.daily_briefs;
create policy "daily_briefs_owner_insert"
  on public.daily_briefs for insert with check (auth.uid() = user_id);

drop policy if exists "daily_briefs_owner_update" on public.daily_briefs;
create policy "daily_briefs_owner_update"
  on public.daily_briefs for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_briefs_owner_delete" on public.daily_briefs;
create policy "daily_briefs_owner_delete"
  on public.daily_briefs for delete using (auth.uid() = user_id);
