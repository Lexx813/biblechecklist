-- supabase/migrations/add_gamification.sql

-- 1. Add freeze_tokens column to profiles
alter table profiles add column if not exists freeze_tokens int not null default 2;

-- 2. Streak freeze usage log
create table if not exists streak_freeze_uses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  used_date date not null,
  created_at timestamptz default now(),
  unique(user_id, used_date)
);

alter table streak_freeze_uses enable row level security;

create policy "Users manage own freeze uses"
  on streak_freeze_uses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. User badges
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_key)
);

alter table user_badges enable row level security;

create policy "Users read own badges"
  on user_badges for select
  using (auth.uid() = user_id);

create policy "Authenticated users read all badges"
  on user_badges for select
  using (auth.role() = 'authenticated');

create policy "Users insert own badges"
  on user_badges for insert
  with check (auth.uid() = user_id);

-- 4. RPC to safely decrement freeze_tokens (min 0)
create or replace function decrement_freeze_token(p_user_id uuid)
returns void
language sql
security definer
as $$
  update profiles
  set freeze_tokens = greatest(0, freeze_tokens - 1)
  where id = p_user_id;
$$;

-- 5. Update get_reading_streak RPC to treat freeze dates as active days
create or replace function get_reading_streak(p_user_id uuid)
returns table(current_streak int, longest_streak int, total_days int)
language plpgsql
security definer
as $$
declare
  today_str date := current_date;
  yest_str  date := current_date - 1;
  cur_streak int := 0;
  lng_streak int := 0;
  tot_days   int := 0;
  d          date;
  anchor     date;
  prev_date  date := null;
  run_len    int  := 0;
begin
  -- Combined active days: reading_activity UNION streak_freeze_uses
  create temp table _active_days on commit drop as
  select distinct read_date::date as active_date
  from reading_activity
  where user_id = p_user_id
  union
  select distinct used_date as active_date
  from streak_freeze_uses
  where user_id = p_user_id;

  select count(*) into tot_days from _active_days;

  if exists (select 1 from _active_days where active_date = today_str) then
    anchor := today_str;
  elsif exists (select 1 from _active_days where active_date = yest_str) then
    anchor := yest_str;
  end if;

  if anchor is not null then
    d := anchor;
    loop
      if exists (select 1 from _active_days where active_date = d) then
        cur_streak := cur_streak + 1;
        d := d - 1;
      else
        exit;
      end if;
    end loop;
  end if;

  for d in (select active_date from _active_days order by active_date desc) loop
    if prev_date is null or prev_date - d = 1 then
      run_len := run_len + 1;
      lng_streak := greatest(lng_streak, run_len);
    else
      run_len := 1;
    end if;
    prev_date := d;
  end loop;
  lng_streak := greatest(lng_streak, run_len);

  return query select cur_streak, lng_streak, tot_days;
end;
$$;

-- Indexes
create index if not exists idx_streak_freeze_uses_user_date
  on streak_freeze_uses(user_id, used_date desc);

create index if not exists idx_user_badges_user
  on user_badges(user_id);
