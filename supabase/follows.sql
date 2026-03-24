-- ─── User follows ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY  (follower_id, following_id),
  CHECK        (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read follows (for counts / feed)
CREATE POLICY "follows_select"
  ON public.user_follows FOR SELECT
  USING (true);

-- Users can only insert rows where they are the follower
CREATE POLICY "follows_insert"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follow rows
CREATE POLICY "follows_delete"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Atomic toggle follow / unfollow — returns true if now following, false if unfollowed
CREATE OR REPLACE FUNCTION toggle_follow(p_following_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_follows
    WHERE follower_id = auth.uid() AND following_id = p_following_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.user_follows
    WHERE follower_id = auth.uid() AND following_id = p_following_id;
    RETURN false;
  ELSE
    INSERT INTO public.user_follows (follower_id, following_id)
    VALUES (auth.uid(), p_following_id);
    RETURN true;
  END IF;
END;
$$;

-- ─── Top badge level on profiles ─────────────────────────────────────────────
-- Stores the highest quiz level where the user earned a perfect score.
-- Forum joins can include this without extra queries.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS top_badge_level int NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION sync_top_badge_level()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET top_badge_level = (
    SELECT COALESCE(MAX(level), 0)
    FROM public.user_quiz_progress
    WHERE user_id = NEW.user_id AND badge_earned = true
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_top_badge ON public.user_quiz_progress;
CREATE TRIGGER trg_sync_top_badge
  AFTER INSERT OR UPDATE OF badge_earned ON public.user_quiz_progress
  FOR EACH ROW EXECUTE FUNCTION sync_top_badge_level();
