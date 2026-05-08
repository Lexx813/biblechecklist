-- Tighten the UPDATE policy on public.study_notes so a user cannot transfer
-- ownership of their own row to another user (or null) by setting user_id in
-- an UPDATE. The existing policy uses USING auth.uid() = user_id which
-- correctly gates *which row* a user can update, but without WITH CHECK there
-- is no constraint on the *new* user_id value. Without WITH CHECK, the row
-- would no longer be visible to the original owner after the change, which
-- is effectively a privilege transfer / accidental hide.
--
-- Apply via Supabase SQL Editor (this project does not run remote migrate).

ALTER POLICY "Users manage own study notes"
  ON public.study_notes
  WITH CHECK (auth.uid() = user_id);
