-- ============================================================================
-- Fix reading streaks + leaderboards
-- ============================================================================
-- Bugs fixed:
--   0. Verse-level reading (reading_activity) never counted — only whole
--      chapters in reading_log did. Both now count.
--   1. profiles.current_streak was only recomputed when the user wrote to
--      reading_log, so a streak never decayed: someone who stopped reading in
--      July still showed their July streak. We now cache the run length plus
--      the last active date, and get_reading_streaks() zeroes the streak at
--      read time when that date is older than yesterday.
--   2. Streak freezes (streak_freeze_uses) were never consulted, so using a
--      freeze token did not protect the streak. A frozen day now bridges the
--      gap (it keeps the run alive but does not add to it).
--   3. Streaks were anchored on UTC current_date at write time. The client
--      now logs the user's local date and passes it as p_today, so reads in
--      the evening (US) or early morning (Asia/Oceania) land on the right day.
--   4. Leaderboards: deterministic tie-breakers, and the reading leaderboard
--      now returns each reader's live current_streak.
--
-- Safe to re-run. All existing callers pass only p_user_id and keep working.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_date date;

-- ── Streak computation ─────────────────────────────────────────────────────
-- Active day = a read day (reading_log chapters_read > 0, or a reading_activity
-- mark), or a day covered by a freeze.
-- current_streak = read days in the run ending at the latest active day.
DROP FUNCTION IF EXISTS public._compute_reading_streak(uuid);
CREATE FUNCTION public._compute_reading_streak(p_user_id uuid)
RETURNS TABLE(current_streak integer, longest_streak integer, last_active_date date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row record;
  v_prev date;
  v_run int := 0;
  v_longest int := 0;
BEGIN
  FOR v_row IN
    SELECT d, bool_or(is_read) AS is_read
    FROM (
      SELECT date AS d, true AS is_read
      FROM public.reading_log
      WHERE user_id = p_user_id AND chapters_read > 0
      UNION ALL
      -- Any mark-as-read (incl. single verses) records a reading_activity
      -- day. Before 2026-09-28 that table also logged plain page opens, so
      -- only later rows count.
      SELECT activity_date AS d, true AS is_read
      FROM public.reading_activity
      WHERE user_id = p_user_id AND activity_date >= DATE '2026-09-28'
      UNION ALL
      SELECT used_date AS d, false AS is_read
      FROM public.streak_freeze_uses
      WHERE user_id = p_user_id
    ) s
    GROUP BY d
    ORDER BY d ASC
  LOOP
    IF v_prev IS NULL OR v_row.d <> v_prev + 1 THEN
      v_run := 0;
    END IF;
    IF v_row.is_read THEN
      v_run := v_run + 1;
    END IF;
    v_longest := GREATEST(v_longest, v_run);
    v_prev := v_row.d;
  END LOOP;

  current_streak := v_run;
  longest_streak := v_longest;
  last_active_date := v_prev;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public._recompute_reading_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid;
  v_curr int;
  v_long int;
  v_last date;
BEGIN
  v_user := COALESCE(NEW.user_id, OLD.user_id);
  IF v_user IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT c.current_streak, c.longest_streak, c.last_active_date
    INTO v_curr, v_long, v_last
  FROM public._compute_reading_streak(v_user) c;

  UPDATE public.profiles
    SET current_streak    = COALESCE(v_curr, 0),
        longest_streak    = COALESCE(v_long, 0),
        last_active_date  = v_last,
        streak_updated_at = now()
    WHERE id = v_user;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_reading_streak ON public.reading_log;
CREATE TRIGGER trg_recompute_reading_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.reading_log
  FOR EACH ROW EXECUTE FUNCTION public._recompute_reading_streak();

DROP TRIGGER IF EXISTS trg_recompute_reading_streak_activity ON public.reading_activity;
CREATE TRIGGER trg_recompute_reading_streak_activity
  AFTER INSERT OR DELETE ON public.reading_activity
  FOR EACH ROW EXECUTE FUNCTION public._recompute_reading_streak();

DROP TRIGGER IF EXISTS trg_recompute_reading_streak_freeze ON public.streak_freeze_uses;
CREATE TRIGGER trg_recompute_reading_streak_freeze
  AFTER INSERT OR DELETE ON public.streak_freeze_uses
  FOR EACH ROW EXECUTE FUNCTION public._recompute_reading_streak();

-- ── Read-side RPCs (decay applied here) ────────────────────────────────────
-- p_today is the caller's local date. Clamped to UTC current_date ± 1 so a
-- bogus value can't resurrect a dead streak.
CREATE OR REPLACE FUNCTION public._streak_today(p_today date)
RETURNS date
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT GREATEST(LEAST(COALESCE(p_today, current_date), current_date + 1), current_date - 1);
$$;

DROP FUNCTION IF EXISTS public.get_reading_streaks(uuid);
DROP FUNCTION IF EXISTS public.get_reading_streaks(uuid, date);
CREATE FUNCTION public.get_reading_streaks(p_user_id uuid, p_today date DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'current_streak', CASE
      WHEN p.last_active_date >= public._streak_today(p_today) - 1 THEN COALESCE(p.current_streak, 0)
      ELSE 0 END,
    'longest_streak', COALESCE(p.longest_streak, 0)
  )
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

DROP FUNCTION IF EXISTS public.get_reading_streaks_bulk(uuid[]);
DROP FUNCTION IF EXISTS public.get_reading_streaks_bulk(uuid[], date);
CREATE FUNCTION public.get_reading_streaks_bulk(p_user_ids uuid[], p_today date DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(jsonb_object_agg(p.id::text, jsonb_build_object(
    'current_streak', CASE
      WHEN p.last_active_date >= public._streak_today(p_today) - 1 THEN COALESCE(p.current_streak, 0)
      ELSE 0 END,
    'longest_streak', COALESCE(p.longest_streak, 0)
  )), '{}'::jsonb)
  FROM public.profiles p
  WHERE p.id = ANY (p_user_ids);
$$;

-- ── Leaderboards ───────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_reading_leaderboard(integer);
DROP FUNCTION IF EXISTS public.get_reading_leaderboard(integer, date);
CREATE FUNCTION public.get_reading_leaderboard(p_limit integer DEFAULT 20, p_today date DEFAULT NULL)
RETURNS TABLE(
  user_id             uuid,
  display_name        text,
  avatar_url          text,
  subscription_status text,
  chapters_read       bigint,
  books_complete      bigint,
  pct                 numeric,
  current_streak      integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    p.subscription_status,
    s.chapters_read,
    s.books_complete,
    ROUND(s.chapters_read * 100.0 / 1189.0, 1) AS pct,
    CASE WHEN p.last_active_date >= public._streak_today(p_today) - 1
         THEN COALESCE(p.current_streak, 0) ELSE 0 END AS current_streak
  FROM public.profiles p
  JOIN (
    SELECT
      rp.user_id,
      rp.updated_at,
      COUNT(*) FILTER (WHERE ch.ch_val = 'true') AS chapters_read,
      COUNT(DISTINCT b.book_key) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_each(b.book_val) fc(k, v) WHERE fc.v <> 'true'
        )
        AND b.book_val <> '{}'::jsonb
      ) AS books_complete
    FROM public.reading_progress rp
    CROSS JOIN LATERAL jsonb_each(rp.progress)     AS b(book_key, book_val)
    CROSS JOIN LATERAL jsonb_each_text(b.book_val) AS ch(ch_key, ch_val)
    WHERE b.book_key <> '_v'
      AND jsonb_typeof(b.book_val) = 'object'
    GROUP BY rp.user_id, rp.updated_at
    HAVING COUNT(*) FILTER (WHERE ch.ch_val = 'true') > 0
  ) s ON p.id = s.user_id
  ORDER BY s.chapters_read DESC, s.books_complete DESC, s.updated_at ASC, p.id
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_quiz_leaderboard(p_limit integer DEFAULT 20)
RETURNS TABLE(
  user_id             uuid,
  display_name        text,
  avatar_url          text,
  subscription_status text,
  levels_completed    bigint,
  top_badge_level     integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    p.subscription_status,
    q.levels_completed,
    COALESCE(p.top_badge_level, 0) AS top_badge_level
  FROM public.profiles p
  JOIN (
    SELECT uqp.user_id, COUNT(*) AS levels_completed, MAX(uqp.updated_at) AS last_earned
    FROM public.user_quiz_progress uqp
    WHERE uqp.badge_earned = true
    GROUP BY uqp.user_id
  ) q ON p.id = q.user_id
  ORDER BY q.levels_completed DESC, COALESCE(p.top_badge_level, 0) DESC, q.last_earned ASC, p.id
  LIMIT p_limit;
$$;

-- ── Backfill every user ────────────────────────────────────────────────────
UPDATE public.profiles p
  SET (current_streak, longest_streak, last_active_date, streak_updated_at) = (
    SELECT COALESCE(c.current_streak, 0), COALESCE(c.longest_streak, 0), c.last_active_date, now()
    FROM public._compute_reading_streak(p.id) c
  );

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- ROLLBACK: re-run supabase/migrations/20260518_hot_rpc_counters.sql sections
-- (B) and create_leaderboard_functions.sql, then
--   DROP TRIGGER IF EXISTS trg_recompute_reading_streak_activity ON public.reading_activity;
--   DROP TRIGGER IF EXISTS trg_recompute_reading_streak_freeze ON public.streak_freeze_uses;
--   DROP FUNCTION IF EXISTS public._streak_today(date);
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_active_date;
-- ============================================================================
