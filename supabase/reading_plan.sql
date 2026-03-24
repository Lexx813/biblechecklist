-- Add daily chapter goal to profiles
alter table public.profiles
  add column if not exists daily_chapter_goal int not null default 3
    check(daily_chapter_goal between 1 and 10);

-- 52-week heatmap RPC
create or replace function public.get_reading_heatmap(p_user_id uuid, p_days int default 364)
returns table(date text, chapters int) language sql stable security definer as $$
  with days as (
    select (current_date - gs)::date as d
    from generate_series(0, p_days - 1) gs
  )
  select d::text as date, coalesce(rl.chapters_read, 0) as chapters
  from days
  left join public.reading_log rl on rl.date = d and rl.user_id = p_user_id
  order by d asc;
$$;

-- Streak calculation RPC
create or replace function public.get_reading_streaks(p_user_id uuid)
returns jsonb language plpgsql stable security definer as $$
declare
  v_current int := 0;
  v_longest int := 0;
  v_run int := 0;
  v_prev date;
  v_row record;
  v_today date := current_date;
  v_anchor date;
begin
  -- Longest streak: walk all active days ascending
  for v_row in
    select date from public.reading_log where user_id=p_user_id and chapters_read>0 order by date asc
  loop
    if v_prev is null or v_row.date = v_prev + 1 then
      v_run := v_run + 1;
    else
      v_longest := greatest(v_longest, v_run);
      v_run := 1;
    end if;
    v_prev := v_row.date;
  end loop;
  v_longest := greatest(v_longest, v_run);

  -- Current streak: count backwards from today (or yesterday)
  if exists(select 1 from public.reading_log where user_id=p_user_id and date=v_today and chapters_read>0)
    then v_anchor := v_today;
  elsif exists(select 1 from public.reading_log where user_id=p_user_id and date=v_today-1 and chapters_read>0)
    then v_anchor := v_today - 1;
  end if;

  if v_anchor is not null then
    v_prev := v_anchor;
    loop
      exit when not exists(select 1 from public.reading_log where user_id=p_user_id and date=v_prev and chapters_read>0);
      v_current := v_current + 1;
      v_prev := v_prev - 1;
    end loop;
  end if;

  return jsonb_build_object('current_streak', v_current, 'longest_streak', v_longest);
end; $$;
