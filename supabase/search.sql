-- Stored tsvector columns + GIN indexes for fast FTS
-- (applied via migration: fts_indexes_and_realtime)
--
-- blog_posts.search_vector  GENERATED ALWAYS AS to_tsvector('english', title||excerpt||content) STORED
-- forum_threads.search_vector GENERATED ALWAYS AS to_tsvector('english', title||content) STORED
-- INDEX idx_blog_posts_fts   ON blog_posts   USING gin(search_vector)
-- INDEX idx_forum_threads_fts ON forum_threads USING gin(search_vector)

-- Global full-text search across blog posts and forum threads
create or replace function public.global_search(p_query text, p_limit int default 6)
returns jsonb language plpgsql stable security definer as $$
declare v_ts tsquery;
begin
  begin
    v_ts := plainto_tsquery('english', p_query);
  exception when others then
    return '{"posts":[],"threads":[]}'::jsonb;
  end;

  return jsonb_build_object(
    'posts', coalesce((
      select jsonb_agg(r) from (
        select id, title, slug, excerpt,
          ts_rank(search_vector, v_ts) as rank
        from public.blog_posts
        where published = true
          and search_vector @@ v_ts
        order by rank desc limit p_limit
      ) r
    ), '[]'::jsonb),
    'threads', coalesce((
      select jsonb_agg(r) from (
        select t.id, t.title, t.category_id,
          ts_rank(t.search_vector, v_ts) as rank
        from public.forum_threads t
        where t.search_vector @@ v_ts
        order by rank desc limit p_limit
      ) r
    ), '[]'::jsonb),
    'users', coalesce((
      select jsonb_agg(r) from (
        select id, display_name, avatar_url
        from public.profiles
        where display_name ilike '%' || p_query || '%'
          and display_name is not null
        order by display_name limit p_limit
      ) r
    ), '[]'::jsonb)
  );
end; $$;
