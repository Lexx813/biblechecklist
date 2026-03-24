-- ─── User posts (public status updates / shared thoughts) ────────────────────
CREATE TABLE IF NOT EXISTS public.user_posts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read posts
CREATE POLICY "posts_select"
  ON public.user_posts FOR SELECT
  USING (true);

-- Users can only create their own posts
CREATE POLICY "posts_insert"
  ON public.user_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own posts
CREATE POLICY "posts_delete"
  ON public.user_posts FOR DELETE
  USING (auth.uid() = user_id);
