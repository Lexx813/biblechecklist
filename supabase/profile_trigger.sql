-- Run this in your Supabase SQL Editor
-- Creates a trigger that auto-populates the profiles table when a new user signs up,
-- pulling display_name from the user metadata set during signUp().

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)  -- fallback: use part before @ if no name given
    )
  )
  on conflict (id) do update
    set
      display_name = coalesce(
        excluded.display_name,
        profiles.display_name
      );
  return new;
end;
$$;

-- Drop old trigger if it exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
