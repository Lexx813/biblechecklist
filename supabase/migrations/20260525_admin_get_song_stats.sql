-- Admin song stats RPC
--
-- The previous useSongStats() hook read song_plays directly via supabase-js
-- with a 30-day filter and an ascending sort. PostgREST applies a default
-- 1000-row cap, so once total events in the window crossed 1000 the OLDEST
-- 1000 were kept and recent events were silently dropped — undercounting
-- every metric (plays, downloads, completes, shares, jw_org_clicks) and
-- making it look like newly-played songs were not being tracked.
--
-- This RPC aggregates server-side in a single round-trip, gated on
-- public.is_admin(), and returns the exact jsonb shape the frontend
-- already parses (totals, perSongRows, dailySeries, sourceBreakdown).

set search_path = public;

create or replace function public.admin_get_song_stats(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  since_ts timestamptz := now() - make_interval(days => p_days);
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  with events as (
    select song_id, event_type, source, created_at
    from public.song_plays
    where created_at >= since_ts
  ),
  totals as (
    select
      count(*) filter (where event_type = 'play')          as total_plays,
      count(*) filter (where event_type = 'complete')      as total_completes,
      count(*) filter (where event_type = 'download')      as total_downloads,
      count(*) filter (where event_type = 'jw_org_click')  as total_jw_clicks,
      count(*) filter (where event_type = 'share')         as total_shares
    from events
  ),
  per_song_agg as (
    select
      song_id,
      count(*) filter (where event_type = 'play')          as plays,
      count(*) filter (where event_type = 'complete')      as completes,
      count(*) filter (where event_type = 'download')      as downloads,
      count(*) filter (where event_type = 'share')         as shares,
      count(*) filter (where event_type = 'jw_org_click')  as jw_org_clicks
    from events
    group by song_id
  ),
  per_song_rows as (
    select
      s.id,
      s.slug,
      s.title,
      s.title_es,
      s.theme,
      s.primary_scripture_ref       as scripture_ref,
      coalesce(s.primary_scripture_text, '')    as primary_scripture_text,
      s.primary_scripture_text_es,
      coalesce(s.description, '')   as description,
      s.description_es,
      s.cover_image_url,
      coalesce(s.duration_seconds, 0) as duration_seconds,
      coalesce(s.jw_org_links, '[]'::jsonb) as jw_org_links,
      s.published,
      s.song_number,
      s.play_count       as all_time_plays,
      s.download_count   as all_time_downloads,
      coalesce(a.plays, 0)          as window_plays,
      coalesce(a.completes, 0)      as window_completes,
      coalesce(a.downloads, 0)      as window_downloads,
      coalesce(a.shares, 0)         as window_shares,
      coalesce(a.jw_org_clicks, 0)  as window_jw_org_clicks,
      case
        when coalesce(a.plays, 0) > 0
          then round(coalesce(a.completes, 0)::numeric / a.plays * 100)::int
        else null
      end as completion_pct,
      s.created_at
    from public.songs s
    left join per_song_agg a on a.song_id = s.id
  ),
  daily as (
    select
      to_char(created_at, 'YYYY-MM-DD') as date,
      count(*) filter (where event_type = 'play')     as plays,
      count(*) filter (where event_type = 'download') as downloads
    from events
    group by 1
    order by 1
  ),
  source_agg as (
    select coalesce(source, 'direct') as source, count(*) as count
    from events
    where event_type = 'play'
    group by 1
    order by count desc
  )
  select jsonb_build_object(
    'totalPlays',      (select coalesce(total_plays, 0) from totals),
    'totalCompletes',  (select coalesce(total_completes, 0) from totals),
    'totalDownloads',  (select coalesce(total_downloads, 0) from totals),
    'totalJwClicks',   (select coalesce(total_jw_clicks, 0) from totals),
    'totalShares',     (select coalesce(total_shares, 0) from totals),
    'perSongRows',     coalesce(
                         (select jsonb_agg(to_jsonb(r) - 'created_at' order by r.created_at asc)
                            from per_song_rows r),
                         '[]'::jsonb
                       ),
    'dailySeries',     coalesce(
                         (select jsonb_agg(jsonb_build_object(
                            'date', date, 'plays', plays, 'downloads', downloads
                          ) order by date asc)
                            from daily),
                         '[]'::jsonb
                       ),
    'sourceBreakdown', coalesce(
                         (select jsonb_agg(jsonb_build_object(
                            'source', source, 'count', count
                          ) order by count desc)
                            from source_agg),
                         '[]'::jsonb
                       )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.admin_get_song_stats(int) from public;
grant execute on function public.admin_get_song_stats(int) to authenticated;
