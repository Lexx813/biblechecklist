-- ============================================================================
-- 20260518_rls_auth_uid_wrap.sql
--
-- Wrap every direct `auth.uid()` reference inside RLS policies in
-- `(select auth.uid())` so Postgres caches the value per-query (InitPlan)
-- instead of re-evaluating it per row.
--
-- The Supabase performance advisor flagged 183+ policies. This migration
-- regenerates each affected policy with the wrapped form. The behaviour
-- is functionally identical — `(select auth.uid())` returns the same value,
-- it just stops the function from running once per row scanned.
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
--
-- Safe to apply as a single transaction. If anything fails the entire
-- script rolls back and the previous policies remain in place.
-- ============================================================================

BEGIN;

-- ------------------------------ ai_conversations ----------------------------
DROP POLICY IF EXISTS ai_conversations_owner_delete ON public.ai_conversations;
CREATE POLICY ai_conversations_owner_delete ON public.ai_conversations FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS ai_conversations_owner_insert ON public.ai_conversations;
CREATE POLICY ai_conversations_owner_insert ON public.ai_conversations FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS ai_conversations_owner_select ON public.ai_conversations;
CREATE POLICY ai_conversations_owner_select ON public.ai_conversations FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS ai_conversations_owner_update ON public.ai_conversations;
CREATE POLICY ai_conversations_owner_update ON public.ai_conversations FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ ai_messages ---------------------------------
DROP POLICY IF EXISTS ai_messages_owner_delete ON public.ai_messages;
CREATE POLICY ai_messages_owner_delete ON public.ai_messages FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS ai_messages_owner_insert ON public.ai_messages;
CREATE POLICY ai_messages_owner_insert ON public.ai_messages FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS ai_messages_owner_select ON public.ai_messages;
CREATE POLICY ai_messages_owner_select ON public.ai_messages FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ------------------------------ admin_actions -------------------------------
DROP POLICY IF EXISTS "admins can read admin_actions" ON public.admin_actions;
CREATE POLICY "admins can read admin_actions" ON public.admin_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- ------------------------------ admin_audit_log -----------------------------
DROP POLICY IF EXISTS audit_log_admin_read ON public.admin_audit_log;
CREATE POLICY audit_log_admin_read ON public.admin_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND (profiles.is_admin OR profiles.is_moderator)));

-- ------------------------------ announcements -------------------------------
DROP POLICY IF EXISTS admins_manage_announcements ON public.announcements;
CREATE POLICY admins_manage_announcements ON public.announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- ------------------------------ blog_comments -------------------------------
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.blog_comments;
CREATE POLICY "Admins can delete any comment" ON public.blog_comments FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

DROP POLICY IF EXISTS "Authors can delete own comments" ON public.blog_comments;
CREATE POLICY "Authors can delete own comments" ON public.blog_comments FOR DELETE
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can create own comments" ON public.blog_comments;
CREATE POLICY "Users can create own comments" ON public.blog_comments FOR INSERT
  WITH CHECK ((select auth.uid()) = author_id);

-- ------------------------------ blog_post_likes -----------------------------
DROP POLICY IF EXISTS "Users can manage own blog likes" ON public.blog_post_likes;
CREATE POLICY "Users can manage own blog likes" ON public.blog_post_likes FOR ALL
  USING ((select auth.uid()) = user_id);

-- ------------------------------ blog_posts ----------------------------------
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.blog_posts;
CREATE POLICY "Authenticated users can create posts" ON public.blog_posts FOR INSERT
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can delete own posts" ON public.blog_posts;
CREATE POLICY "Authors can delete own posts" ON public.blog_posts FOR DELETE
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can read own posts" ON public.blog_posts;
CREATE POLICY "Authors can read own posts" ON public.blog_posts FOR SELECT
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update own posts" ON public.blog_posts;
CREATE POLICY "Authors can update own posts" ON public.blog_posts FOR UPDATE
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS block_banned_users_blogs ON public.blog_posts;
CREATE POLICY block_banned_users_blogs ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (NOT (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_banned = true)));

-- ------------------------------ bookmarks -----------------------------------
DROP POLICY IF EXISTS users_own_bookmarks ON public.bookmarks;
CREATE POLICY users_own_bookmarks ON public.bookmarks FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ campaign_sends ------------------------------
DROP POLICY IF EXISTS sends_admin_read ON public.campaign_sends;
CREATE POLICY sends_admin_read ON public.campaign_sends FOR SELECT
  USING ((SELECT profiles.is_admin FROM profiles WHERE profiles.id = (select auth.uid())));

-- ------------------------------ challenge_attempts --------------------------
DROP POLICY IF EXISTS attempts_insert ON public.challenge_attempts;
CREATE POLICY attempts_insert ON public.challenge_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ------------------------------ chapter_reads -------------------------------
DROP POLICY IF EXISTS "Users manage their own chapter reads" ON public.chapter_reads;
CREATE POLICY "Users manage their own chapter reads" ON public.chapter_reads FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ content_reports -----------------------------
DROP POLICY IF EXISTS admins_delete_reports ON public.content_reports;
CREATE POLICY admins_delete_reports ON public.content_reports FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

