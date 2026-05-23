-- Admin analytics RPCs
--
-- The frontend admin AnalyticsTab previously read profiles, reading_activity,
-- chapter_reads, forum_*, messages, etc. directly with supabase-js — under
-- RLS the admin's session only sees rows they personally own, so every KPI
-- on the dashboard collapsed to 0. These SECURITY DEFINER RPCs aggregate
-- the data server-side, gated on public.is_admin(), and return jsonb shapes
-- the frontend can parse 1:1 to its existing types.
--
-- One RPC per dashboard panel keeps each function small and lets the
-- frontend keep its existing Promise.all parallel fetch. Naming follows
-- the admin_* convention already used by admin_learn_stats / admin_list_users.

set search_path = public;

-- ── KPIs ──────────────────────────────────────────────────────────────────
create or replace function public.admin_get_analytics_kpis()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  today_d date := current_date;
  total_users int;
  new_users_week int;
  dau_today int;
  dau_last_week int;
  retention_30d int;
  chapters_today int;
  avg_streak int;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  select count(*) into total_users from profiles;
  select count(*) into new_users_week from profiles where created_at >= today_d - 7;
  select count(distinct user_id) into dau_today from reading_activity where activity_date = today_d;
  select count(distinct user_id) into dau_last_week from reading_activity where activity_date = today_d - 7;
  select count(*) into chapters_today from chapter_reads where read_at >= today_d::timestamptz;

  -- 30-day retention: of users created 30–60d ago, what % were active in last 30d
  with cohort as (
    select id from profiles
    where created_at >= (today_d - 60)::timestamptz
      and created_at <  (today_d - 30)::timestamptz
  ),
  active as (
    select distinct user_id from reading_activity where activity_date >= today_d - 30
  )
  select coalesce(round(
    count(active.user_id)::numeric / nullif(count(cohort.id), 0) * 100
  ), 0)::int
  into retention_30d
  from cohort
  left join active on active.user_id = cohort.id;

  -- avg streak: per-user current streak (consecutive days ending today or
  -- yesterday) from last 90 days of reading_activity, averaged across users
  -- whose streak > 0. Matches the JS computeCurrentStreak in src/api/admin.ts.
  with user_dates as (
    select distinct user_id, activity_date
    from reading_activity
    where activity_date >= today_d - 90
  ),
  grouped as (
    -- consecutive-days trick: subtract row_number() (per user, ordered by date)
    -- from the date; same-streak rows collapse into one group
    select user_id, activity_date,
           activity_date - (row_number() over (partition by user_id order by activity_date))::int as grp
    from user_dates
  ),
  runs as (
    select user_id, grp, count(*)::int as run_len, max(activity_date) as run_end
    from grouped
    group by user_id, grp
  ),
  current_runs as (
    -- a run counts as the user's current streak iff it ended today or yesterday
    select user_id, run_len
    from runs
    where run_end >= today_d - 1
  )
  select coalesce(round(avg(run_len))::int, 0)
  into avg_streak
  from current_runs;

  return jsonb_build_object(
    'totalUsers',       coalesce(total_users, 0),
    'newUsersThisWeek', coalesce(new_users_week, 0),
    'dailyActiveToday', coalesce(dau_today, 0),
    'dauChangePct',     case when coalesce(dau_last_week, 0) > 0
                           then round((dau_today - dau_last_week)::numeric / dau_last_week * 100)::int
                           else 0 end,
    'retentionPct30d',  coalesce(retention_30d, 0),
    'chaptersToday',    coalesce(chapters_today, 0),
    'avgStreak',        coalesce(avg_streak, 0)
  );
end;
$$;

