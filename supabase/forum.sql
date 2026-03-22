-- Run this in your Supabase SQL Editor

-- 1. Categories
create table public.forum_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  icon        text not null default '💬',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- 2. Threads
create table public.forum_threads (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  content     text not null,
  pinned      boolean not null default false,
  locked      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. Replies
create table public.forum_replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.forum_threads(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Enable RLS
alter table public.forum_categories enable row level security;
alter table public.forum_threads    enable row level security;
alter table public.forum_replies    enable row level security;

-- 5. Categories: public read
create policy "Anyone can read categories"
  on public.forum_categories for select using (true);

-- 6. Threads: public read, auth users create, owners edit/delete, admins all
create policy "Anyone can read threads"
  on public.forum_threads for select using (true);

create policy "Auth users can create threads"
  on public.forum_threads for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own threads"
  on public.forum_threads for update
  using (auth.uid() = author_id);

create policy "Authors can delete own threads"
  on public.forum_threads for delete
  using (auth.uid() = author_id);

create policy "Admins can manage all threads"
  on public.forum_threads for all
  using (public.is_admin()) with check (public.is_admin());

-- 7. Replies: public read, auth users create on unlocked threads, owners edit/delete, admins all
create policy "Anyone can read replies"
  on public.forum_replies for select using (true);

create policy "Auth users can reply to unlocked threads"
  on public.forum_replies for insert
  with check (
    auth.uid() = author_id and
    not exists (select 1 from public.forum_threads where id = thread_id and locked = true)
  );

create policy "Authors can update own replies"
  on public.forum_replies for update
  using (auth.uid() = author_id);

create policy "Authors can delete own replies"
  on public.forum_replies for delete
  using (auth.uid() = author_id);

create policy "Admins can manage all replies"
  on public.forum_replies for all
  using (public.is_admin()) with check (public.is_admin());

-- 8. Admin RPCs
create or replace function public.admin_pin_thread(p_thread_id uuid, new_value boolean)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then raise exception 'Unauthorized'; end if;
  update public.forum_threads set pinned = new_value where id = p_thread_id;
end;
$$;

create or replace function public.admin_lock_thread(p_thread_id uuid, new_value boolean)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then raise exception 'Unauthorized'; end if;
  update public.forum_threads set locked = new_value where id = p_thread_id;
end;
$$;

-- 9. Bump thread updated_at when a reply is added (keeps "last activity" sort correct)
create or replace function public.bump_thread_on_reply()
returns trigger language plpgsql as $$
begin
  update public.forum_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

create trigger on_reply_inserted
  after insert on public.forum_replies
  for each row execute function public.bump_thread_on_reply();

-- 10. Seed default categories
insert into public.forum_categories (name, description, icon, sort_order) values
  ('Bible Study',        'In-depth discussions about scripture and doctrine', '📖', 1),
  ('Prayer & Reflection','Share prayer requests and personal reflections',     '🙏', 2),
  ('General Discussion', 'Community chat and off-topic conversation',          '💬', 3),
  ('Questions',          'Ask questions about the Bible or faith',             '❓', 4),
  ('Announcements',      'Community news and updates',                         '📣', 5);