DROP POLICY IF EXISTS admins_see_all_reports ON public.content_reports;
CREATE POLICY admins_see_all_reports ON public.content_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

DROP POLICY IF EXISTS admins_update_reports ON public.content_reports;
CREATE POLICY admins_update_reports ON public.content_reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

DROP POLICY IF EXISTS users_can_report ON public.content_reports;
CREATE POLICY users_can_report ON public.content_reports FOR INSERT
  WITH CHECK ((select auth.uid()) = reporter_id);

DROP POLICY IF EXISTS users_see_own_reports ON public.content_reports;
CREATE POLICY users_see_own_reports ON public.content_reports FOR SELECT
  USING ((select auth.uid()) = reporter_id);

-- ------------------------------ conversation_participants -------------------
DROP POLICY IF EXISTS "authenticated can insert participants" ON public.conversation_participants;
CREATE POLICY "authenticated can insert participants" ON public.conversation_participants FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "users can update their own participation" ON public.conversation_participants;
CREATE POLICY "users can update their own participation" ON public.conversation_participants FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ------------------------------ conversation_settings -----------------------
DROP POLICY IF EXISTS "users manage their own conv settings" ON public.conversation_settings;
CREATE POLICY "users manage their own conv settings" ON public.conversation_settings FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ------------------------------ conversations -------------------------------
DROP POLICY IF EXISTS "authenticated can create conversations" ON public.conversations;
CREATE POLICY "authenticated can create conversations" ON public.conversations FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "participants can delete conversations" ON public.conversations;
CREATE POLICY "participants can delete conversations" ON public.conversations FOR DELETE
  USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_participants.conversation_id = conversations.id AND conversation_participants.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "participants can view conversations" ON public.conversations;
CREATE POLICY "participants can view conversations" ON public.conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_participants.conversation_id = conversations.id AND conversation_participants.user_id = (select auth.uid())));

-- ------------------------------ creator_requests ----------------------------
DROP POLICY IF EXISTS "admins can manage all requests" ON public.creator_requests;
CREATE POLICY "admins can manage all requests" ON public.creator_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

DROP POLICY IF EXISTS "members can insert own request" ON public.creator_requests;
CREATE POLICY "members can insert own request" ON public.creator_requests FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "members can view own request" ON public.creator_requests;
CREATE POLICY "members can view own request" ON public.creator_requests FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ------------------------------ daily_verses --------------------------------
DROP POLICY IF EXISTS daily_verses_select ON public.daily_verses;
CREATE POLICY daily_verses_select ON public.daily_verses FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- ------------------------------ email_campaigns -----------------------------
DROP POLICY IF EXISTS campaigns_admin_all ON public.email_campaigns;
CREATE POLICY campaigns_admin_all ON public.email_campaigns FOR ALL
  USING ((SELECT profiles.is_admin FROM profiles WHERE profiles.id = (select auth.uid())));

-- ------------------------------ family_challenges ---------------------------
DROP POLICY IF EXISTS challenges_delete ON public.family_challenges;
CREATE POLICY challenges_delete ON public.family_challenges FOR DELETE TO authenticated
  USING (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS challenges_insert ON public.family_challenges;
CREATE POLICY challenges_insert ON public.family_challenges FOR INSERT TO authenticated
  WITH CHECK (creator_id = (select auth.uid()));

-- ------------------------------ feed_reactions ------------------------------
DROP POLICY IF EXISTS feed_reactions_delete_own ON public.feed_reactions;
CREATE POLICY feed_reactions_delete_own ON public.feed_reactions FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS feed_reactions_insert_own ON public.feed_reactions;
CREATE POLICY feed_reactions_insert_own ON public.feed_reactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ forum_category_translations -----------------
DROP POLICY IF EXISTS "Admin manage translations" ON public.forum_category_translations;
CREATE POLICY "Admin manage translations" ON public.forum_category_translations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- ------------------------------ forum_likes ---------------------------------
DROP POLICY IF EXISTS "Users can manage own forum likes" ON public.forum_likes;
CREATE POLICY "Users can manage own forum likes" ON public.forum_likes FOR ALL
  USING ((select auth.uid()) = user_id);

-- ------------------------------ forum_reactions -----------------------------
DROP POLICY IF EXISTS reactions_own ON public.forum_reactions;
CREATE POLICY reactions_own ON public.forum_reactions FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ forum_replies -------------------------------
-- See `20260518_redundant_permissive_policies.sql` for the consolidation of
-- the two INSERT policies into a single one. Here we only re-wrap the
-- DELETE/UPDATE/banned policies.
DROP POLICY IF EXISTS "Authors can delete own replies" ON public.forum_replies;
CREATE POLICY "Authors can delete own replies" ON public.forum_replies FOR DELETE
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update own replies" ON public.forum_replies;
CREATE POLICY "Authors can update own replies" ON public.forum_replies FOR UPDATE
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS block_banned_users_replies ON public.forum_replies;
CREATE POLICY block_banned_users_replies ON public.forum_replies FOR INSERT TO authenticated
  WITH CHECK (NOT (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_banned = true)));

