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
          ts_rank(
            to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')),
            v_ts
          ) as rank
        from public.blog_posts
        where published = true
          and to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')) @@ v_ts
        order by rank desc limit p_limit
      ) r
    ), '[]'::jsonb),
    'threads', coalesce((
      select jsonb_agg(r) from (
        select t.id, t.title, t.category_id,
          ts_rank(
            to_tsvector('english', coalesce(t.title,'') || ' ' || coalesce(t.content,'')),
            v_ts
          ) as rank
        from public.forum_threads t
        where to_tsvector('english', coalesce(t.title,'') || ' ' || coalesce(t.content,'')) @@ v_ts
        order by rank desc limit p_limit
      ) r
    ), '[]'::jsonb)
  );
end; $$;
