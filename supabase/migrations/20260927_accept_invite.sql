-- ============================================================================
-- accept_invite(token): make the caller and the invite-link owner friends.
--
-- The client-side invite flow never worked: it inserted a friend_request with
-- from_user_id = inviter while authenticated as the invitee, which the
-- "users can send requests" policy (auth.uid() = from_user_id) rejects. The
-- auto-accept branch was also gated on premium, which no longer exists.
--
-- Following someone's invite link is consent from both sides, so this creates
-- an accepted friendship directly. SECURITY DEFINER bypasses RLS; the caller
-- can only ever befriend the owner of a token they hold.
--
-- Apply via the Supabase Studio SQL Editor.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.accept_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_me      uuid := auth.uid();
  v_inviter uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT user_id INTO v_inviter FROM public.invite_tokens WHERE token = p_token;
  IF v_inviter IS NULL OR v_inviter = v_me THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.friend_requests (from_user_id, to_user_id, status)
  VALUES (v_inviter, v_me, 'accepted')
  ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET status = 'accepted';

  INSERT INTO public.friendships (user_a_id, user_b_id, sponsored_by)
  VALUES (LEAST(v_inviter, v_me), GREATEST(v_inviter, v_me), v_inviter)
  ON CONFLICT (user_a_id, user_b_id) DO NOTHING;

  RETURN v_inviter;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invite(text) TO authenticated;

COMMIT;