DROP POLICY IF EXISTS "Auth users can create replies" ON public.forum_replies;
CREATE POLICY "Auth users can create replies" ON public.forum_replies FOR INSERT
  WITH CHECK (
    ((select auth.uid()) = author_id)
    AND (is_admin() OR (NOT (thread_id IN (
      SELECT t.id FROM forum_threads t
      JOIN forum_categories c ON c.id = t.category_id
      WHERE c.name = ANY (ARRAY['Forum Rules'::text, 'FAQs'::text])
    ))))
  );

DROP POLICY IF EXISTS "Auth users can reply to unlocked threads" ON public.forum_replies;
CREATE POLICY "Auth users can reply to unlocked threads" ON public.forum_replies FOR INSERT
  WITH CHECK (
    ((select auth.uid()) = author_id)
    AND NOT EXISTS (SELECT 1 FROM forum_threads WHERE forum_threads.id = forum_replies.thread_id AND forum_threads.locked = true)
  );

-- ------------------------------ forum_thread_watches ------------------------
DROP POLICY IF EXISTS watches_own ON public.forum_thread_watches;
CREATE POLICY watches_own ON public.forum_thread_watches FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ forum_threads -------------------------------
DROP POLICY IF EXISTS "Auth users can create threads" ON public.forum_threads;
CREATE POLICY "Auth users can create threads" ON public.forum_threads FOR INSERT
  WITH CHECK (
    ((select auth.uid()) = author_id)
    AND (is_admin() OR (NOT (category_id IN (
      SELECT forum_categories.id FROM forum_categories
      WHERE forum_categories.name = ANY (ARRAY['Forum Rules'::text, 'FAQs'::text])
    ))))
  );

DROP POLICY IF EXISTS "Authors can delete own threads" ON public.forum_threads;
CREATE POLICY "Authors can delete own threads" ON public.forum_threads FOR DELETE
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update own threads" ON public.forum_threads;
CREATE POLICY "Authors can update own threads" ON public.forum_threads FOR UPDATE
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS block_banned_users_threads ON public.forum_threads;
CREATE POLICY block_banned_users_threads ON public.forum_threads FOR INSERT TO authenticated
  WITH CHECK (NOT (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_banned = true)));

-- ------------------------------ friend_requests -----------------------------
DROP POLICY IF EXISTS "recipients can update status" ON public.friend_requests;
CREATE POLICY "recipients can update status" ON public.friend_requests FOR UPDATE
  USING ((select auth.uid()) = to_user_id)
  WITH CHECK ((select auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "sender can delete pending request" ON public.friend_requests;
CREATE POLICY "sender can delete pending request" ON public.friend_requests FOR DELETE
  USING (((select auth.uid()) = from_user_id) AND (status = 'pending'::text));

DROP POLICY IF EXISTS "users can read their own requests" ON public.friend_requests;
CREATE POLICY "users can read their own requests" ON public.friend_requests FOR SELECT
  USING (((select auth.uid()) = from_user_id) OR ((select auth.uid()) = to_user_id));

DROP POLICY IF EXISTS "users can send requests" ON public.friend_requests;
CREATE POLICY "users can send requests" ON public.friend_requests FOR INSERT
  WITH CHECK ((select auth.uid()) = from_user_id);

-- ------------------------------ friendships ---------------------------------
DROP POLICY IF EXISTS "system insert only" ON public.friendships;
CREATE POLICY "system insert only" ON public.friendships FOR INSERT
  WITH CHECK (((select auth.uid()) = user_a_id) OR ((select auth.uid()) = user_b_id));

DROP POLICY IF EXISTS "users can read their own friendships" ON public.friendships;
CREATE POLICY "users can read their own friendships" ON public.friendships FOR SELECT
  USING (((select auth.uid()) = user_a_id) OR ((select auth.uid()) = user_b_id));

-- ------------------------------ group_announcements -------------------------
DROP POLICY IF EXISTS admins_can_delete_announcements ON public.group_announcements;
CREATE POLICY admins_can_delete_announcements ON public.group_announcements FOR DELETE
  USING (EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = group_announcements.group_id AND study_group_members.user_id = (select auth.uid()) AND study_group_members.role = 'admin'::text));

DROP POLICY IF EXISTS admins_can_insert_announcements ON public.group_announcements;
CREATE POLICY admins_can_insert_announcements ON public.group_announcements FOR INSERT
  WITH CHECK (((select auth.uid()) = created_by) AND EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = group_announcements.group_id AND study_group_members.user_id = (select auth.uid()) AND study_group_members.role = 'admin'::text));

DROP POLICY IF EXISTS members_can_read_announcements ON public.group_announcements;
CREATE POLICY members_can_read_announcements ON public.group_announcements FOR SELECT
  USING (EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = group_announcements.group_id AND study_group_members.user_id = (select auth.uid())));

