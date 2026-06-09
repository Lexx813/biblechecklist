-- ─────────────────────────────────────────────────────────────────────────────
-- Fix IDOR: conversation_participants INSERT was open to any authenticated user
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Problem: the previous policy only required `auth.uid() IS NOT NULL`, so any
-- logged-in user who obtained/guessed a conversation_id could insert
-- (conversation_id = <victim>, user_id = <self>) and thereby gain participant
-- membership — which is the gate for reading the entire DM history and posting
-- into the thread (see messages / conversations / message_link_previews SELECT
-- policies and the messages INSERT policy, all of which check
-- is_conversation_participant()).
--
-- Note: requiring only `user_id = auth.uid()` does NOT close the hole — the
-- attacker is inserting a row for *themselves*, so that check passes. The real
-- fix must also require the caller already belong to the conversation.
--
-- All legitimate participant rows are created by SECURITY DEFINER paths that
-- bypass RLS:
--   * get_or_create_dm(other_user_id)  — runtime DM creation, seeds both rows
--   * the welcome-DM trigger           — seeds owner + new user on signup
-- So no client-direct INSERT into conversation_participants is expected, and
-- the policy below effectively disallows them while leaving SECURITY DEFINER
-- creation working.

DROP POLICY IF EXISTS "authenticated can insert participants" ON public.conversation_participants;
CREATE POLICY "authenticated can insert participants" ON public.conversation_participants FOR INSERT
  WITH CHECK (
    user_id = (select auth.uid())
    AND public.is_conversation_participant(conversation_id)
  );
