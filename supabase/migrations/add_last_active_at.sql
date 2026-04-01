-- Track last active timestamp on profiles for re-engagement email targeting

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
