-- Learn-to-Study course progress
--
-- One row per (user, lesson). Exercise data is stored alongside since the
-- current course is 1 exercise per lesson. response_data is jsonb so we can
-- evolve exercise types without schema churn.

create table if not exists learn_lesson_progress (
  user_id        uuid references profiles(id) on delete cascade not null,
  lesson_id      text not null,
  unit_id        text not null,
  exercise_id    text,
  score          int,
  response_data  jsonb,
  completed_at   timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists learn_lesson_progress_user_idx
  on learn_lesson_progress (user_id);
create index if not exists learn_lesson_progress_lesson_idx
  on learn_lesson_progress (lesson_id);
create index if not exists learn_lesson_progress_completed_at_idx
  on learn_lesson_progress (completed_at desc);

-- RLS: users own their rows; admins can read all
alter table learn_lesson_progress enable row level security;

create policy "users select own learn progress" on learn_lesson_progress
  for select using (auth.uid() = user_id);

create policy "users insert own learn progress" on learn_lesson_progress
  for insert with check (auth.uid() = user_id);

create policy "users update own learn progress" on learn_lesson_progress
  for update using (auth.uid() = user_id);

create policy "users delete own learn progress" on learn_lesson_progress
  for delete using (auth.uid() = user_id);

create policy "admins select all learn progress" on learn_lesson_progress
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Touch updated_at on update
create or replace function learn_lesson_progress_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists learn_lesson_progress_touch_updated_at on learn_lesson_progress;
create trigger learn_lesson_progress_touch_updated_at
  before update on learn_lesson_progress
  for each row execute function learn_lesson_progress_touch_updated_at();

-- ── Admin stats RPC ──────────────────────────────────────────────────────────
-- Returns per-lesson completion counts and per-user summaries in two arrays
-- packed into a single jsonb. Security definer so the policy check happens
-- inside the function via the is_admin guard.

create or replace function admin_learn_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
  per_lesson      jsonb;
  per_user        jsonb;
  totals          jsonb;
begin
  select coalesce(p.is_admin, false) into caller_is_admin
  from profiles p where p.id = auth.uid();

  if not caller_is_admin then
    raise exception 'admin access required';
  end if;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into per_lesson
  from (
    select
      lesson_id,
      unit_id,
      count(*)::int                                    as completion_count,
      count(distinct user_id)::int                     as unique_users,
      max(completed_at)                                as latest_completion
    from learn_lesson_progress
    group by lesson_id, unit_id
    order by lesson_id
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into per_user
  from (
    select
      lp.user_id,
      pr.display_name,
      pr.email,
      pr.avatar_url,
      count(*)::int                                   as lessons_completed,
      max(lp.completed_at)                            as last_activity,
      min(lp.completed_at)                            as first_activity,
      array_agg(distinct lp.unit_id order by lp.unit_id) as units_touched
    from learn_lesson_progress lp
    left join profiles pr on pr.id = lp.user_id
    group by lp.user_id, pr.display_name, pr.email, pr.avatar_url
    order by lessons_completed desc, last_activity desc
    limit 500
  ) t;

  select jsonb_build_object(
    'unique_starters',     coalesce(count(distinct user_id), 0),
    'total_completions',   coalesce(count(*), 0),
    'first_activity',      min(completed_at),
    'last_activity',       max(completed_at)
  ) into totals
  from learn_lesson_progress;

  return jsonb_build_object(
    'per_lesson', per_lesson,
    'per_user',   per_user,
    'totals',     totals
  );
end;
$$;

revoke all on function admin_learn_stats() from public;
grant execute on function admin_learn_stats() to authenticated;
