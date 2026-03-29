-- ── Admin Audit Log ────────────────────────────────────────────────────────────
-- Tracks every privileged action taken by admins/mods.
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            bigserial PRIMARY KEY,
  actor_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action        text        NOT NULL,  -- e.g. 'set_admin', 'ban_user', 'delete_user'
  target_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_email  text,                  -- snapshot at time of action (target may be deleted later)
  metadata      jsonb,                 -- any extra context (old value, new value, etc.)
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and mods can read the audit log; nobody can write directly (RPCs only)
CREATE POLICY "audit_log_admin_read"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin OR is_moderator)
    )
  );

-- Index for fast reverse-chronological queries
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx       ON public.admin_audit_log (actor_id);

-- ── Internal helper — inserts one audit row (called from security-definer RPCs) ─
CREATE OR REPLACE FUNCTION public._audit(
  p_action       text,
  p_target_id    uuid    DEFAULT NULL,
  p_metadata     jsonb   DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_email text;
BEGIN
  IF p_target_id IS NOT NULL THEN
    SELECT email INTO v_target_email FROM public.profiles WHERE id = p_target_id;
  END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, target_id, target_email, metadata)
  VALUES (auth.uid(), p_action, p_target_id, v_target_email, p_metadata);
END;
$$;

-- ── Update RPCs to emit audit rows ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  SELECT email INTO v_email FROM public.profiles WHERE id = target_user_id;
  PERFORM public._audit('delete_user', target_user_id, jsonb_build_object('email', v_email));
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_admin(target_user_id uuid, new_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_old boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  SELECT is_admin INTO v_old FROM public.profiles WHERE id = target_user_id;
  UPDATE public.profiles SET is_admin = new_value WHERE id = target_user_id;
  PERFORM public._audit(
    CASE WHEN new_value THEN 'grant_admin' ELSE 'revoke_admin' END,
    target_user_id,
    jsonb_build_object('old', v_old, 'new', new_value)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_moderator(target_user_id uuid, new_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_old boolean;
BEGIN
  IF NOT (public.is_admin() OR public.is_moderator()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT is_moderator INTO v_old FROM public.profiles WHERE id = target_user_id;
  UPDATE public.profiles SET is_moderator = new_value WHERE id = target_user_id;
  PERFORM public._audit(
    CASE WHEN new_value THEN 'grant_moderator' ELSE 'revoke_moderator' END,
    target_user_id,
    jsonb_build_object('old', v_old, 'new', new_value)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_ban_user(target_user_id uuid, new_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_old boolean;
BEGIN
  IF NOT (public.is_admin() OR public.is_moderator()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT is_banned INTO v_old FROM public.profiles WHERE id = target_user_id;
  UPDATE public.profiles SET is_banned = new_value WHERE id = target_user_id;
  PERFORM public._audit(
    CASE WHEN new_value THEN 'ban_user' ELSE 'unban_user' END,
    target_user_id,
    jsonb_build_object('old', v_old, 'new', new_value)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_blog(target_user_id uuid, new_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_old boolean;
BEGIN
  IF NOT (public.is_admin() OR public.is_moderator()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT can_blog INTO v_old FROM public.profiles WHERE id = target_user_id;
  UPDATE public.profiles SET can_blog = new_value WHERE id = target_user_id;
  PERFORM public._audit(
    CASE WHEN new_value THEN 'grant_blog' ELSE 'revoke_blog' END,
    target_user_id,
    jsonb_build_object('old', v_old, 'new', new_value)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_gift_premium(target_user_id uuid, new_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  UPDATE public.profiles
  SET subscription_status = CASE WHEN new_value THEN 'gifted' ELSE 'inactive' END
  WHERE id = target_user_id;
  PERFORM public._audit(
    CASE WHEN new_value THEN 'gift_premium' ELSE 'revoke_premium' END,
    target_user_id
  );
END;
$$;
