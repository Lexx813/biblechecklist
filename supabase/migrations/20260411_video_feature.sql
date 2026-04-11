-- 1. Creator approval flag on profiles
alter table profiles add column if not exists is_approved_creator boolean not null default false;

-- 2. Creator requests
create table if not exists creator_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references profiles(id) on delete cascade not null,
  display_name      text not null,
  topic_description text not null,
  sample_url        text,
  status            text not null default 'pending',
  reviewed_by       uuid references profiles(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  constraint creator_requests_user_unique unique (user_id),
  constraint creator_requests_status_check check (status in ('pending','approved','denied'))
);

-- 3. Videos
create table if not exists videos (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  description   text,
  creator_id    uuid references profiles(id) on delete cascade not null,
  embed_url     text,
  storage_path  text,
  duration_sec  int,
  thumbnail_url text,
  published     boolean not null default false,
  likes_count   int not null default 0,
  created_at    timestamptz not null default now(),
  constraint videos_source_check check (
    (embed_url is not null and storage_path is null)
    or (embed_url is null and storage_path is not null)
  )
);

-- 4. Video likes (composite PK prevents duplicate likes)
create table if not exists video_likes (
  user_id    uuid references profiles(id) on delete cascade not null,
  video_id   uuid references videos(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- 5. Video comments (separate table — blog_comments.post_id is FK to blog_posts)
create table if not exists video_comments (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid references videos(id) on delete cascade not null,
  author_id  uuid references profiles(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz not null default now()
);

-- 6. RLS: creator_requests
alter table creator_requests enable row level security;
create policy "members can insert own request" on creator_requests
  for insert with check (auth.uid() = user_id);
create policy "members can view own request" on creator_requests
  for select using (auth.uid() = user_id);
create policy "admins can manage all requests" on creator_requests
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- 7. RLS: videos
alter table videos enable row level security;
create policy "public can view published videos" on videos
  for select using (published = true);
create policy "creators can view own videos" on videos
  for select using (auth.uid() = creator_id);
create policy "approved creators can insert" on videos
  for insert with check (
    auth.uid() = creator_id and
    exists (select 1 from profiles where id = auth.uid() and is_approved_creator = true)
  );
create policy "creators can update own videos" on videos
  for update using (auth.uid() = creator_id);
create policy "admins can manage all videos" on videos
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- 8. RLS: video_likes
alter table video_likes enable row level security;
create policy "authenticated can like" on video_likes
  for insert with check (auth.uid() = user_id);
create policy "users can unlike" on video_likes
  for delete using (auth.uid() = user_id);
create policy "anyone can view likes" on video_likes
  for select using (true);

-- 9. RLS: video_comments
alter table video_comments enable row level security;
create policy "anyone can view video comments" on video_comments
  for select using (true);
create policy "authenticated can comment on video" on video_comments
  for insert with check (auth.uid() = author_id);
create policy "authors can delete own video comment" on video_comments
  for delete using (auth.uid() = author_id);
create policy "admins can delete any video comment" on video_comments
  for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- 10. RPC: toggle_video_like → returns {liked: bool, likes_count: int}
create or replace function toggle_video_like(p_video_id uuid)
returns json language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_liked   boolean;
  v_count   int;
begin
  if exists (select 1 from video_likes where user_id = v_user_id and video_id = p_video_id) then
    delete from video_likes where user_id = v_user_id and video_id = p_video_id;
    update videos set likes_count = greatest(0, likes_count - 1) where id = p_video_id;
    v_liked := false;
  else
    insert into video_likes (user_id, video_id) values (v_user_id, p_video_id);
    update videos set likes_count = likes_count + 1 where id = p_video_id;
    v_liked := true;
  end if;
  select likes_count into v_count from videos where id = p_video_id;
  return json_build_object('liked', v_liked, 'likes_count', v_count);
end;
$$;

-- 11. RPC: admin_approve_creator
create or replace function admin_approve_creator(p_user_id uuid, p_approved boolean)
returns void language plpgsql security definer as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Not authorized';
  end if;
  update profiles set is_approved_creator = p_approved where id = p_user_id;
  update creator_requests
    set status      = case when p_approved then 'approved' else 'denied' end,
        reviewed_by = auth.uid(),
        reviewed_at = now()
  where user_id = p_user_id;
end;
$$;
