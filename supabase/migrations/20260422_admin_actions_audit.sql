-- Audit log for privileged admin operations (user deletes, subscription overrides, etc.).
-- A stolen admin token is loud on this table; it also gives us forensics on abuse.

CREATE TABLE IF NOT EXISTS admin_actions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action     text NOT NULL,
  target_id  uuid,
  ip         text,
  user_agent text,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_actions_admin_time_idx
  ON admin_actions (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_action_time_idx
  ON admin_actions (action, created_at DESC);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can read. The service role (used by admin API routes) bypasses RLS.
CREATE POLICY "admins can read admin_actions"
  ON admin_actions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- No direct INSERT from anon/authenticated clients — writes come from service-role
-- in the /api/admin-* route handlers.