-- ------------------------------ group_challenges ----------------------------
DROP POLICY IF EXISTS "Group admins insert challenges" ON public.group_challenges;
CREATE POLICY "Group admins insert challenges" ON public.group_challenges FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = group_challenges.group_id AND study_group_members.user_id = (select auth.uid()) AND study_group_members.role = 'admin'::text));

DROP POLICY IF EXISTS "Group admins update challenges" ON public.group_challenges;
CREATE POLICY "Group admins update challenges" ON public.group_challenges FOR UPDATE
  USING (EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = group_challenges.group_id AND study_group_members.user_id = (select auth.uid()) AND study_group_members.role = 'admin'::text));

DROP POLICY IF EXISTS "Group members read challenges" ON public.group_challenges;
CREATE POLICY "Group members read challenges" ON public.group_challenges FOR SELECT
  USING (EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = group_challenges.group_id AND study_group_members.user_id = (select auth.uid())));

-- ------------------------------ group_event_rsvps ---------------------------
DROP POLICY IF EXISTS ger_delete ON public.group_event_rsvps;
CREATE POLICY ger_delete ON public.group_event_rsvps FOR DELETE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS ger_insert ON public.group_event_rsvps;
CREATE POLICY ger_insert ON public.group_event_rsvps FOR INSERT
  WITH CHECK (((select auth.uid()) = user_id) AND EXISTS (SELECT 1 FROM group_events WHERE group_events.id = group_event_rsvps.event_id AND is_group_member(group_events.group_id)));

DROP POLICY IF EXISTS ger_update ON public.group_event_rsvps;
CREATE POLICY ger_update ON public.group_event_rsvps FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ------------------------------ group_events --------------------------------
DROP POLICY IF EXISTS ge_insert ON public.group_events;
CREATE POLICY ge_insert ON public.group_events FOR INSERT
  WITH CHECK (((select auth.uid()) = created_by) AND is_group_admin(group_id));

-- ------------------------------ group_files ---------------------------------
DROP POLICY IF EXISTS gf_delete ON public.group_files;
CREATE POLICY gf_delete ON public.group_files FOR DELETE
  USING ((uploaded_by = (select auth.uid())) OR is_group_admin(group_id));

DROP POLICY IF EXISTS gf_insert ON public.group_files;
CREATE POLICY gf_insert ON public.group_files FOR INSERT
  WITH CHECK (((select auth.uid()) = uploaded_by) AND is_group_member(group_id));

-- ------------------------------ group_join_requests -------------------------
DROP POLICY IF EXISTS admins_can_update_requests ON public.group_join_requests;
CREATE POLICY admins_can_update_requests ON public.group_join_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = group_join_requests.group_id AND study_group_members.user_id = (select auth.uid()) AND study_group_members.role = 'admin'::text));

DROP POLICY IF EXISTS users_can_delete_own_requests ON public.group_join_requests;
CREATE POLICY users_can_delete_own_requests ON public.group_join_requests FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS users_can_request_join ON public.group_join_requests;
CREATE POLICY users_can_request_join ON public.group_join_requests FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS users_see_own_requests ON public.group_join_requests;
CREATE POLICY users_see_own_requests ON public.group_join_requests FOR SELECT
  USING (((select auth.uid()) = user_id) OR EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = group_join_requests.group_id AND study_group_members.user_id = (select auth.uid()) AND study_group_members.role = 'admin'::text));

-- ------------------------------ group_members -------------------------------
DROP POLICY IF EXISTS gm_delete ON public.group_members;
CREATE POLICY gm_delete ON public.group_members FOR DELETE
  USING ((user_id = (select auth.uid())) OR is_group_admin(group_id));

DROP POLICY IF EXISTS gm_insert ON public.group_members;
CREATE POLICY gm_insert ON public.group_members FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS gm_select ON public.group_members;
CREATE POLICY gm_select ON public.group_members FOR SELECT
  USING ((user_id = (select auth.uid())) OR is_group_member(group_id) OR EXISTS (SELECT 1 FROM groups WHERE groups.id = group_members.group_id AND groups.privacy = 'public'::text));

-- ------------------------------ group_post_comments -------------------------
DROP POLICY IF EXISTS gpc_delete ON public.group_post_comments;
CREATE POLICY gpc_delete ON public.group_post_comments FOR DELETE
  USING ((author_id = (select auth.uid())) OR EXISTS (SELECT 1 FROM group_posts gp WHERE gp.id = group_post_comments.post_id AND is_group_admin(gp.group_id)));

DROP POLICY IF EXISTS gpc_insert ON public.group_post_comments;
CREATE POLICY gpc_insert ON public.group_post_comments FOR INSERT
  WITH CHECK (((select auth.uid()) = author_id) AND EXISTS (SELECT 1 FROM group_posts WHERE group_posts.id = group_post_comments.post_id AND is_group_member(group_posts.group_id)));

