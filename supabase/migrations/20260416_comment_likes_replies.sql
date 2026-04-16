-- Add parent_id (for replies) and like_count to user_post_comments
ALTER TABLE public.user_post_comments
  ADD COLUMN IF NOT EXISTS parent_id  uuid    REFERENCES public.user_post_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;

-- ── Comment likes table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_post_comment_likes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid        NOT NULL REFERENCES public.user_post_comments(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

ALTER TABLE public.user_post_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_likes_select" ON public.user_post_comment_likes;
CREATE POLICY "comment_likes_select"
  ON public.user_post_comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "comment_likes_insert" ON public.user_post_comment_likes;
CREATE POLICY "comment_likes_insert"
  ON public.user_post_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_likes_delete" ON public.user_post_comment_likes;
CREATE POLICY "comment_likes_delete"
  ON public.user_post_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- ── Trigger: keep like_count in sync ──────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_comment_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_post_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_post_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_like_count ON public.user_post_comment_likes;
CREATE TRIGGER trg_comment_like_count
  AFTER INSERT OR DELETE ON public.user_post_comment_likes
  FOR EACH ROW EXECUTE FUNCTION sync_comment_like_count();
