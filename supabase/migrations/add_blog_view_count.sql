-- Add view_count column to blog_posts and increment function

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_blog_view(post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id;
$$;
