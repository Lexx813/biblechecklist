-- Add visibility column to user_posts: 'public' (default) or 'friends'
ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