-- ------------------------------ group_post_likes ----------------------------
DROP POLICY IF EXISTS gpl_delete ON public.group_post_likes;
CREATE POLICY gpl_delete ON public.group_post_likes FOR DELETE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS gpl_insert ON public.group_post_likes;
CREATE POLICY gpl_insert ON public.group_post_likes FOR INSERT
  WITH CHECK (((select auth.uid()) = user_id) AND EXISTS (SELECT 1 FROM group_posts WHERE group_posts.id = group_post_likes.post_id AND is_group_member(group_posts.group_id)));

-- ------------------------------ group_posts ---------------------------------
DROP POLICY IF EXISTS gp_delete ON public.group_posts;
CREATE POLICY gp_delete ON public.group_posts FOR DELETE
  USING ((author_id = (select auth.uid())) OR is_group_admin(group_id));

DROP POLICY IF EXISTS gp_insert ON public.group_posts;
CREATE POLICY gp_insert ON public.group_posts FOR INSERT
  WITH CHECK (((select auth.uid()) = author_id) AND is_group_member(group_id) AND ((NOT is_announcement) OR is_group_admin(group_id)));

-- ------------------------------ groups --------------------------------------
DROP POLICY IF EXISTS groups_delete ON public.groups;
CREATE POLICY groups_delete ON public.groups FOR DELETE
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS groups_insert ON public.groups;
CREATE POLICY groups_insert ON public.groups FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS groups_select ON public.groups;
CREATE POLICY groups_select ON public.groups FOR SELECT
  USING ((privacy = 'public'::text) OR (owner_id = (select auth.uid())) OR is_group_member(id));

-- ------------------------------ invite_tokens -------------------------------
DROP POLICY IF EXISTS "users can insert their own token" ON public.invite_tokens;
CREATE POLICY "users can insert their own token" ON public.invite_tokens FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ learn_lesson_progress -----------------------
DROP POLICY IF EXISTS "admins select all learn progress" ON public.learn_lesson_progress;
CREATE POLICY "admins select all learn progress" ON public.learn_lesson_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = (select auth.uid()) AND p.is_admin));

DROP POLICY IF EXISTS "users delete own learn progress" ON public.learn_lesson_progress;
CREATE POLICY "users delete own learn progress" ON public.learn_lesson_progress FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users insert own learn progress" ON public.learn_lesson_progress;
CREATE POLICY "users insert own learn progress" ON public.learn_lesson_progress FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users select own learn progress" ON public.learn_lesson_progress;
CREATE POLICY "users select own learn progress" ON public.learn_lesson_progress FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users update own learn progress" ON public.learn_lesson_progress;
CREATE POLICY "users update own learn progress" ON public.learn_lesson_progress FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ------------------------------ message_link_previews -----------------------
DROP POLICY IF EXISTS "participants can view link previews" ON public.message_link_previews;
CREATE POLICY "participants can view link previews" ON public.message_link_previews FOR SELECT
  USING (EXISTS (SELECT 1 FROM messages m JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id WHERE m.id = message_link_previews.message_id AND cp.user_id = (select auth.uid())));

-- ------------------------------ message_reactions ---------------------------
DROP POLICY IF EXISTS "users can add own reactions" ON public.message_reactions;
CREATE POLICY "users can add own reactions" ON public.message_reactions FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users can delete own reactions" ON public.message_reactions;
CREATE POLICY "users can delete own reactions" ON public.message_reactions FOR DELETE
  USING (user_id = (select auth.uid()));

