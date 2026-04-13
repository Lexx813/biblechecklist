-- Fix high Disk IO: index reading_activity and rewrite get_reading_streak to avoid temp tables

-- 1. Index reading_activity for fast per-user streak lookups
CREATE INDEX IF NOT EXISTS idx_reading_activity_user_date
  ON public.reading_activity(user_id, activity_date DESC);

-- 2. Index notifications for streak_reminder_candidates dedup check
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created
  ON public.notifications(user_id, type, created_at);

-- 3. Rewrite get_reading_streak — removes the temp table (major IO source)
CREATE OR REPLACE FUNCTION get_reading_streak(p_user_id uuid)
RETURNS TABLE(current_streak int, longest_streak int, total_days int)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH active_days AS (
    SELECT DISTINCT activity_date AS active_date
    FROM public.reading_activity
    WHERE user_id = p_user_id

    UNION

    SELECT DISTINCT used_date AS active_date
    FROM public.streak_freeze_uses
    WHERE user_id = p_user_id
  ),
  ordered AS (
    SELECT
      active_date,
      active_date - (ROW_NUMBER() OVER (ORDER BY active_date))::int AS grp
    FROM active_days
  ),
  runs AS (
    SELECT
      grp,
      MIN(active_date) AS run_start,
      MAX(active_date) AS run_end,
      COUNT(*)::int    AS run_len
    FROM ordered
    GROUP BY grp
  ),
  anchor AS (
    SELECT run_start, run_end, run_len
    FROM runs
    WHERE run_end >= CURRENT_DATE - 1
    ORDER BY run_end DESC
    LIMIT 1
  )
  SELECT
    COALESCE((SELECT run_len FROM anchor), 0)::int AS current_streak,
    COALESCE((SELECT MAX(run_len) FROM runs), 0)::int AS longest_streak,
    (SELECT COUNT(*)::int FROM active_days) AS total_days;
$$;
