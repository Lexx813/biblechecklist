-- Create user_posts table if it doesn't exist yet, with all columns
CREATE TABLE IF NOT EXISTS public.user_posts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  visibility     text        NOT NULL DEFAULT 'public',
  image_url      text,
  comment_count  int         NOT NULL DEFAULT 0,
  reaction_counts jsonb      NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

-- Drop old open SELECT policy (was USING (true) — no visibility enforcement)
DROP POLICY IF EXISTS "posts_select" ON public.user_posts;

-- Enforce visibility at the DB level:
-- • public posts → any authenticated user
-- • owner → always sees own posts
-- • friends-only → only mutual friends (friendships table is ordered: user_a_id < user_b_id)
CREATE POLICY "posts_select"
  ON public.user_posts FOR SELECT
  USING (
    visibility = 'public'
    OR auth.uid() = user_id
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE
          (f.user_a_id = auth.uid() AND f.user_b_id = user_posts.user_id)
          OR (f.user_b_id = auth.uid() AND f.user_a_id = user_posts.user_id)
      )
    )
  );

-- Users can only create their own posts
DROP POLICY IF EXISTS "posts_insert" ON public.user_posts;
CREATE POLICY "posts_insert"
  ON public.user_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can edit their own posts
DROP POLICY IF EXISTS "posts_update" ON public.user_posts;
CREATE POLICY "posts_update"
  ON public.user_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
DROP POLICY IF EXISTS "posts_delete" ON public.user_posts;
CREATE POLICY "posts_delete"
  ON public.user_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_posts_user ON public.user_posts(user_id);
