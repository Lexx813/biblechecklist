-- ============================================================================
-- 20260520_security_hardening.sql
--
-- Closes critical security findings surfaced by the 2026-05-20 audit.
--
-- 1. Privilege-escalation block: any authenticated user could `UPDATE profiles
--    SET is_admin = true WHERE id = auth.uid()` and self-promote. Revoke
--    column-level UPDATE on privilege/billing columns + add a BEFORE UPDATE
--    trigger as defense-in-depth. Admin mutations continue to flow through the
--    existing `admin_set_admin / admin_set_blog / admin_set_moderator /
--    admin_ban_user` SECURITY DEFINER RPCs.
--
-- 2. PII tighten: drop the wide `qual=true` SELECT policy on `profiles`,
--    revoke column SELECT on email/Stripe columns from anon+authenticated,
--    and surface own-profile + admin-list reads through new SECURITY DEFINER
--    RPCs. Other users' display_name / avatar_url / public flags stay
--    readable (column grants kept).
--
-- 3. `invite_tokens` are secrets — drop the public SELECT, add a SECURITY
--    DEFINER `resolve_invite(token)` RPC so a known token can be resolved but
--    the table cannot be enumerated.
--
-- 4. `user_keys` (public ECDH keys for E2E DMs) — restrict SELECT to
--    `authenticated`. anon doesn't need them.
--
-- 5. Revoke anon DML on user-data tables (defense-in-depth; RLS already
--    blocks but one bad policy = total breach).
--
-- 6. Storage: set MIME allowlist + 2MB size limit on the public buckets
--    (`avatars`, `post-images`, `thumbnails`) to block SVG/XSS + cost abuse.
--
-- Apply via the Supabase Studio SQL Editor or `supabase db push`. The
-- migration is transactional — if any step fails, none of it takes effect.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES — block self-promotion + lock privilege columns
-- ────────────────────────────────────────────────────────────────────────────

REVOKE INSERT (is_admin, is_moderator, is_banned, can_blog, is_approved_creator,
               stripe_customer_id, stripe_subscription_id, subscription_status)
  ON public.profiles FROM anon, authenticated;

REVOKE UPDATE (is_admin, is_moderator, is_banned, can_blog, is_approved_creator,
               stripe_customer_id, stripe_subscription_id, subscription_status)
  ON public.profiles FROM anon, authenticated;

REVOKE REFERENCES (is_admin, is_moderator, is_banned, can_blog, is_approved_creator,
                   stripe_customer_id, stripe_subscription_id, subscription_status)
  ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF (NEW.is_admin             IS DISTINCT FROM OLD.is_admin
   OR NEW.is_moderator         IS DISTINCT FROM OLD.is_moderator
   OR NEW.is_banned            IS DISTINCT FROM OLD.is_banned
   OR NEW.is_approved_creator  IS DISTINCT FROM OLD.is_approved_creator
   OR NEW.can_blog             IS DISTINCT FROM OLD.can_blog
   OR NEW.stripe_customer_id   IS DISTINCT FROM OLD.stripe_customer_id
   OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
   OR NEW.subscription_status  IS DISTINCT FROM OLD.subscription_status) THEN
    RAISE EXCEPTION 'privileged column modification blocked (use the admin_* RPCs)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_no_priv_escalation ON public.profiles;
CREATE TRIGGER profiles_no_priv_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES — stop the email + Stripe PII dump
-- ────────────────────────────────────────────────────────────────────────────

-- Drop the wide-open SELECT policy. Other authed users can still read public
-- columns (display_name, avatar_url, bio, etc.) because column GRANTs stay;
-- the new policy below grants the row-level pass.
DROP POLICY IF EXISTS "Authenticated users can read public profile fields" ON public.profiles;

CREATE POLICY profiles_authenticated_read_public ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Sensitive columns: column-level REVOKE from anon + authenticated. Own-profile
-- and admin reads use the SECURITY DEFINER RPCs below to bypass.
REVOKE SELECT (email,
               stripe_customer_id,
               stripe_subscription_id,
               subscription_status,
               email_notifications,
               email_notifications_blog,
               email_notifications_digest,
               email_notifications_streak,
               email_marketing_unsubscribed,
               onboarding_emails_sent,
               terms_accepted_at)
  ON public.profiles FROM anon, authenticated;

