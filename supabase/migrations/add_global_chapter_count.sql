-- RPC to count total completed chapters across all users (for landing page stats)

CREATE OR REPLACE FUNCTION get_global_chapter_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)
  FROM reading_progress rp,
       jsonb_each(rp.progress) AS b(book_key, book_val),
       jsonb_each(book_val) AS ch(ch_key, ch_val)
  WHERE ch_val::text = 'true';
$$;
