-- Bookmarks table
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  thread_id uuid references public.forum_threads(id) on delete cascade,
  post_id uuid references public.blog_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint bookmarks_one_target check ((thread_id is null) <> (post_id is null)),
  unique(user_id, thread_id),
  unique(user_id, post_id)
);
alter table public.bookmarks enable row level security;
create policy "users_own_bookmarks" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists bookmarks_user_idx on public.bookmarks(user_id, created_at desc);

-- Toggle bookmark (insert or delete)
create or replace function public.toggle_bookmark(
  p_thread_id uuid default null,
  p_post_id uuid default null
) returns jsonb language plpgsql security definer as $$
declare
  v_uid uuid := auth.uid();
  v_exists bool;
begin
  if p_thread_id is not null then
    select exists(select 1 from public.bookmarks where user_id=v_uid and thread_id=p_thread_id) into v_exists;
    if v_exists then
      delete from public.bookmarks where user_id=v_uid and thread_id=p_thread_id;
    else
      insert into public.bookmarks(user_id, thread_id) values(v_uid, p_thread_id);
    end if;
  else
    select exists(select 1 from public.bookmarks where user_id=v_uid and post_id=p_post_id) into v_exists;
    if v_exists then
      delete from public.bookmarks where user_id=v_uid and post_id=p_post_id;
    else
      insert into public.bookmarks(user_id, post_id) values(v_uid, p_post_id);
    end if;
  end if;
  return jsonb_build_object('bookmarked', not v_exists);
end; $$;
