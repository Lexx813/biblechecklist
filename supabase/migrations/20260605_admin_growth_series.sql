-- Time-bucketed growth series for the admin Analytics tab.
--
-- The original admin_get_signups_series / admin_get_dau_series only bucket by
-- day. This adds a single RPC that buckets by day, week, month, or year so the
-- dashboard can offer "days / months / years" range views over one query.
--
-- p_metric: 'signups' (profiles.created_at) | 'dau' (distinct reading_activity users)
-- p_bucket: 'day' | 'week' | 'month' | 'year'
-- p_points: how many buckets back from today (clamped 1..730)
--
-- Returns: jsonb array of { date: 'YYYY-MM-DD' (bucket start), count: int } ascending.

create or replace function public.admin_get_growth_series(
  p_metric text default 'signups',
  p_bucket text default 'day',
  p_points int default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result    jsonb;
  v_trunc   text;
  v_step    interval;
  v_points  int := least(greatest(coalesce(p_points, 30), 1), 730);
  v_end     date := current_date;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  v_trunc := case lower(coalesce(p_bucket, 'day'))
               when 'year'  then 'year'
               when 'month' then 'month'
               when 'week'  then 'week'
               else 'day'
             end;
  v_step := case v_trunc
              when 'year'  then interval '1 year'
              when 'month' then interval '1 month'
              when 'week'  then interval '1 week'
              else interval '1 day'
            end;

  with buckets as (
    select generate_series(
      date_trunc(v_trunc, v_end::timestamp) - v_step * (v_points - 1),
      date_trunc(v_trunc, v_end::timestamp),
      v_step
    )::date as b
  ),
  counted as (
    select
      bk.b,
      case
        when lower(coalesce(p_metric, 'signups')) = 'dau' then (
          select count(distinct ra.user_id)::int
          from reading_activity ra
          where date_trunc(v_trunc, ra.activity_date::timestamp)::date = bk.b
        )
        else (
          select count(p.id)::int
          from profiles p
          where date_trunc(v_trunc, p.created_at::timestamp)::date = bk.b
        )
      end as cnt
    from buckets bk
  )
  select coalesce(
    jsonb_agg(jsonb_build_object('date', to_char(b, 'YYYY-MM-DD'), 'count', cnt) order by b),
    '[]'::jsonb
  )
  into result
  from counted;

  return result;
end;
$$;

grant execute on function public.admin_get_growth_series(text, text, int) to authenticated;