-- ------------------------------ messages ------------------------------------
DROP POLICY IF EXISTS "participants can send messages" ON public.messages;
CREATE POLICY "participants can send messages" ON public.messages FOR INSERT
  WITH CHECK ((sender_id = (select auth.uid())) AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_participants.conversation_id = messages.conversation_id AND conversation_participants.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "participants can view messages" ON public.messages;
CREATE POLICY "participants can view messages" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_participants.conversation_id = messages.conversation_id AND conversation_participants.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "sender can soft-delete their messages" ON public.messages;
CREATE POLICY "sender can soft-delete their messages" ON public.messages FOR UPDATE
  USING (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "users can edit own messages" ON public.messages;
CREATE POLICY "users can edit own messages" ON public.messages FOR UPDATE
  USING (sender_id = (select auth.uid()));

-- ------------------------------ note_folders --------------------------------
DROP POLICY IF EXISTS users_manage_own_folders ON public.note_folders;
CREATE POLICY users_manage_own_folders ON public.note_folders FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ notes ---------------------------------------
DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ notifications ------------------------------
DROP POLICY IF EXISTS users_delete_own_notifs ON public.notifications;
CREATE POLICY users_delete_own_notifs ON public.notifications FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS users_see_own_notifs ON public.notifications;
CREATE POLICY users_see_own_notifs ON public.notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS users_update_own_notifs ON public.notifications;
CREATE POLICY users_update_own_notifs ON public.notifications FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ------------------------------ post_series ---------------------------------
DROP POLICY IF EXISTS series_author_update ON public.post_series;
CREATE POLICY series_author_update ON public.post_series FOR UPDATE
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS series_author_write ON public.post_series;
CREATE POLICY series_author_write ON public.post_series FOR INSERT
  WITH CHECK ((select auth.uid()) = author_id);

-- ------------------------------ post_series_items ---------------------------
DROP POLICY IF EXISTS series_items_author_write ON public.post_series_items;
CREATE POLICY series_items_author_write ON public.post_series_items FOR INSERT
  WITH CHECK ((select auth.uid()) = (SELECT post_series.author_id FROM post_series WHERE post_series.id = post_series_items.series_id));

-- ------------------------------ profanity_wordlist --------------------------
DROP POLICY IF EXISTS admins_manage_profanity_wordlist ON public.profanity_wordlist;
CREATE POLICY admins_manage_profanity_wordlist ON public.profanity_wordlist FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- ------------------------------ profiles ------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can read own subscription status" ON public.profiles;
CREATE POLICY "Users can read own subscription status" ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ------------------------------ push_subscriptions --------------------------
DROP POLICY IF EXISTS "Users manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage their own push subscriptions" ON public.push_subscriptions FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS push_subscriptions_delete_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_delete_own ON public.push_subscriptions FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS push_subscriptions_insert_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_insert_own ON public.push_subscriptions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS push_subscriptions_select_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_select_own ON public.push_subscriptions FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users manage own subscriptions" ON public.push_subscriptions;
CREATE POLICY "users manage own subscriptions" ON public.push_subscriptions FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS users_manage_own_push_subs ON public.push_subscriptions;
CREATE POLICY users_manage_own_push_subs ON public.push_subscriptions FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ quiz_question_translations ------------------
DROP POLICY IF EXISTS "Admin manage quiz translations" ON public.quiz_question_translations;
CREATE POLICY "Admin manage quiz translations" ON public.quiz_question_translations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- ------------------------------ quiz_questions ------------------------------
DROP POLICY IF EXISTS admins_manage_quiz_questions ON public.quiz_questions;
CREATE POLICY admins_manage_quiz_questions ON public.quiz_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- ------------------------------ quiz_timed_scores ---------------------------
DROP POLICY IF EXISTS "Users insert own timed scores" ON public.quiz_timed_scores;
CREATE POLICY "Users insert own timed scores" ON public.quiz_timed_scores FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ reading_activity ----------------------------
DROP POLICY IF EXISTS "Users can manage their own activity" ON public.reading_activity;
CREATE POLICY "Users can manage their own activity" ON public.reading_activity FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ reading_log ---------------------------------
DROP POLICY IF EXISTS reading_log_insert ON public.reading_log;
CREATE POLICY reading_log_insert ON public.reading_log FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS reading_log_select ON public.reading_log;
CREATE POLICY reading_log_select ON public.reading_log FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS reading_log_update ON public.reading_log;
CREATE POLICY reading_log_update ON public.reading_log FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ------------------------------ reading_plan_completions --------------------
DROP POLICY IF EXISTS "Users manage own completions" ON public.reading_plan_completions;
CREATE POLICY "Users manage own completions" ON public.reading_plan_completions FOR ALL
  USING ((select auth.uid()) = user_id);

-- ------------------------------ reading_progress ----------------------------
DROP POLICY IF EXISTS "User progress" ON public.reading_progress;
CREATE POLICY "User progress" ON public.reading_progress FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ referrals -----------------------------------
DROP POLICY IF EXISTS referrals_select_own ON public.referrals;
CREATE POLICY referrals_select_own ON public.referrals FOR SELECT
  USING ((referrer_id = (select auth.uid())) OR (referred_id = (select auth.uid())));

-- ------------------------------ song_plays ----------------------------------
DROP POLICY IF EXISTS song_plays_admin_read ON public.song_plays;
CREATE POLICY song_plays_admin_read ON public.song_plays FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- ------------------------------ streak_freeze_uses --------------------------
DROP POLICY IF EXISTS "Users manage own freeze uses" ON public.streak_freeze_uses;
CREATE POLICY "Users manage own freeze uses" ON public.streak_freeze_uses FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ study_group_members -------------------------
DROP POLICY IF EXISTS sgm_insert ON public.study_group_members;
CREATE POLICY sgm_insert ON public.study_group_members FOR INSERT
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND (user_id = (select auth.uid())));

-- ------------------------------ study_group_message_reactions ---------------
DROP POLICY IF EXISTS "Members can add reactions" ON public.study_group_message_reactions;
CREATE POLICY "Members can add reactions" ON public.study_group_message_reactions FOR INSERT
  WITH CHECK (((select auth.uid()) = user_id) AND EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = study_group_message_reactions.group_id AND study_group_members.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Members can view reactions" ON public.study_group_message_reactions;
CREATE POLICY "Members can view reactions" ON public.study_group_message_reactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM study_group_members WHERE study_group_members.group_id = study_group_message_reactions.group_id AND study_group_members.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can remove own reactions" ON public.study_group_message_reactions;
CREATE POLICY "Users can remove own reactions" ON public.study_group_message_reactions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ------------------------------ study_group_messages ------------------------
DROP POLICY IF EXISTS sgmsg_delete ON public.study_group_messages;
CREATE POLICY sgmsg_delete ON public.study_group_messages FOR DELETE
  USING ((sender_id = (select auth.uid())) OR EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = study_group_messages.group_id AND m.user_id = (select auth.uid()) AND m.role = 'admin'::text));

DROP POLICY IF EXISTS sgmsg_insert ON public.study_group_messages;
CREATE POLICY sgmsg_insert ON public.study_group_messages FOR INSERT
  WITH CHECK ((sender_id = (select auth.uid())) AND EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = study_group_messages.group_id AND m.user_id = (select auth.uid())));

