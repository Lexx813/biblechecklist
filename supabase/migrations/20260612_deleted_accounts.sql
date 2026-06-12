-- Record of deleted accounts so we retain the email after the auth user +
-- profile row are gone. Covers both self-service deletes (/api/delete-account)
-- and admin-initiated deletes (/api/admin-delete-user).
--
-- Why a dedicated table instead of admin_audit_log:
--   admin_audit_log.actor_id is NOT NULL with an FK ON DELETE SET NULL to
--   profiles. A self-deleter's profile is cascade-deleted, which conflicts with
--   that NOT NULL column. This table stores email/display_name as plain text
--   and has no FK that the deletion can break, so the record always survives.

CREATE TABLE IF NOT EXISTS public.deleted_accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,                         -- the deleted user's id (no FK; the row is gone)
  email         text,                         -- the saved email — the whole point
  display_name  text,
  deletion_type text NOT NULL CHECK (deletion_type IN ('self', 'admin')),
  deleted_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- admin who did it; NULL for self
  ip            text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deleted_accounts_created_idx
  ON public.deleted_accounts (created_at DESC);

ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Admins read. The service role (used by the /api/delete-* routes) bypasses RLS
-- for the INSERT; there is no client-side write path.
DROP POLICY IF EXISTS "admins can read deleted_accounts" ON public.deleted_accounts;
CREATE POLICY "admins can read deleted_accounts"
  ON public.deleted_accounts
  FOR SELECT
  USING (public.is_admin());

-- Admin reader: joins the deleter's name/email for display. SECURITY DEFINER +
-- is_admin() gate, mirroring admin_list_audit_log.
CREATE OR REPLACE FUNCTION public.admin_list_deleted_accounts(p_limit int DEFAULT 100, p_offset int DEFAULT 0)
RETURNS TABLE (
  id                uuid,
  user_id           uuid,
  email             text,
  display_name      text,
  deletion_type     text,
  deleted_by        uuid,
  deleted_by_name   text,
  deleted_by_email  text,
  ip                text,
  user_agent        text,
  created_at        timestamptz
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
    SELECT d.id, d.user_id, d.email, d.display_name, d.deletion_type,
           d.deleted_by, p.display_name, p.email, d.ip, d.user_agent, d.created_at
    FROM public.deleted_accounts d
    LEFT JOIN public.profiles p ON p.id = d.deleted_by
    ORDER BY d.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 1000))
    OFFSET GREATEST(0, p_offset);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_deleted_accounts(int, int) TO authenticated;
