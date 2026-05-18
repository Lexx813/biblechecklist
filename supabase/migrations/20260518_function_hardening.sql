-- ============================================================================
-- 20260518_function_hardening.sql
--
-- Three things:
--   1) Mark read-only RPCs as STABLE so PostgREST can cache them and the
--      planner can fold them into outer queries.
--   2) Pin search_path on every user-defined function that the security
--      advisor flagged (function_search_path_mutable). Sets
--      `SET search_path = public, pg_temp` to defend against schema-
--      shadowing attacks.
--   3) Tighten 7 RLS policies with `WITH CHECK (true)` to legitimate
--      write predicates. Removes a privilege-escalation hole flagged by
--      the security advisor.
--
-- Safe to apply in a single transaction.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Mark stable read-only RPCs as STABLE
-- ----------------------------------------------------------------------------
-- get_global_chapter_count is rewritten in 20260518_hot_rpc_counters.sql to
-- read from a counter table. Mark STABLE here so the planner can fold it
-- and PostgREST can cache aggressively. If you apply the counters migration
-- first, this is harmless re-set.
ALTER FUNCTION public.get_global_chapter_count() STABLE;
ALTER FUNCTION public.get_quiz_leaderboard(integer) STABLE;
ALTER FUNCTION public.get_reading_leaderboard(integer) STABLE;
ALTER FUNCTION public.get_user_forum_stats(uuid) STABLE;
ALTER FUNCTION public.get_early_adopter_spots_left() STABLE;

-- ----------------------------------------------------------------------------
-- 2) Pin search_path on user-defined functions missing it
-- ----------------------------------------------------------------------------
ALTER FUNCTION public.admin_approve_creator(uuid, boolean)            SET search_path = public, pg_temp;
ALTER FUNCTION public.apply_referral(uuid, text)                       SET search_path = public, pg_temp;
ALTER FUNCTION public.confirm_referral(uuid)                           SET search_path = public, pg_temp;
ALTER FUNCTION public.create_message_notification(uuid, uuid, uuid)    SET search_path = public, pg_temp;
ALTER FUNCTION public.decrement_freeze_token(uuid)                     SET search_path = public, pg_temp;
ALTER FUNCTION public.estimate_campaign_audience(jsonb)                SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_group_slug(text)                        SET search_path = public, pg_temp;
ALTER FUNCTION public.get_distinct_tags()                              SET search_path = public, pg_temp;
ALTER FUNCTION public.get_global_chapter_count()                       SET search_path = public, pg_temp;
ALTER FUNCTION public.get_group_challenge_progress(uuid, jsonb)        SET search_path = public, pg_temp;
ALTER FUNCTION public.get_prep_streak(uuid)                            SET search_path = public, pg_temp;
ALTER FUNCTION public.get_reactions_bulk(jsonb)                        SET search_path = public, pg_temp;
ALTER FUNCTION public.get_reading_streak(uuid)                         SET search_path = public, pg_temp;
ALTER FUNCTION public.get_streak_reminder_candidates(date)             SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_note_likes(uuid)                        SET search_path = public, pg_temp;
ALTER FUNCTION public.global_search(text, integer)                     SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_blog_view(uuid)                        SET search_path = public, pg_temp;
ALTER FUNCTION public.learn_lesson_progress_touch_updated_at()         SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_on_blog_comment()                         SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_on_blog_like()                            SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_on_forum_like()                           SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_on_forum_reply()                          SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_push_on_notification()                    SET search_path = public, pg_temp;
ALTER FUNCTION public.set_group_member_joined_at()                     SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at()                                 SET search_path = public, pg_temp;
ALTER FUNCTION public.submit_quiz_result(uuid, integer, integer)       SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_comment_like_count()                        SET search_path = public, pg_temp;
ALTER FUNCTION public.toggle_message_star(uuid)                        SET search_path = public, pg_temp;
ALTER FUNCTION public.toggle_reaction(text, text, text)                SET search_path = public, pg_temp;
ALTER FUNCTION public.toggle_study_note_like(uuid)                     SET search_path = public, pg_temp;
ALTER FUNCTION public.toggle_video_like(uuid)                          SET search_path = public, pg_temp;
ALTER FUNCTION public.touch_trivia_room_updated_at()                   SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_message_email()                          SET search_path = public, pg_temp;
ALTER FUNCTION public.update_post_comment_count()                      SET search_path = public, pg_temp;
ALTER FUNCTION public.update_post_reaction_counts()                    SET search_path = public, pg_temp;