DROP POLICY IF EXISTS sgmsg_select ON public.study_group_messages;
CREATE POLICY sgmsg_select ON public.study_group_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = study_group_messages.group_id AND m.user_id = (select auth.uid())));

DROP POLICY IF EXISTS sgmsg_update ON public.study_group_messages;
CREATE POLICY sgmsg_update ON public.study_group_messages FOR UPDATE
  USING ((sender_id = (select auth.uid())) OR EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = study_group_messages.group_id AND m.user_id = (select auth.uid()) AND m.role = 'admin'::text));

-- ------------------------------ study_groups --------------------------------
DROP POLICY IF EXISTS sg_delete ON public.study_groups;
CREATE POLICY sg_delete ON public.study_groups FOR DELETE
  USING (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS sg_insert ON public.study_groups;
CREATE POLICY sg_insert ON public.study_groups FOR INSERT
  WITH CHECK (((select auth.uid()) IS NOT NULL) AND (creator_id = (select auth.uid())));

DROP POLICY IF EXISTS sg_update ON public.study_groups;
CREATE POLICY sg_update ON public.study_groups FOR UPDATE
  USING ((creator_id = (select auth.uid())) OR EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = study_groups.id AND m.user_id = (select auth.uid()) AND m.role = 'admin'::text))
  WITH CHECK ((creator_id = (select auth.uid())) OR EXISTS (SELECT 1 FROM study_group_members m WHERE m.group_id = study_groups.id AND m.user_id = (select auth.uid()) AND m.role = 'admin'::text));

-- ------------------------------ study_note_likes ----------------------------
DROP POLICY IF EXISTS "Users can manage their own note likes" ON public.study_note_likes;
CREATE POLICY "Users can manage their own note likes" ON public.study_note_likes FOR ALL
  USING ((select auth.uid()) = user_id);

-- ------------------------------ study_notes ---------------------------------
DROP POLICY IF EXISTS "Users manage own study notes" ON public.study_notes;
CREATE POLICY "Users manage own study notes" ON public.study_notes FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ user_badges ---------------------------------
DROP POLICY IF EXISTS "Users insert own badges" ON public.user_badges;
CREATE POLICY "Users insert own badges" ON public.user_badges FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own badges" ON public.user_badges;
CREATE POLICY "Users read own badges" ON public.user_badges FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ------------------------------ user_blocks ---------------------------------
DROP POLICY IF EXISTS "Users can create own blocks" ON public.user_blocks;
CREATE POLICY "Users can create own blocks" ON public.user_blocks FOR INSERT
  WITH CHECK ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can delete own blocks" ON public.user_blocks;
CREATE POLICY "Users can delete own blocks" ON public.user_blocks FOR DELETE
  USING ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can view own blocks" ON public.user_blocks;
CREATE POLICY "Users can view own blocks" ON public.user_blocks FOR SELECT
  USING ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS blocks_delete_own ON public.user_blocks;
CREATE POLICY blocks_delete_own ON public.user_blocks FOR DELETE
  USING (blocker_id = (select auth.uid()));

DROP POLICY IF EXISTS blocks_insert_own ON public.user_blocks;
CREATE POLICY blocks_insert_own ON public.user_blocks FOR INSERT
  WITH CHECK (blocker_id = (select auth.uid()));

DROP POLICY IF EXISTS blocks_select_own ON public.user_blocks;
CREATE POLICY blocks_select_own ON public.user_blocks FOR SELECT
  USING ((blocker_id = (select auth.uid())) OR (blocked_id = (select auth.uid())));

-- ------------------------------ user_follows --------------------------------
DROP POLICY IF EXISTS follows_delete ON public.user_follows;
CREATE POLICY follows_delete ON public.user_follows FOR DELETE
  USING ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS follows_insert ON public.user_follows;
CREATE POLICY follows_insert ON public.user_follows FOR INSERT
  WITH CHECK ((select auth.uid()) = follower_id);

