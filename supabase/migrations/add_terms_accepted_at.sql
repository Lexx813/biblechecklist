-- Track when a user explicitly accepted the Terms of Service and Privacy Policy.
-- NULL means not yet accepted — used to gate app access for all users,
-- including those who sign in via Google OAuth (who bypass the registration form).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz NULL;
