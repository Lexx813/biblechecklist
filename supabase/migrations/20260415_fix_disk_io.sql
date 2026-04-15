-- Fix Disk IO budget depletion: add missing compound indexes
-- These tables were causing full sequential scans on every sorted/filtered query.

-- ── study_notes ────────────────────────────────────────────────────────────
-- No indexes at all; user note lists are always user_id + ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_study_notes_user_created
  ON public.study_notes(user_id, created_at DESC);

-- ── blog_posts ─────────────────────────────────────────────────────────────
-- Blog lists ORDER BY created_at; published feed filters is_published first
CREATE INDEX IF NOT EXISTS idx_blog_posts_created
  ON public.blog_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_created
  ON public.blog_posts(published, created_at DESC);

-- ── forum_threads ──────────────────────────────────────────────────────────
-- Category page: WHERE category_id = ? ORDER BY created_at DESC
-- Only had a single-column category_id index — compound avoids the sort step
CREATE INDEX IF NOT EXISTS idx_forum_threads_category_created
  ON public.forum_threads(category_id, created_at DESC);

-- ── user_posts ─────────────────────────────────────────────────────────────
-- Profile tab: WHERE user_id = ? ORDER BY created_at DESC (only had user_id)
CREATE INDEX IF NOT EXISTS idx_user_posts_user_created
  ON public.user_posts(user_id, created_at DESC);

-- Feed: WHERE visibility = 'public' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_user_posts_visibility_created
  ON public.user_posts(visibility, created_at DESC);

-- ── friendships ────────────────────────────────────────────────────────────
-- The new posts RLS SELECT policy runs this EXISTS subquery on every row:
--   WHERE (user_a_id = auth.uid() AND user_b_id = ?)
--      OR (user_b_id = auth.uid() AND user_a_id = ?)
-- Cover both directions so each lookup hits an index instead of a seq-scan.
CREATE INDEX IF NOT EXISTS idx_friendships_a_b
  ON public.friendships(user_a_id, user_b_id);

CREATE INDEX IF NOT EXISTS idx_friendships_b_a
  ON public.friendships(user_b_id, user_a_id);