-- Own-profile read (full row) — replaces direct `select('id, email, ...')` for self.
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.profiles WHERE id = (SELECT auth.uid())
$$;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;

-- Admin user list — full row, gated by is_admin(). No need for the admin to
-- have raw column SELECT grants.
CREATE OR REPLACE FUNCTION public.admin_list_users(p_limit int DEFAULT 1000)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
    SELECT * FROM public.profiles
    ORDER BY created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 5000));
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_users(int) TO authenticated;

-- Admin profile lookup by id — used by admin tooling for user inspection.
CREATE OR REPLACE FUNCTION public.admin_get_profile(p_user_id uuid)
RETURNS public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  SELECT * INTO result FROM public.profiles WHERE id = p_user_id;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_get_profile(uuid) TO authenticated;

-- Audit log expansion — replaces `select(... actor:actor_id(display_name, email))`
CREATE OR REPLACE FUNCTION public.admin_list_audit_log(p_limit int DEFAULT 100, p_offset int DEFAULT 0)
RETURNS TABLE (
  id          uuid,
  action      text,
  target_id   uuid,
  target_email text,
  metadata    jsonb,
  created_at  timestamptz,
  actor_display_name text,
  actor_email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
    SELECT a.id, a.action, a.target_id, a.target_email, a.metadata, a.created_at,
           p.display_name, p.email
    FROM public.admin_audit_log a
    LEFT JOIN public.profiles p ON p.id = a.actor_id
    ORDER BY a.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 1000))
    OFFSET GREATEST(0, p_offset);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_audit_log(int, int) TO authenticated;

-- Enrich a list of user IDs with email + display_name. Used by admin views
-- (campaign sends, content reports, creator requests, etc.) instead of a
-- `profiles!fk(email)` join — the column SELECT grant on `email` is revoked.
CREATE OR REPLACE FUNCTION public.admin_get_user_emails(p_user_ids uuid[])
RETURNS TABLE (id uuid, display_name text, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
    SELECT p.id, p.display_name, p.email
    FROM public.profiles p
    WHERE p.id = ANY(p_user_ids);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_get_user_emails(uuid[]) TO authenticated;

-- "Am I premium?" lookup for friends.ts — was reading subscription_status + is_admin
-- directly. subscription_status is now revoked from authenticated; is_admin stays.
-- This RPC returns just the boolean so callers don't see another user's status.
CREATE OR REPLACE FUNCTION public.user_has_premium(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(is_admin, false)
      OR subscription_status IN ('active','trialing')
  FROM public.profiles
  WHERE id = p_user_id
$$;
GRANT EXECUTE ON FUNCTION public.user_has_premium(uuid) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. INVITE_TOKENS — drop public read, expose lookup via RPC
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "anyone can look up token owner" ON public.invite_tokens;

CREATE POLICY invite_tokens_owner_read ON public.invite_tokens
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.resolve_invite(p_token text)
RETURNS TABLE (id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id, p.display_name, p.avatar_url
  FROM public.invite_tokens t
  JOIN public.profiles p ON p.id = t.user_id
  WHERE t.token = p_token
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.resolve_invite(text) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. USER_KEYS — restrict SELECT to authenticated (was public/anon)
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users can read any public key" ON public.user_keys;
CREATE POLICY user_keys_auth_read ON public.user_keys
  FOR SELECT TO authenticated
  USING (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Revoke anon DML on sensitive tables (defense-in-depth)
-- ────────────────────────────────────────────────────────────────────────────

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.profiles,
  public.ai_conversations,
  public.ai_messages,
  public.ai_usage_logs,
  public.messages,
  public.conversations,
  public.conversation_participants,
  public.push_subscriptions,
  public.email_campaigns,
  public.invite_tokens,
  public.user_keys,
  public.study_notes,
  public.reading_progress
FROM anon;

REVOKE SELECT ON
  public.ai_usage_logs,
  public.email_campaigns,
  public.push_subscriptions,
  public.messages,
  public.conversations
FROM anon;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. STORAGE — MIME allowlist + size limit on public buckets
-- ────────────────────────────────────────────────────────────────────────────

UPDATE storage.buckets
SET file_size_limit    = 2097152,  -- 2 MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id IN ('avatars','post-images','thumbnails');

COMMIT;
