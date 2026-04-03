-- Allow users to hide themselves from the Who's Online widget and community page

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_online boolean NOT NULL DEFAULT true;
