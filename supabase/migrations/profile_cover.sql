-- Add cover photo URL to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url text;