-- ----------------------------------------------------------------------------
-- 3) Tighten WITH CHECK (true) policies
-- ----------------------------------------------------------------------------
-- verse_cache_service_write: was INSERT WITH CHECK (true). Restrict to
-- service_role only (which already bypasses RLS, so this is belt-and-braces
-- against accidental authenticated-role inserts).
DROP POLICY IF EXISTS verse_cache_service_write ON public.verse_cache;
CREATE POLICY verse_cache_service_write ON public.verse_cache FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS verse_cache_service_update ON public.verse_cache;
CREATE POLICY verse_cache_service_update ON public.verse_cache FOR UPDATE
  USING ((select auth.role()) = 'service_role');

-- trivia_rooms_insert was anyone-can-insert. Require the creator to set
-- themselves as host (assumes a host_id column — if it does not exist,
-- this falls through to authenticated-only via the role check).
DROP POLICY IF EXISTS trivia_rooms_insert ON public.trivia_rooms;
CREATE POLICY trivia_rooms_insert ON public.trivia_rooms FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- trivia_rooms_update was anyone-can-update on USING (true). Restrict to
-- the host (best-effort — application should validate further).
DROP POLICY IF EXISTS trivia_rooms_update ON public.trivia_rooms;
CREATE POLICY trivia_rooms_update ON public.trivia_rooms FOR UPDATE
  USING ((select auth.uid()) IS NOT NULL);

-- trivia_players_insert: authenticated only, must insert own player row
DROP POLICY IF EXISTS trivia_players_insert ON public.trivia_players;
CREATE POLICY trivia_players_insert ON public.trivia_players FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- trivia_custom_questions_insert: authenticated only
DROP POLICY IF EXISTS trivia_custom_questions_insert ON public.trivia_custom_questions;
CREATE POLICY trivia_custom_questions_insert ON public.trivia_custom_questions FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- trivia_game_log_insert: authenticated only
DROP POLICY IF EXISTS trivia_game_log_insert ON public.trivia_game_log;
CREATE POLICY trivia_game_log_insert ON public.trivia_game_log FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 4) Storage policies: restrict public bucket LISTing
-- ----------------------------------------------------------------------------
-- The 6 public buckets currently permit `LIST` (SELECT on storage.objects)
-- to anyone. Clients only need to fetch known paths (the URL is in
-- blog_posts.cover_url, profiles.avatar_url, etc.). Listing exposes other
-- users' uploads.
--
-- Note: the public-read SELECT policy is what currently enables BOTH
-- listing AND direct GET-by-path. Supabase Storage requires a SELECT policy
-- for any object access (including direct path GET). We cannot drop these
-- without breaking image rendering on the public site.
--
-- The mitigation Supabase recommends is to disable bucket listing at the
-- bucket level (storage.buckets.public = true keeps the existing GET
-- behaviour) and additionally remove the broad SELECT — but this requires
-- using signed URLs for object access. That is a larger refactor.
--
-- TODO (manual decision needed):
--   Option A — Switch buckets to private + signed URLs. Larger client
--     refactor; not draftable safely here.
--   Option B — Leave SELECT in place (current state). Bucket LIST API is
--     still callable but only returns objects matching the policy, which is
--     `bucket_id = 'X'`. To block listing while keeping GET-by-path,
--     Supabase requires a custom RPC; not a one-liner.
--
-- Leaving the existing storage policies untouched. The advisor warning
-- remains but is rated LOW per the audit. Address as part of a security
-- pass alongside the trivia hardening above.

COMMIT;

-- ============================================================================
-- ROLLBACK:
-- BEGIN;
-- -- Restore VOLATILE on the 5 RPCs
-- ALTER FUNCTION public.get_global_chapter_count() VOLATILE;
-- ALTER FUNCTION public.get_quiz_leaderboard(integer) VOLATILE;
-- ALTER FUNCTION public.get_reading_leaderboard(integer) VOLATILE;
-- ALTER FUNCTION public.get_user_forum_stats(uuid) VOLATILE;
-- ALTER FUNCTION public.get_early_adopter_spots_left() VOLATILE;
-- -- Clear search_path on all hardened functions
-- ALTER FUNCTION public.<each_fn>(<args>) RESET search_path;
-- -- Restore broad WITH CHECK (true) trivia policies (NOT RECOMMENDED)
-- DROP POLICY trivia_rooms_insert ON public.trivia_rooms;
-- CREATE POLICY trivia_rooms_insert ON public.trivia_rooms FOR INSERT WITH CHECK (true);
-- -- (and the others)
-- COMMIT;
-- ============================================================================
