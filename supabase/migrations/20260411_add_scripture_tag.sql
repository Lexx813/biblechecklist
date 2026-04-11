-- supabase/migrations/20260411_add_scripture_tag.sql
ALTER TABLE videos ADD COLUMN IF NOT EXISTS scripture_tag text;
