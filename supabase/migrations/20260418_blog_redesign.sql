-- Blog redesign schema: new columns, verse_cache, post_series tables

-- Add new columns to blog_posts
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS read_time_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- verse_cache: stores fetched NWT verse text
CREATE TABLE IF NOT EXISTS verse_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL,
  chapter integer NOT NULL,
  verse_start integer NOT NULL,
  verse_end integer,
  text text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book, chapter, verse_start, verse_end)
);

ALTER TABLE verse_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verse_cache_public_read" ON verse_cache FOR SELECT USING (true);
CREATE POLICY "verse_cache_service_write" ON verse_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "verse_cache_service_update" ON verse_cache FOR UPDATE USING (true);

-- post_series: named series owned by an author
CREATE TABLE IF NOT EXISTS post_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE post_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_public_read"   ON post_series FOR SELECT USING (true);
CREATE POLICY "series_author_write"  ON post_series FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "series_author_update" ON post_series FOR UPDATE USING (auth.uid() = author_id);

-- post_series_items: join table linking posts to series
CREATE TABLE IF NOT EXISTS post_series_items (
  series_id uuid NOT NULL REFERENCES post_series(id) ON DELETE CASCADE,
  post_id   uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  position  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (series_id, post_id)
);

ALTER TABLE post_series_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_items_public_read" ON post_series_items FOR SELECT USING (true);
CREATE POLICY "series_items_author_write" ON post_series_items
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT author_id FROM post_series WHERE id = series_id)
  );

-- Seed common verse texts for immediate use
INSERT INTO verse_cache (book, chapter, verse_start, text) VALUES
  ('John', 3, 16, '"For God loved the world so much that he gave his only-begotten Son, so that everyone exercising faith in him might not be destroyed but have everlasting life."'),
  ('Isaiah', 65, 21, '"They will build houses and live in them, and they will plant vineyards and eat their fruitage."'),
  ('Revelation', 21, 4, '"And he will wipe out every tear from their eyes, and death will be no more, neither will mourning nor outcry nor pain be anymore."'),
  ('Romans', 8, 21, '"that the creation itself will also be set free from enslavement to corruption and have the glorious freedom of the children of God."'),
  ('Psalms', 37, 29, '"The righteous will possess the earth, and they will live forever on it."'),
  ('John', 5, 28, '"Do not be amazed at this, for the hour is coming in which all those in the memorial tombs will hear his voice."'),
  ('Matthew', 6, 9, '"Our Father in the heavens, let your name be sanctified."'),
  ('Proverbs', 3, 5, '"Trust in Jehovah with all your heart, and do not rely on your own understanding."'),
  ('Micah', 7, 17, '"They will lick the dust like a serpent; like the creeping things of the earth they will come trembling out of their strongholds."'),
  ('Isaiah', 11, 9, '"They will not cause any harm or any ruin in all my holy mountain, because the earth will certainly be filled with the knowledge of Jehovah."')
ON CONFLICT (book, chapter, verse_start, verse_end) DO NOTHING;

-- Helper function for distinct tag autocomplete
CREATE OR REPLACE FUNCTION get_distinct_tags()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(array_agg(DISTINCT tag ORDER BY tag), ARRAY[]::text[])
  FROM blog_posts, unnest(tags) AS tag
  WHERE published = true;
$$;
