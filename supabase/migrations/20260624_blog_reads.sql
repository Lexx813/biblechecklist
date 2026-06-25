-- ────────────────────────────────────────────────────────────────────────────
-- Blog read tracking (Tier 2): measure who ACTUALLY reads, not just who opens.
--
-- `blog_posts.view_count` increments on page mount, so it counts opens — a
-- bounce and a 5-minute read look identical. This adds a per-read-session row
-- carrying scroll depth + active (visible-tab) seconds, from which we derive a
-- "qualified read" (≥70% scrolled AND ≥30 active seconds).
--
-- Writes go ONLY through record_blog_read() (SECURITY DEFINER). The table has
-- RLS enabled with NO policies, so nothing but the definer functions can touch
-- it — the client never does a direct `.from('blog_reads').insert()`, which is
-- why this needs no rl_* BEFORE INSERT trigger (those guard client-direct
-- writes; see 20260424_rate_limits.sql). Idempotency comes from the
-- (session_id, post_id) upsert: re-sending on tab-hide/unmount updates the same
-- row to the running max instead of inflating counts.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.blog_reads (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references public.blog_posts(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,  -- null = anonymous reader
  session_id      text not null,        -- per-tab id from the client, dedupes a single read session
  max_scroll_pct  int  not null default 0,
  active_seconds  int  not null default 0,
  qualified       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (session_id, post_id)
);

alter table public.blog_reads enable row level security;
-- Intentionally no policies: only SECURITY DEFINER RPCs read/write this table.

create index if not exists idx_blog_reads_post    on public.blog_reads (post_id);
create index if not exists idx_blog_reads_created  on public.blog_reads (created_at desc);
create index if not exists idx_blog_reads_user     on public.blog_reads (user_id) where user_id is not null;

-- ── Record / update a read session ───────────────────────────────────────────
-- Called from the browser (anon + authenticated) on scroll-end / tab-hide /
-- unmount. Clamps inputs, recomputes `qualified` server-side from the running
-- max so the 70/30 thresholds live in exactly one place.
create or replace function public.record_blog_read(
  p_post_id        uuid,
  p_max_scroll_pct int,
  p_active_seconds int,
  p_session_id     text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_scroll  int := greatest(0, least(100,   coalesce(p_max_scroll_pct, 0)));
  v_seconds int := greatest(0, least(86400, coalesce(p_active_seconds, 0)));
begin
  -- Reject obviously bogus session ids and unknown posts rather than insert junk.
  if p_session_id is null or length(p_session_id) = 0 or length(p_session_id) > 64 then
    return;
  end if;
  if not exists (select 1 from blog_posts where id = p_post_id) then
    return;
  end if;

  insert into blog_reads (post_id, user_id, session_id, max_scroll_pct, active_seconds, qualified)
  values (p_post_id, auth.uid(), p_session_id, v_scroll, v_seconds, v_scroll >= 70 and v_seconds >= 30)
  on conflict (session_id, post_id) do update
    set max_scroll_pct = greatest(blog_reads.max_scroll_pct, excluded.max_scroll_pct),
        active_seconds = greatest(blog_reads.active_seconds, excluded.active_seconds),
        qualified      = (greatest(blog_reads.max_scroll_pct, excluded.max_scroll_pct) >= 70
                          and greatest(blog_reads.active_seconds, excluded.active_seconds) >= 30),
        -- promote anon → known user if they logged in mid-read
        user_id        = coalesce(blog_reads.user_id, excluded.user_id),
        updated_at     = now();
end;
$$;

grant execute on function public.record_blog_read(uuid, int, int, text) to anon, authenticated;

-- ── Admin dashboard aggregate ────────────────────────────────────────────────
-- Mirrors the admin_get_* convention in 20260523_admin_analytics_rpcs.sql:
-- SECURITY DEFINER, gated on is_admin(), returns a jsonb shape the AnalyticsTab
-- parses 1:1. `completion_rate` = qualified reads / opens (view_count).
create or replace function public.admin_get_blog_analytics(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result       jsonb;
  today_d      date := current_date;
  since        timestamptz := (current_date - greatest(p_days, 1) + 1)::timestamptz;
  summary      jsonb;
  top_posts    jsonb;
  reads_series jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  -- Window summary
  select jsonb_build_object(
    'totalReads',       coalesce(count(*), 0),
    'qualifiedReads',   coalesce(count(*) filter (where qualified), 0),
    'avgCompletionPct', coalesce(round(avg(max_scroll_pct)), 0)::int,
    'avgActiveSeconds', coalesce(round(avg(active_seconds)), 0)::int,
    'readers',          coalesce(count(distinct coalesce(user_id::text, session_id)), 0)
  )
  into summary
  from blog_reads
  where created_at >= since;

  -- Per-post leaderboard (published posts that got ≥1 read in the window)
  select coalesce(jsonb_agg(t order by t.qualified_reads desc, t.total_reads desc), '[]'::jsonb)
  into top_posts
  from (
    select bp.id,
           bp.title,
           bp.slug,
           coalesce(bp.view_count, 0)                               as views,
           count(br.id)::int                                        as total_reads,
           count(br.id) filter (where br.qualified)::int            as qualified_reads,
           coalesce(round(avg(br.max_scroll_pct)), 0)::int          as avg_completion_pct,
           coalesce(round(avg(br.active_seconds)), 0)::int          as avg_active_seconds,
           case when coalesce(bp.view_count, 0) > 0
                then round(count(br.id) filter (where br.qualified)::numeric * 100 / bp.view_count)::int
                else 0 end                                          as completion_rate
    from blog_posts bp
    join blog_reads br on br.post_id = bp.id and br.created_at >= since
    where bp.published = true
    group by bp.id, bp.title, bp.slug, bp.view_count
    limit 30
  ) t;

  -- Daily reads series (total + qualified) for the chart
  with day_series as (
    select (today_d - i)::date as d
    from generate_series(0, greatest(p_days, 1) - 1) as i
  )
  select coalesce(jsonb_agg(
           jsonb_build_object('date', to_char(ds.d, 'YYYY-MM-DD'), 'count', x.cnt, 'qualified', x.qcnt)
           order by ds.d
         ), '[]'::jsonb)
  into reads_series
  from day_series ds
  left join lateral (
    select count(*)::int as cnt, count(*) filter (where qualified)::int as qcnt
    from blog_reads br
    where br.created_at::date = ds.d
  ) x on true;

  result := jsonb_build_object(
    'summary',     coalesce(summary, '{}'::jsonb),
    'topPosts',    top_posts,
    'readsSeries', reads_series
  );
  return result;
end;
$$;

grant execute on function public.admin_get_blog_analytics(int) to authenticated;
