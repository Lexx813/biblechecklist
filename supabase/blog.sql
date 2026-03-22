-- Run this in your Supabase SQL Editor

-- 1. Add blog permission to profiles
alter table public.profiles
  add column if not exists can_blog boolean not null default false;

-- 2. Security-definer helper to check blog permission
create or replace function public.can_blog()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select can_blog from public.profiles where id = auth.uid()),
    false
  )
$$;

-- 3. Admin RPC to toggle blog permission
create or replace function public.admin_set_blog(target_user_id uuid, new_value boolean)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;
  update public.profiles set can_blog = new_value where id = target_user_id;
end;
$$;

-- 4. Blog posts table (author_id references profiles so joins work via REST API)
create table public.blog_posts (
  id        uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title     text not null,
  slug      text not null unique,
  excerpt   text not null default '',
  content   text not null default '',
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Anyone can read published posts
create policy "Public can read published posts"
  on public.blog_posts for select
  using (published = true);

-- Authors can read their own posts (drafts too)
create policy "Authors can read own posts"
  on public.blog_posts for select
  using (auth.uid() = author_id);

-- Permitted users can create posts
create policy "Blog writers can create posts"
  on public.blog_posts for insert
  with check (auth.uid() = author_id and public.can_blog());

-- Authors can update their own posts
create policy "Authors can update own posts"
  on public.blog_posts for update
  using (auth.uid() = author_id and public.can_blog());

-- Authors can delete their own posts
create policy "Authors can delete own posts"
  on public.blog_posts for delete
  using (auth.uid() = author_id);

-- Admins can manage everything
create policy "Admins can manage all posts"
  on public.blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());
