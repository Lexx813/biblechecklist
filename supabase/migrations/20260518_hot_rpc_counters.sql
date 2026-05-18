-- ============================================================================
-- 20260518_hot_rpc_counters.sql
--
-- Materialize the two heaviest read-only RPCs into counter tables/columns,
-- updated by triggers on the underlying writes. The RPC bodies are
-- rewritten to do a constant-time SELECT instead of computing on every call.
--
--   (A) get_global_chapter_count — 6,260 calls / 194s. Replaces the
--       JSONB double-unnest scan over ALL reading_progress rows with a
--       single counter row.
--
--   (B) get_reading_streaks(uuid) — 5,770 calls / 296s. Cached on
--       `profiles.current_streak` + `profiles.longest_streak`, recomputed
--       by trigger on reading_log writes.
--
-- Safe to apply in a single transaction. The triggers backfill counters
-- in the same migration so no separate data-migration step is needed.
-- ============================================================================

BEGIN;

-- ============================================================================
-- (A) Global chapter count
-- ============================================================================

-- Counter table — single-row design keeps the read O(1).
CREATE TABLE IF NOT EXISTS public.global_stats (
  key text PRIMARY KEY,
  value bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Permit anonymous SELECT (the landing page calls the RPC pre-auth).
ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS global_stats_public_read ON public.global_stats;
CREATE POLICY global_stats_public_read ON public.global_stats FOR SELECT
  USING (true);

-- Seed the counter from the existing data so the first read after this
-- migration applies returns the correct number.
INSERT INTO public.global_stats(key, value, updated_at)
SELECT 'chapters_read', COALESCE(SUM(c), 0)::bigint, now()
FROM (
  SELECT count(*) AS c
  FROM reading_progress rp,
       jsonb_each(rp.progress) AS b(book_key, book_val),
       jsonb_each(book_val) AS ch(ch_key, ch_val)
  WHERE ch_val::text = 'true'
) s
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = now();

-- Helper: count "true" chapters in a single reading_progress.progress jsonb.
CREATE OR REPLACE FUNCTION public._count_chapters_in_progress(p jsonb)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((
    SELECT count(*)
    FROM jsonb_each(p) AS b(book_key, book_val),
         jsonb_each(book_val) AS ch(ch_key, ch_val)
    WHERE ch_val::text = 'true'
  ), 0)::bigint;
$$;

-- Trigger function: maintain global_stats on reading_progress writes.
CREATE OR REPLACE FUNCTION public._update_global_chapter_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old bigint := 0;
  v_new bigint := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new := public._count_chapters_in_progress(NEW.progress);
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := public._count_chapters_in_progress(OLD.progress);
    v_new := public._count_chapters_in_progress(NEW.progress);
  ELSIF TG_OP = 'DELETE' THEN
    v_old := public._count_chapters_in_progress(OLD.progress);
  END IF;

  IF v_new <> v_old THEN
    UPDATE public.global_stats
      SET value = GREATEST(0, value + (v_new - v_old)),
          updated_at = now()
      WHERE key = 'chapters_read';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_global_chapter_count ON public.reading_progress;
CREATE TRIGGER trg_global_chapter_count
  AFTER INSERT OR UPDATE OR DELETE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION public._update_global_chapter_count();

-- Replace the RPC body with a constant-time read.
CREATE OR REPLACE FUNCTION public.get_global_chapter_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT value FROM public.global_stats WHERE key = 'chapters_read'), 0);
$$;

-- ============================================================================
-- (B) Per-user reading streak cache
-- ============================================================================

-- Add cache columns to profiles (idempotent).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_updated_at timestamptz;

-- Compute streak for a single user from reading_log. Mirrors the existing
-- get_reading_streaks(p_user_id) logic but as a single SQL block.
CREATE OR REPLACE FUNCTION public._compute_reading_streak(p_user_id uuid)
RETURNS TABLE(current_streak integer, longest_streak integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current int := 0;
  v_longest int := 0;
  v_run int := 0;
  v_prev date;
  v_row record;
  v_today date := current_date;
  v_anchor date;
BEGIN
  FOR v_row IN
    SELECT date FROM public.reading_log WHERE user_id = p_user_id AND chapters_read > 0 ORDER BY date ASC
  LOOP
    IF v_prev IS NULL OR v_row.date = v_prev + 1 THEN
      v_run := v_run + 1;
    ELSE
      v_longest := GREATEST(v_longest, v_run);
      v_run := 1;
    END IF;
    v_prev := v_row.date;
  END LOOP;
  v_longest := GREATEST(v_longest, v_run);

  IF EXISTS (SELECT 1 FROM public.reading_log WHERE user_id = p_user_id AND date = v_today AND chapters_read > 0) THEN
    v_anchor := v_today;
  ELSIF EXISTS (SELECT 1 FROM public.reading_log WHERE user_id = p_user_id AND date = v_today - 1 AND chapters_read > 0) THEN
    v_anchor := v_today - 1;
  END IF;

  IF v_anchor IS NOT NULL THEN
    v_prev := v_anchor;
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.reading_log WHERE user_id = p_user_id AND date = v_prev AND chapters_read > 0);
      v_current := v_current + 1;
      v_prev := v_prev - 1;
    END LOOP;
  END IF;

  current_streak := v_current;
  longest_streak := v_longest;
  RETURN NEXT;
