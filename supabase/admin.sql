-- Run this in your Supabase SQL Editor

-- 1. Profiles table (mirrors auth.users)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 2. Security-definer helper — avoids recursive RLS when checking admin status
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  )
$$;

-- 3. RLS policies
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- 4. Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Backfill profiles for any existing users
insert into public.profiles (id, email, created_at)
select id, email, created_at
from auth.users
on conflict (id) do nothing;

-- 6. RPC to delete a user (admin only, bypasses RLS via security definer)
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;
  delete from auth.users where id = target_user_id;
end;
$$;

-- 7. RPC to toggle admin status
create or replace function public.admin_set_admin(target_user_id uuid, new_value boolean)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;
  update public.profiles set is_admin = new_value where id = target_user_id;
end;
$$;

-- 8. Make yourself an admin — replace with your actual user ID from the Auth tab
-- update public.profiles set is_admin = true where email = 'your@email.com';
