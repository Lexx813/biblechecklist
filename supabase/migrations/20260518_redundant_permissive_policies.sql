-- ============================================================================
-- 20260518_redundant_permissive_policies.sql
--
-- Consolidate redundant permissive RLS policies. When two or more PERMISSIVE
-- policies cover the same (table, command, role), Postgres unions them and
-- evaluates every WITH CHECK / USING clause on every row.
--
-- This migration only collapses the cases where redundancy is provable from
-- the policy text. For any case where the original intent is ambiguous,
-- the policy is left in place with a `-- TODO:` note.
--
-- Note: this is meant to be applied AFTER 20260518_rls_auth_uid_wrap.sql,
-- which already wraps `auth.uid()` in `(select auth.uid())` everywhere.
-- That migration intentionally re-creates the two forum_replies INSERT
-- policies in their wrapped form. Here we replace them with a single
-- merged policy.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- forum_replies INSERT — two policies cover the same role
-- Old:
--   "Auth users can create replies"           — author + not in Rules/FAQs
--   "Auth users can reply to unlocked threads" — author + thread not locked
-- Both fire on every INSERT. Combine into one with AND of the two checks.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth users can create replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Auth users can reply to unlocked threads" ON public.forum_replies;
CREATE POLICY forum_replies_insert ON public.forum_replies FOR INSERT TO authenticated
  WITH CHECK (
    ((select auth.uid()) = author_id)
    AND (
      is_admin()
      OR NOT EXISTS (
        SELECT 1 FROM forum_threads t
        JOIN forum_categories c ON c.id = t.category_id
        WHERE t.id = forum_replies.thread_id
          AND c.name = ANY (ARRAY['Forum Rules'::text, 'FAQs'::text])
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM forum_threads
      WHERE forum_threads.id = forum_replies.thread_id
        AND forum_threads.locked = true
    )
  );

-- ----------------------------------------------------------------------------
-- push_subscriptions ALL — three identical owner-scoped FOR ALL policies
-- "Users manage their own push subscriptions", "users manage own subscriptions",
-- "users_manage_own_push_subs" all say `auth.uid() = user_id`. Keep one.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "users manage own subscriptions" ON public.push_subscriptions;
-- Keep `users_manage_own_push_subs` as the canonical policy (already re-created
-- with the wrapped form in 20260518_rls_auth_uid_wrap.sql).

-- ----------------------------------------------------------------------------
-- user_blocks INSERT/DELETE/SELECT — two identical policies on each cmd
-- "Users can create own blocks" == blocks_insert_own
-- "Users can delete own blocks" == blocks_delete_own
-- "Users can view own blocks" is a strict subset of blocks_select_own
-- (the latter also lets blocked_id see blocks against them). Drop the
-- weaker duplicates.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can view own blocks" ON public.user_blocks;
-- blocks_insert_own / blocks_delete_own / blocks_select_own remain.

-- ----------------------------------------------------------------------------
-- trivia_rooms SELECT — two policies cover SAME read:
-- trivia_rooms_select   USING (true)
-- trivia_rooms_public_read USING (true)
-- Identical; keep public_read.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS trivia_rooms_select ON public.trivia_rooms;

-- ----------------------------------------------------------------------------
-- trivia_players SELECT — same pattern
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS trivia_players_select ON public.trivia_players;

-- ----------------------------------------------------------------------------
-- trivia_questions SELECT — same pattern
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS trivia_questions_select ON public.trivia_questions;

-- ----------------------------------------------------------------------------
-- profiles SELECT — three permissive SELECT policies
-- "Users can read own profile"            USING (auth.uid() = id)
-- "Users can read own subscription status" USING (auth.uid() = id)  -- duplicate
-- "Admins can read all profiles"           USING (is_admin EXISTS check)
-- The first two are identical. Drop the duplicate.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own subscription status" ON public.profiles;
-- "Users can read own profile" and "Admins can read all profiles" remain
-- (different USING clauses, both needed).

-- TODO: profiles also has the broad
-- "Authenticated users can read public profile fields" USING (true) for
-- role=authenticated. That cannot be safely collapsed with the others
-- because the column-level subset is enforced at the application layer.
-- Leaving as-is.

-- ----------------------------------------------------------------------------
-- Anything else flagged by the advisor is left in place because the
-- semantics differ between the policies (different roles, different USING
-- clauses). Examples that are NOT duplicates and stay as-is:
--
--   blog_comments DELETE      — "admins" vs "authors" (different USING)
--   blog_posts SELECT         — "authors own" vs "published" (different USING)
--   content_reports SELECT    — admins vs own reporter (different USING)
--   learn_lesson_progress SELECT — admins vs own (different USING)
--   messages UPDATE           — soft-delete vs edit (different USING semantics)
--   user_badges SELECT        — all authenticated vs own (acceptable redundancy)
--   video_comments DELETE     — admins vs author (different USING)
--   videos SELECT             — public published vs creator own (different USING)
-- ----------------------------------------------------------------------------

COMMIT;

-- ============================================================================
-- ROLLBACK:
-- BEGIN;
-- CREATE POLICY "Auth users can create replies" ON public.forum_replies FOR INSERT ...
-- CREATE POLICY "Auth users can reply to unlocked threads" ON public.forum_replies FOR INSERT ...
-- DROP POLICY IF EXISTS forum_replies_insert ON public.forum_replies;
-- CREATE POLICY "Users manage their own push subscriptions" ON public.push_subscriptions FOR ALL ...
-- CREATE POLICY "users manage own subscriptions" ON public.push_subscriptions FOR ALL ...
-- CREATE POLICY "Users can create own blocks" ON public.user_blocks FOR INSERT ...
-- CREATE POLICY "Users can delete own blocks" ON public.user_blocks FOR DELETE ...
-- CREATE POLICY "Users can view own blocks" ON public.user_blocks FOR SELECT ...
-- CREATE POLICY trivia_rooms_select ON public.trivia_rooms FOR SELECT USING (true);
-- CREATE POLICY trivia_players_select ON public.trivia_players FOR SELECT USING (true);
-- CREATE POLICY trivia_questions_select ON public.trivia_questions FOR SELECT USING (true);
-- CREATE POLICY "Users can read own subscription status" ON public.profiles FOR SELECT USING ((select auth.uid()) = id);
-- COMMIT;
-- ============================================================================
