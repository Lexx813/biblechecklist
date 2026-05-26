-- Anon needs to be able to read public profile fields so SSR pages (blog
-- index, blog post authors, forum thread authors) can join profiles for
-- display_name + avatar. The existing RLS policy `profiles_anon_read_public`
-- intends this, but the SQL-level GRANT was never applied, so anon could
-- not even open the table — every public-route join silently returned
-- `permission denied for table profiles`, the SSR catch block swallowed
-- it, and pages like /blog rendered empty.
--
-- Column-level grant keeps sensitive fields (email, stripe_*, is_admin,
-- is_banned, subscription_status, etc.) inaccessible to anon — only the
-- explicitly-listed public-display columns are exposed.
grant select (id, display_name, avatar_url, bio, cover_url, top_badge_level)
  on public.profiles
  to anon;
