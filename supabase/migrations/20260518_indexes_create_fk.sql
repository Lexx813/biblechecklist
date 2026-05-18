-- ============================================================================
-- 20260518_indexes_create_fk.sql
--
-- Add missing foreign-key supporting indexes. The performance advisor
-- flagged 54 unindexed FKs. Without an index on the FK column, cascade
-- DELETEs do a sequential scan to find dependent rows.
--
-- IMPORTANT: CREATE INDEX CONCURRENTLY cannot run inside a transaction
-- block. Apply this file as individual statements (Supabase SQL Editor
-- runs each statement separately, which is the desired behaviour here).
-- DO NOT wrap in BEGIN/COMMIT.
--
-- Each statement is idempotent (`IF NOT EXISTS`). Concurrent creation lets
-- production traffic continue without long lock holds.
-- ============================================================================

-- profiles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;

-- notes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- blog
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_post_likes_post_id ON public.blog_post_likes(post_id);

-- content_reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_reports_reporter ON public.content_reports(reporter_id);

-- announcements
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_announcements_author ON public.announcements(author_id);

-- notifications — heavy join paths
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_actor ON public.notifications(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_conversation ON public.notifications(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_post ON public.notifications(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_thread ON public.notifications(thread_id) WHERE thread_id IS NOT NULL;

-- bookmarks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_post ON public.bookmarks(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_thread ON public.bookmarks(thread_id) WHERE thread_id IS NOT NULL;

-- messages / reactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);

-- study groups (legacy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_groups_creator ON public.study_groups(creator_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_group_members_user ON public.study_group_members(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_group_messages_group ON public.study_group_messages(group_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_group_messages_sender ON public.study_group_messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_group_messages_reply ON public.study_group_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_group_message_reactions_group_user ON public.study_group_message_reactions(group_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_group_message_reactions_user ON public.study_group_message_reactions(user_id);

-- groups v2
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_owner ON public.groups(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_posts_author ON public.group_posts(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_post_comments_author ON public.group_post_comments(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_events_creator ON public.group_events(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_event_rsvps_user ON public.group_event_rsvps(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_files_group ON public.group_files(group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_files_uploader ON public.group_files(uploaded_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_announcements_creator ON public.group_announcements(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_join_requests_user ON public.group_join_requests(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_challenges_creator ON public.group_challenges(created_by);

-- friendships / follows / blocks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_sponsored ON public.friendships(sponsored_by) WHERE sponsored_by IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- forum
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_thread_watches_thread ON public.forum_thread_watches(thread_id);

-- videos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_creator ON public.videos(creator_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_comments_video ON public.video_comments(video_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_comments_author ON public.video_comments(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_likes_video ON public.video_likes(video_id);

-- creators
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_creator_requests_reviewed_by ON public.creator_requests(reviewed_by);

-- post series
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_series_author ON public.post_series(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_series_items_post ON public.post_series_items(post_id);

-- email + campaigns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_creator ON public.email_campaigns(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_sends_user ON public.campaign_sends(user_id);

-- challenges + family
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenge_attempts_user ON public.challenge_attempts(user_id);

-- conversations / settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_settings_user ON public.conversation_settings(user_id);

-- admin audit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_id);

-- study notes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_notes_folder ON public.study_notes(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_note_likes_user ON public.study_note_likes(user_id);

-- reading plans
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_plan_completions_user ON public.reading_plan_completions(user_id);

-- trivia
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trivia_game_log_player ON public.trivia_game_log(player_id);

-- user posts / comments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_post_comments_parent ON public.user_post_comments(parent_id) WHERE parent_id IS NOT NULL;

-- user tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tags_creator ON public.user_tags(created_by);

-- AI
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_user ON public.ai_messages(user_id);

-- ============================================================================
-- ROLLBACK:
-- DROP INDEX CONCURRENTLY IF EXISTS public.<each_index_name>;
-- (run individually — DROP INDEX CONCURRENTLY also cannot be in a transaction)
-- ============================================================================