END;
$$;

-- Trigger: when reading_log writes, recompute that user's streak and stash.
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
BEGIN
  v_user := COALESCE(NEW.user_id, OLD.user_id);
  IF v_user IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT current_streak, longest_streak INTO v_curr, v_long
  FROM public._compute_reading_streak(v_user);

  UPDATE public.profiles
    SET current_streak = COALESCE(v_curr, 0),
        longest_streak = COALESCE(v_long, 0),
        streak_updated_at = now()
    WHERE id = v_user;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_reading_streak ON public.reading_log;
CREATE TRIGGER trg_recompute_reading_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.reading_log
  FOR EACH ROW EXECUTE FUNCTION public._recompute_reading_streak();

-- Backfill for all existing users with reading_log entries.
DO $backfill$
DECLARE r record; v_curr int; v_long int;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.reading_log LOOP
    SELECT current_streak, longest_streak INTO v_curr, v_long
    FROM public._compute_reading_streak(r.user_id);
    UPDATE public.profiles
      SET current_streak = COALESCE(v_curr, 0),
          longest_streak = COALESCE(v_long, 0),
          streak_updated_at = now()
      WHERE id = r.user_id;
  END LOOP;
END $backfill$;

-- Rewrite the hot RPC to read from cache. Signature unchanged so all
-- existing callers (src/api/progress.ts, src/api/reading.ts, src/api/groups.ts)
-- continue to work without code changes.
CREATE OR REPLACE FUNCTION public.get_reading_streaks(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'current_streak', COALESCE(p.current_streak, 0),
    'longest_streak', COALESCE(p.longest_streak, 0)
  )
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

-- Bulk variant — single round-trip for `groupsApi.getGroupReadingStreaks`.
-- Returns `{ "<uuid>": { current_streak, longest_streak } }`.
CREATE OR REPLACE FUNCTION public.get_reading_streaks_bulk(p_user_ids uuid[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(jsonb_object_agg(p.id::text, jsonb_build_object(
    'current_streak', COALESCE(p.current_streak, 0),
    'longest_streak', COALESCE(p.longest_streak, 0)
  )), '{}'::jsonb)
  FROM public.profiles p
  WHERE p.id = ANY (p_user_ids);
$$;

COMMIT;

-- ============================================================================
-- ROLLBACK:
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_global_chapter_count ON public.reading_progress;
-- DROP TRIGGER IF EXISTS trg_recompute_reading_streak ON public.reading_log;
-- DROP FUNCTION IF EXISTS public._update_global_chapter_count();
-- DROP FUNCTION IF EXISTS public._recompute_reading_streak();
-- DROP FUNCTION IF EXISTS public._compute_reading_streak(uuid);
-- DROP FUNCTION IF EXISTS public._count_chapters_in_progress(jsonb);
-- DROP FUNCTION IF EXISTS public.get_reading_streaks_bulk(uuid[]);
-- DROP TABLE IF EXISTS public.global_stats;
-- ALTER TABLE public.profiles
--   DROP COLUMN IF EXISTS current_streak,
--   DROP COLUMN IF EXISTS longest_streak,
--   DROP COLUMN IF EXISTS streak_updated_at;
-- -- Restore the original computed RPC body
-- CREATE OR REPLACE FUNCTION public.get_reading_streaks(p_user_id uuid)
-- RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
-- SET search_path = public, pg_temp AS $body$
-- ...original plpgsql here (see prior pg_get_functiondef output)...
-- $body$;
-- CREATE OR REPLACE FUNCTION public.get_global_chapter_count()
-- RETURNS bigint LANGUAGE sql SECURITY DEFINER AS $body$
--   SELECT count(*) FROM reading_progress rp, jsonb_each(rp.progress) ... ;
-- $body$;
-- COMMIT;
-- ============================================================================
