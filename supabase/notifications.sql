-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('reply','comment','mention')),
  thread_id uuid references public.forum_threads(id) on delete cascade,
  post_id uuid references public.blog_posts(id) on delete cascade,
  body_preview text,
  link_hash text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "users_see_own_notifs" on public.notifications for select using (auth.uid() = user_id);
create policy "insert_notifs" on public.notifications for insert with check (true);
create policy "users_update_own_notifs" on public.notifications for update using (auth.uid() = user_id);
create index if not exists notif_user_idx on public.notifications(user_id, read, created_at desc);

-- Create a single notification (skips if actor = recipient)
create or replace function public.create_notification(
  p_user_id uuid, p_actor_id uuid, p_type text,
  p_thread_id uuid default null, p_post_id uuid default null,
  p_preview text default null, p_link_hash text default null
) returns void language plpgsql security definer as $$
begin
  if p_user_id = p_actor_id then return; end if;
  insert into public.notifications(user_id, actor_id, type, thread_id, post_id, body_preview, link_hash)
  values(p_user_id, p_actor_id, p_type, p_thread_id, p_post_id, p_preview, p_link_hash);
end; $$;

-- Batch mark notifications as read (only own)
create or replace function public.mark_notifications_read(p_ids uuid[])
returns void language sql security definer as $$
  update public.notifications set read = true where id = any(p_ids) and user_id = auth.uid();
$$;

-- Profile prefix search for @mention autocomplete
create or replace function public.search_profiles_by_name(p_prefix text, p_limit int default 8)
returns table(id uuid, display_name text, avatar_url text)
language sql stable security definer as $$
  select id, display_name, avatar_url from public.profiles
  where display_name ilike p_prefix || '%'
  order by display_name asc limit p_limit;
$$;
