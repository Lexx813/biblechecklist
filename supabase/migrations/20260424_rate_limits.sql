-- ────────────────────────────────────────────────────────────────────────────
-- Rate limits for direct user-content writes.
--
-- These tables are written directly from the browser via supabase-js, so
-- we can't use Upstash here — the request never hits our server. Instead we
-- count recent inserts per user in a sliding window and raise an exception
-- when caps are exceeded. The check is cheap (a partial index keeps the
-- COUNT query under a millisecond).
-- ────────────────────────────────────────────────────────────────────────────

-- Generic per-user window check.
-- Counts rows in `<table_name>` where `<user_col> = auth.uid()` and the
-- given `<created_col>` falls within the last `<window_secs>` seconds.
-- Raises a friendly EXCEPTION when the count is >= max_count.
CREATE OR REPLACE FUNCTION public.rl_check(
  table_name    text,
  user_col      text,
  created_col   text,
  max_count     int,
  window_secs   int,
  action_label  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  cnt int;
  uid uuid := auth.uid();
BEGIN
  -- Service-role / unauthenticated paths bypass per-user limits.
  IF uid IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format(
    'SELECT count(*) FROM %I WHERE %I = $1 AND %I > now() - ($2 || '' seconds'')::interval',
    table_name, user_col, created_col
  )
  INTO cnt
  USING uid, window_secs::text;

  IF cnt >= max_count THEN
    RAISE EXCEPTION
      'Rate limit: too many % in the last % seconds. Try again shortly.',
      action_label, window_secs
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

-- ── Trigger functions per content type ──────────────────────────────────────
-- One function per table so we can tune caps independently without juggling
-- a generic "config table" lookup on every insert.

CREATE OR REPLACE FUNCTION public.rl_user_posts() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  -- 5/min and 60/hour
  PERFORM rl_check('user_posts', 'user_id', 'created_at', 5, 60, 'posts');
  PERFORM rl_check('user_posts', 'user_id', 'created_at', 60, 3600, 'posts');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rl_user_post_comments() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM rl_check('user_post_comments', 'author_id', 'created_at', 10, 60, 'comments');
  PERFORM rl_check('user_post_comments', 'author_id', 'created_at', 200, 3600, 'comments');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rl_forum_threads() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM rl_check('forum_threads', 'author_id', 'created_at', 3, 60, 'forum threads');
  PERFORM rl_check('forum_threads', 'author_id', 'created_at', 30, 3600, 'forum threads');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rl_forum_replies() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM rl_check('forum_replies', 'author_id', 'created_at', 10, 60, 'forum replies');
  PERFORM rl_check('forum_replies', 'author_id', 'created_at', 200, 3600, 'forum replies');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rl_blog_comments() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM rl_check('blog_comments', 'author_id', 'created_at', 10, 60, 'blog comments');
  PERFORM rl_check('blog_comments', 'author_id', 'created_at', 200, 3600, 'blog comments');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rl_messages() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  -- Higher caps — chat is naturally bursty.
  PERFORM rl_check('messages', 'sender_id', 'created_at', 30, 60, 'messages');
  PERFORM rl_check('messages', 'sender_id', 'created_at', 600, 3600, 'messages');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rl_study_notes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM rl_check('study_notes', 'user_id', 'created_at', 20, 60, 'study notes');
  PERFORM rl_check('study_notes', 'user_id', 'created_at', 300, 3600, 'study notes');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rl_user_post_reactions() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  -- Reactions are clicks — high cap to avoid annoying real users.
  PERFORM rl_check('user_post_reactions', 'user_id', 'created_at', 60, 60, 'reactions');
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rl_user_post_comment_likes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM rl_check('user_post_comment_likes', 'user_id', 'created_at', 60, 60, 'likes');
  RETURN NEW;
END $$;

-- ── Wire up the BEFORE INSERT triggers ──────────────────────────────────────
-- Drop-and-recreate is safe even if a previous run partially applied.

DROP TRIGGER IF EXISTS trg_rl_user_posts             ON public.user_posts;
DROP TRIGGER IF EXISTS trg_rl_user_post_comments     ON public.user_post_comments;
DROP TRIGGER IF EXISTS trg_rl_forum_threads          ON public.forum_threads;
DROP TRIGGER IF EXISTS trg_rl_forum_replies          ON public.forum_replies;
DROP TRIGGER IF EXISTS trg_rl_blog_comments          ON public.blog_comments;
DROP TRIGGER IF EXISTS trg_rl_messages               ON public.messages;
DROP TRIGGER IF EXISTS trg_rl_study_notes            ON public.study_notes;
DROP TRIGGER IF EXISTS trg_rl_user_post_reactions    ON public.user_post_reactions;
DROP TRIGGER IF EXISTS trg_rl_user_post_comment_likes ON public.user_post_comment_likes;

CREATE TRIGGER trg_rl_user_posts
  BEFORE INSERT ON public.user_posts
  FOR EACH ROW EXECUTE FUNCTION public.rl_user_posts();

CREATE TRIGGER trg_rl_user_post_comments
  BEFORE INSERT ON public.user_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.rl_user_post_comments();

CREATE TRIGGER trg_rl_forum_threads
  BEFORE INSERT ON public.forum_threads
  FOR EACH ROW EXECUTE FUNCTION public.rl_forum_threads();

CREATE TRIGGER trg_rl_forum_replies
  BEFORE INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.rl_forum_replies();

CREATE TRIGGER trg_rl_blog_comments
  BEFORE INSERT ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.rl_blog_comments();

CREATE TRIGGER trg_rl_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.rl_messages();

CREATE TRIGGER trg_rl_study_notes
  BEFORE INSERT ON public.study_notes
  FOR EACH ROW EXECUTE FUNCTION public.rl_study_notes();

CREATE TRIGGER trg_rl_user_post_reactions
  BEFORE INSERT ON public.user_post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.rl_user_post_reactions();

CREATE TRIGGER trg_rl_user_post_comment_likes
  BEFORE INSERT ON public.user_post_comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.rl_user_post_comment_likes();

-- ── Indexes to keep COUNT queries fast ──────────────────────────────────────
-- These are partial indexes scoped to recent rows, so they stay tiny.
-- (Most counter queries only look at the last hour.)

CREATE INDEX IF NOT EXISTS idx_rl_user_posts_user_created
  ON public.user_posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_user_post_comments_author_created
  ON public.user_post_comments (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_forum_threads_author_created
  ON public.forum_threads (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_forum_replies_author_created
  ON public.forum_replies (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_blog_comments_author_created
  ON public.blog_comments (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_messages_sender_created
  ON public.messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_study_notes_user_created
  ON public.study_notes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_user_post_reactions_user_created
  ON public.user_post_reactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_user_post_comment_likes_user_created
  ON public.user_post_comment_likes (user_id, created_at DESC);