-- ── Signups series (per day for last N days) ──────────────────────────────
create or replace function public.admin_get_signups_series(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  today_d date := current_date;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  with day_series as (
    select (today_d - i)::date as d
    from generate_series(0, greatest(p_days, 1) - 1) as i
  )
  select coalesce(jsonb_agg(jsonb_build_object('date', to_char(d, 'YYYY-MM-DD'), 'count', cnt) order by d), '[]'::jsonb)
  into result
  from (
    select ds.d, count(p.id)::int as cnt
    from day_series ds
    left join profiles p on p.created_at::date = ds.d
    group by ds.d
  ) t;

  return result;
end;
$$;

-- ── DAU series (per day for last N days) ──────────────────────────────────
create or replace function public.admin_get_dau_series(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  today_d date := current_date;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  with day_series as (
    select (today_d - i)::date as d
    from generate_series(0, greatest(p_days, 1) - 1) as i
  )
  select coalesce(jsonb_agg(jsonb_build_object('date', to_char(d, 'YYYY-MM-DD'), 'count', cnt) order by d), '[]'::jsonb)
  into result
  from (
    select ds.d, count(distinct ra.user_id)::int as cnt
    from day_series ds
    left join reading_activity ra on ra.activity_date = ds.d
    group by ds.d
  ) t;

  return result;
end;
$$;

-- ── Feature usage (% of total users active per feature in last 30d) ───────
create or replace function public.admin_get_feature_usage()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  today_d date := current_date;
  total_users int;
  pct_for_users record;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  select greatest(count(*), 1) into total_users from profiles;

  -- learn_lesson_progress may not exist on older environments; guard with a
  -- separate query and treat absence as 0 rather than failing the whole RPC.
  with reading_u as (
    select distinct user_id from reading_activity where activity_date >= today_d - 30
  ),
  forum_u as (
    select author_id as user_id from forum_threads where created_at >= (today_d - 30)::timestamptz
    union
    select author_id from forum_replies where created_at >= (today_d - 30)::timestamptz
  ),
  msg_u as (
    select distinct sender_id as user_id from messages where created_at >= (today_d - 30)::timestamptz
  ),
  quiz_u as (
    select distinct user_id from challenge_attempts where created_at >= (today_d - 30)::timestamptz
  ),
  notes_u as (
    select distinct user_id from study_notes where created_at >= (today_d - 30)::timestamptz
  ),
  groups_u as (
    select distinct user_id from study_group_members
  ),
  videos_u as (
    select user_id from video_likes where created_at >= (today_d - 30)::timestamptz
    union
    select author_id from video_comments where created_at >= (today_d - 30)::timestamptz
  ),
  learn_u as (
    select distinct user_id from learn_lesson_progress where completed_at >= (today_d - 30)::timestamptz
  )
  select jsonb_agg(jsonb_build_object('feature', feature, 'pct', pct) order by pct desc)
  into result
  from (
    select 'Reading'::text  as feature, round(count(*)::numeric * 100 / total_users)::int as pct from reading_u
    union all
    select 'Forum',          round(count(*)::numeric * 100 / total_users)::int from forum_u
    union all
    select 'Messages',       round(count(*)::numeric * 100 / total_users)::int from msg_u
    union all
    select 'Quiz',           round(count(*)::numeric * 100 / total_users)::int from quiz_u
    union all
    select 'Notes',          round(count(*)::numeric * 100 / total_users)::int from notes_u
    union all
    select 'Groups',         round(count(*)::numeric * 100 / total_users)::int from groups_u
    union all
    select 'Videos',         round(count(*)::numeric * 100 / total_users)::int from videos_u
    union all
    select 'Learn',          round(count(*)::numeric * 100 / total_users)::int from learn_u
  ) f;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ── Retention cohorts (weekly cohorts active in last 7d) ──────────────────
create or replace function public.admin_get_retention_cohorts()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  today_d date := current_date;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  with active as (
    select distinct user_id from reading_activity where activity_date >= today_d - 7
  ),
  cohort_defs(label, weeks_ago, window_days, sort_ord) as (
    values
      ('Week 1'::text,   1,  7,  1),
      ('Week 2',         2,  7,  2),
      ('Week 4',         4,  7,  3),
      ('Week 8',         8,  7,  4),
      ('Week 12+',      12, 30,  5)
  )
  select jsonb_agg(jsonb_build_object('label', label, 'pct', pct) order by sort_ord)
  into result
  from (
    select c.label, c.sort_ord,
           coalesce(round(
             count(active.user_id)::numeric / nullif(count(p.id), 0) * 100
           ), 0)::int as pct
    from cohort_defs c
    left join lateral (
      select id from profiles p
      where p.created_at >= (today_d - (c.weeks_ago * 7 + c.window_days))::timestamptz
        and p.created_at <  (today_d - (c.weeks_ago * 7))::timestamptz
    ) p on true
    left join active on active.user_id = p.id
    group by c.label, c.sort_ord
  ) t;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ── Reading adoption buckets ──────────────────────────────────────────────
create or replace function public.admin_get_reading_adoption()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  today_d date := current_date;
  has_plan int;
  active_month int;
  active_today int;
  completed_plan int;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  select count(distinct user_id) into has_plan from user_reading_plans;
  select count(distinct user_id) into active_month from reading_activity where activity_date >= today_d - 30;
  select count(distinct user_id) into active_today from reading_activity where activity_date = today_d;
  select count(distinct user_id) into completed_plan from reading_plan_completions;

  return jsonb_build_array(
    jsonb_build_object('bucket', 'Has reading plan',  'count', has_plan),
    jsonb_build_object('bucket', 'Active this month', 'count', active_month),
    jsonb_build_object('bucket', 'Read today',        'count', active_today),
    jsonb_build_object('bucket', 'Completed a plan',  'count', completed_plan)
  );
end;
$$;

-- ── Completion histogram (% of 1189 chapters read, bucketed) ──────────────
create or replace function public.admin_get_completion_histogram()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  with per_user as (
    select user_id, count(distinct (book_index::text || '-' || chapter::text))::numeric as chapters_read
    from chapter_reads
    group by user_id
  ),
  all_users as (
    select p.id, coalesce(pu.chapters_read, 0) / 1189.0 as pct
    from profiles p
    left join per_user pu on pu.user_id = p.id
  ),
  buckets(ord, bucket, lo, hi) as (
    values
      (1, '0–10%'::text,  0::numeric,    0.1::numeric),
      (2, '10–25%',       0.1,           0.25),
      (3, '25–50%',       0.25,          0.5),
      (4, '50–75%',       0.5,           0.75),
      (5, '75–99%',       0.75,          1.0),
      (6, '100%',         1.0,           1.01)
  )
  select jsonb_agg(jsonb_build_object('bucket', bucket, 'count', cnt) order by ord)
  into result
  from (
    select b.ord, b.bucket,
           (select count(*)::int from all_users u where u.pct >= b.lo and u.pct < b.hi) as cnt
    from buckets b
  ) t;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ── Book heatmap (% of users who read at least one chapter from each book)
create or replace function public.admin_get_book_heatmap()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  total_users int;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  select greatest(count(*), 1) into total_users from profiles;

  with per_book as (
    select book_index, count(distinct user_id)::int as readers
    from chapter_reads
    group by book_index
  )
  select jsonb_agg(jsonb_build_object('bookIndex', i, 'pct', pct) order by i)
  into result
  from (
    select i,
           coalesce(round(pb.readers::numeric * 100 / total_users), 0)::int as pct
    from generate_series(0, 65) as i
    left join per_book pb on pb.book_index = i
  ) t;

  return coalesce(result, '[]'::jsonb);
end;
$$;

-- ── Feature drill-down (top users by activity count, last 30d) ────────────
-- Returns a jsonb array of {user_id, display_name, email, avatar_url, count,
-- last_activity}. The frontend currently composes this from three separate
-- queries (rows + profiles + email RPC); doing it server-side avoids the
-- RLS-blocked profiles SELECT and the round-trip dance.
create or replace function public.admin_get_feature_leaders(
  p_feature text,
  p_limit   int default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  today_d date := current_date;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  with raw as (
    select user_id, activity_date::timestamptz as ts
    from reading_activity
    where p_feature = 'Reading' and activity_date >= today_d - 30

    union all
    select author_id as user_id, created_at as ts
    from forum_threads
    where p_feature = 'Forum' and created_at >= (today_d - 30)::timestamptz

    union all
    select author_id as user_id, created_at as ts
    from forum_replies
    where p_feature = 'Forum' and created_at >= (today_d - 30)::timestamptz

    union all
    select sender_id as user_id, created_at as ts
    from messages
    where p_feature = 'Messages' and created_at >= (today_d - 30)::timestamptz

    union all
    select user_id, created_at as ts
    from challenge_attempts
    where p_feature = 'Quiz' and created_at >= (today_d - 30)::timestamptz

    union all
    select user_id, created_at as ts
    from study_notes
    where p_feature = 'Notes' and created_at >= (today_d - 30)::timestamptz

    union all
    select user_id, joined_at as ts
    from study_group_members
    where p_feature = 'Groups'

    union all
    select user_id, created_at as ts
    from video_likes
    where p_feature = 'Videos' and created_at >= (today_d - 30)::timestamptz

    union all
    select author_id as user_id, created_at as ts
    from video_comments
    where p_feature = 'Videos' and created_at >= (today_d - 30)::timestamptz

    union all
    select user_id, completed_at as ts
    from learn_lesson_progress
    where p_feature = 'Learn' and completed_at >= (today_d - 30)::timestamptz
  ),
  ranked as (
    select user_id, count(*)::int as cnt, max(ts) as last_ts
    from raw
    where user_id is not null
    group by user_id
    order by cnt desc
    limit greatest(p_limit, 1)
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id',       r.user_id,
      'display_name',  pr.display_name,
      'email',         (select au.email from auth.users au where au.id = r.user_id),
      'avatar_url',    pr.avatar_url,
      'count',         r.cnt,
      'last_activity', r.last_ts
    ) order by r.cnt desc
  ), '[]'::jsonb)
  into result
  from ranked r
  left join profiles pr on pr.id = r.user_id;

  return result;
end;
$$;

-- Grants — same pattern as existing admin_* functions
grant execute on function public.admin_get_analytics_kpis()         to authenticated;
grant execute on function public.admin_get_signups_series(int)      to authenticated;
grant execute on function public.admin_get_dau_series(int)          to authenticated;
grant execute on function public.admin_get_feature_usage()          to authenticated;
grant execute on function public.admin_get_retention_cohorts()      to authenticated;
grant execute on function public.admin_get_reading_adoption()       to authenticated;
grant execute on function public.admin_get_completion_histogram()   to authenticated;
grant execute on function public.admin_get_book_heatmap()           to authenticated;
grant execute on function public.admin_get_feature_leaders(text,int) to authenticated;
