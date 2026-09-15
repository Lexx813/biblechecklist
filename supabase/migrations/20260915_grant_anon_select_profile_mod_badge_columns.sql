-- Public forum thread/reply pages join profiles to render an Admin/Moderator
-- badge next to the author name (src/views/forum/forumShared.tsx ModBadge,
-- consumed by ForumThreadDetail.tsx). forum.ts's PROFILE_FIELDS selects
-- is_moderator and is_admin alongside the already-public columns, but the
-- anon grant from 20260525_grant_anon_select_profile_public_columns.sql only
-- covered (id, display_name, avatar_url, bio, cover_url, top_badge_level).
-- Column-level GRANTs are all-or-nothing per query, so any anon-run query
-- touching is_moderator/is_admin was rejected outright with
-- `permission denied for table profiles`, breaking public forum thread
-- rendering.
--
-- Unlike email/stripe_*/is_banned/subscription_status, these two flags are
-- already rendered as a visible public badge on every forum post, so
-- exposing them to anon is not a new information leak.
grant select (is_moderator, is_admin)
  on public.profiles
  to anon;