-- ------------------------------ user_keys -----------------------------------
DROP POLICY IF EXISTS "users can update own key" ON public.user_keys;
CREATE POLICY "users can update own key" ON public.user_keys FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users can upsert own key" ON public.user_keys;
CREATE POLICY "users can upsert own key" ON public.user_keys FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- ------------------------------ user_meeting_prep ---------------------------
DROP POLICY IF EXISTS prep_own ON public.user_meeting_prep;
CREATE POLICY prep_own ON public.user_meeting_prep FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ------------------------------ user_post_comment_likes ---------------------
DROP POLICY IF EXISTS comment_likes_delete ON public.user_post_comment_likes;
CREATE POLICY comment_likes_delete ON public.user_post_comment_likes FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS comment_likes_insert ON public.user_post_comment_likes;
CREATE POLICY comment_likes_insert ON public.user_post_comment_likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ user_post_comments --------------------------
DROP POLICY IF EXISTS "Authenticated users can add comments" ON public.user_post_comments;
CREATE POLICY "Authenticated users can add comments" ON public.user_post_comments FOR INSERT
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can delete own comments" ON public.user_post_comments;
CREATE POLICY "Authors can delete own comments" ON public.user_post_comments FOR DELETE
  USING ((select auth.uid()) = author_id);

-- ------------------------------ user_post_reactions -------------------------
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON public.user_post_reactions;
CREATE POLICY "Authenticated users can add reactions" ON public.user_post_reactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON public.user_post_reactions;
CREATE POLICY "Users can remove own reactions" ON public.user_post_reactions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ------------------------------ user_posts ----------------------------------
DROP POLICY IF EXISTS posts_delete ON public.user_posts;
CREATE POLICY posts_delete ON public.user_posts FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS posts_insert ON public.user_posts;
CREATE POLICY posts_insert ON public.user_posts FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS posts_select ON public.user_posts;
CREATE POLICY posts_select ON public.user_posts FOR SELECT
  USING (
    (visibility = 'public'::text)
    OR ((select auth.uid()) = user_id)
    OR ((visibility = 'friends'::text) AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE ((f.user_a_id = (select auth.uid())) AND (f.user_b_id = user_posts.user_id))
         OR ((f.user_b_id = (select auth.uid())) AND (f.user_a_id = user_posts.user_id))
    ))
  );

DROP POLICY IF EXISTS posts_update ON public.user_posts;
CREATE POLICY posts_update ON public.user_posts FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ user_quiz_progress --------------------------
DROP POLICY IF EXISTS user_quiz_progress_insert_own ON public.user_quiz_progress;
CREATE POLICY user_quiz_progress_insert_own ON public.user_quiz_progress FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS user_quiz_progress_select_own ON public.user_quiz_progress;
CREATE POLICY user_quiz_progress_select_own ON public.user_quiz_progress FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS user_quiz_progress_update_own ON public.user_quiz_progress;
CREATE POLICY user_quiz_progress_update_own ON public.user_quiz_progress FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------ user_reading_plans --------------------------
DROP POLICY IF EXISTS "Users manage own reading plans" ON public.user_reading_plans;
CREATE POLICY "Users manage own reading plans" ON public.user_reading_plans FOR ALL
  USING ((select auth.uid()) = user_id);

-- ------------------------------ user_tags -----------------------------------
DROP POLICY IF EXISTS tags_admin_all ON public.user_tags;
CREATE POLICY tags_admin_all ON public.user_tags FOR ALL
  USING ((SELECT profiles.is_admin FROM profiles WHERE profiles.id = (select auth.uid())));

-- ------------------------------ video_comments ------------------------------
DROP POLICY IF EXISTS "admins can delete any video comment" ON public.video_comments;
CREATE POLICY "admins can delete any video comment" ON public.video_comments FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

DROP POLICY IF EXISTS "authenticated can comment on video" ON public.video_comments;
CREATE POLICY "authenticated can comment on video" ON public.video_comments FOR INSERT
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "authors can delete own video comment" ON public.video_comments;
CREATE POLICY "authors can delete own video comment" ON public.video_comments FOR DELETE
  USING ((select auth.uid()) = author_id);

-- ------------------------------ video_likes ---------------------------------
DROP POLICY IF EXISTS "authenticated can like" ON public.video_likes;
CREATE POLICY "authenticated can like" ON public.video_likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users can unlike" ON public.video_likes;
CREATE POLICY "users can unlike" ON public.video_likes FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ------------------------------ videos --------------------------------------
DROP POLICY IF EXISTS "admins can manage all videos" ON public.videos;
CREATE POLICY "admins can manage all videos" ON public.videos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

DROP POLICY IF EXISTS "approved creators can insert" ON public.videos;
CREATE POLICY "approved creators can insert" ON public.videos FOR INSERT
  WITH CHECK (((select auth.uid()) = creator_id) AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_approved_creator = true));

DROP POLICY IF EXISTS "creators can update own videos" ON public.videos;
CREATE POLICY "creators can update own videos" ON public.videos FOR UPDATE
  USING ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "creators can view own videos" ON public.videos;
CREATE POLICY "creators can view own videos" ON public.videos FOR SELECT
  USING ((select auth.uid()) = creator_id);

COMMIT;

-- ============================================================================
-- ROLLBACK:
-- Restoring the previous policies means re-creating each with the un-wrapped
-- `auth.uid()` form. To revert, drop each policy above and re-create it
-- replacing `(select auth.uid())` with `auth.uid()`. There is no automated
-- rollback because the wrapped form is strictly an optimization with
-- identical semantics.
-- ============================================================================
