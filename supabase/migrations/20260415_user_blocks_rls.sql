-- Create user_blocks table (if not already created) with RLS from the start
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can only see block records they are involved in
CREATE POLICY "blocks_select_own"
  ON public.user_blocks FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

-- Users can only block as themselves
CREATE POLICY "blocks_insert_own"
  ON public.user_blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

-- Users can only unblock their own blocks
CREATE POLICY "blocks_delete_own"
  ON public.user_blocks FOR DELETE
  USING (blocker_id = auth.uid());
