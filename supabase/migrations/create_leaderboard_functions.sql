-- ────────────────────────────────────────────────────────────────────────────
-- Leaderboard RPC functions
-- Apply in Supabase SQL editor or via supabase db push
-- ────────────────────────────────────────────────────────────────────────────

-- ── Reading Leaderboard ──────────────────────────────────────────────────────
-- Counts completed chapters from reading_progress.progress JSON blob.
-- Progress structure: { "<bookIndex>": { "<chapter>": true/false }, "_v": {...} }
-- "_v" key holds verse state — must be excluded from chapter counting.

DROP FUNCTION IF EXISTS get_reading_leaderboard(integer);
CREATE OR REPLACE FUNCTION get_reading_leaderboard(p_limit integer DEFAULT 20)
RETURNS TABLE(
  user_id        uuid,
  display_name   text,
  avatar_url     text,
  subscription_status text,
  chapters_read  bigint,
  books_complete bigint,
  pct            numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id                   AS user_id,
    p.display_name,
    p.avatar_url,
    p.subscription_status,
    COALESCE(s.chapters_read, 0)  AS chapters_read,
    COALESCE(s.books_complete, 0) AS books_complete,
    COALESCE(ROUND(s.chapters_read * 100.0 / 1189.0, 1), 0) AS pct
  FROM profiles p
  JOIN (
    SELECT
      rp.user_id,
      COUNT(*) FILTER (WHERE ch.ch_val = 'true') AS chapters_read,
      COUNT(DISTINCT b.book_key)
        FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM jsonb_each(b.book_val) fc(k, v)
            WHERE fc.v != 'true'
          )
          AND b.book_val != '{}'::jsonb
        ) AS books_complete
    FROM reading_progress rp
    CROSS JOIN LATERAL jsonb_each(rp.progress)             AS b(book_key, book_val)
    CROSS JOIN LATERAL jsonb_each_text(b.book_val)         AS ch(ch_key, ch_val)
    WHERE b.book_key != '_v'
      AND jsonb_typeof(b.book_val) = 'object'
    GROUP BY rp.user_id
    HAVING COUNT(*) FILTER (WHERE ch.ch_val = 'true') > 0
  ) s ON p.id = s.user_id
  ORDER BY s.chapters_read DESC
  LIMIT p_limit;
$$;


-- ── Quiz Leaderboard ─────────────────────────────────────────────────────────
-- Counts quiz badge levels completed (badge_earned = true) per user.

DROP FUNCTION IF EXISTS get_quiz_leaderboard(integer);
CREATE OR REPLACE FUNCTION get_quiz_leaderboard(p_limit integer DEFAULT 20)
RETURNS TABLE(
  user_id             uuid,
  display_name        text,
  avatar_url          text,
  subscription_status text,
  levels_completed    bigint,
  top_badge_level     integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id                    AS user_id,
    p.display_name,
    p.avatar_url,
    p.subscription_status,
    COALESCE(q.levels_completed, 0) AS levels_completed,
    COALESCE(p.top_badge_level, 0)  AS top_badge_level
  FROM profiles p
  JOIN (
    SELECT
      uqp.user_id,
      COUNT(*) AS levels_completed
    FROM user_quiz_progress uqp
    WHERE uqp.badge_earned = true
    GROUP BY uqp.user_id
    HAVING COUNT(*) > 0
  ) q ON p.id = q.user_id
  ORDER BY q.levels_completed DESC
  LIMIT p_limit;
$$;
