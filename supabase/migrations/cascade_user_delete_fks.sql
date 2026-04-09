-- Ensure admin user deletion is not blocked by dangling FK constraints.
-- profiles.id already cascades from auth.users, so deleting an auth user
-- cascades to profiles and every *_user_id/*_author_id FK that references
-- profiles or auth.users. Two constraints were missing an action:

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey,
  ADD CONSTRAINT profiles_referred_by_fkey
    FOREIGN KEY (referred_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE group_challenges
  DROP CONSTRAINT IF EXISTS group_challenges_created_by_fkey,
  ADD CONSTRAINT group_challenges_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE group_challenges
  ALTER COLUMN created_by DROP NOT NULL;
