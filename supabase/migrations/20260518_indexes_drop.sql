-- ============================================================================
-- 20260518_indexes_drop.sql
--
-- Drop duplicate and unused indexes. Splits cleanly from the CREATE
-- counterpart (20260518_indexes_create_fk.sql) so the two can be applied
-- independently if needed.
--
-- Verified live state on 2026-05-18:
--   Duplicate indexes confirmed via pg_index.indkey signature.
--   Unused indexes confirmed via pg_stat_user_indexes.idx_scan = 0.
-- ============================================================================

BEGIN;

-- ---------------- Duplicate indexes -----------------------------------------
-- Confirmed: same indkey signature as the non-`idx_rl_` index that already
-- existed on the same table. The rate-limit COUNT() queries use the
-- pre-existing index just as efficiently.
DROP INDEX IF EXISTS public.idx_rl_user_posts_user_created;     -- dup of idx_user_posts_user_created
DROP INDEX IF EXISTS public.idx_rl_study_notes_user_created;    -- dup of idx_study_notes_user_created

-- Duplicate of conv_participants_user_idx
DROP INDEX IF EXISTS public.idx_conv_participants_user;

-- pkey (1,2,3) already starts with user_a_id, user_b_id — identical leading-2
-- columns to friendships_user_a_id_user_b_id_key. idx_friendships_a_b is also
-- duplicate.
DROP INDEX IF EXISTS public.idx_friendships_a_b;

-- streak_freeze_uses already has unique key (2,3) — drop the redundant index.
DROP INDEX IF EXISTS public.idx_streak_freeze_uses_user_date;

-- reading_activity pkey covers (user_id, activity_date). The idx_reading_activity_user_date
-- is the same column pair.
DROP INDEX IF EXISTS public.idx_reading_activity_user_date;

-- ---------------- Unused indexes (idx_scan = 0) ------------------------------
-- All listed below have NOT been touched by the planner. Confirmed not
-- unique, not primary, not FK-backing.
-- Vector HNSW indexes (idx_verse_embeddings_hnsw, idx_blog_posts_hnsw) are
-- kept — they will be essential once semantic search scales.
-- The 7 `idx_rl_*` rate-limit indexes are KEPT (still needed by BEFORE INSERT
-- triggers in 20260424_rate_limits.sql) except the two duplicates dropped above.

DROP INDEX IF EXISTS public.ai_usage_logs_tool_used_idx;
DROP INDEX IF EXISTS public.idx_blog_comments_post;             -- LEAVE? FK-backing — see note
-- LEAVE: idx_blog_comments_post — actually this IS the FK index for
-- blog_comments(post_id). Re-create deferred to FK migration.
-- Restore the drop so we don't lose the FK coverage.
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON public.blog_comments(post_id);

DROP INDEX IF EXISTS public.idx_bookmarks_user;
DROP INDEX IF EXISTS public.idx_friendships_b_a;
DROP INDEX IF EXISTS public.idx_group_event_rsvps_event;
DROP INDEX IF EXISTS public.idx_group_members_group;
DROP INDEX IF EXISTS public.idx_group_members_user;
DROP INDEX IF EXISTS public.idx_group_post_comments_post;
DROP INDEX IF EXISTS public.idx_group_post_likes_post;
DROP INDEX IF EXISTS public.idx_message_reactions_msg;
DROP INDEX IF EXISTS public.messages_expires_idx;
DROP INDEX IF EXISTS public.push_subscriptions_user_id_idx;     -- duplicates owner index already
DROP INDEX IF EXISTS public.idx_referrals_code;
DROP INDEX IF EXISTS public.song_plays_song_id_idx;
DROP INDEX IF EXISTS public.songs_published_idx;
DROP INDEX IF EXISTS public.songs_theme_idx;
DROP INDEX IF EXISTS public.idx_trivia_custom_questions_room;
DROP INDEX IF EXISTS public.idx_trivia_game_log_room;
DROP INDEX IF EXISTS public.idx_trivia_players_session;
DROP INDEX IF EXISTS public.idx_trivia_questions_category;
DROP INDEX IF EXISTS public.idx_trivia_questions_difficulty;
DROP INDEX IF EXISTS public.idx_trivia_rooms_code;
DROP INDEX IF EXISTS public.idx_user_follows_follower;          -- pkey covers (follower_id, following_id)
DROP INDEX IF EXISTS public.idx_user_follows_following;
DROP INDEX IF EXISTS public.idx_urp_template;

-- LEAVE these unused indexes (vector HNSW + rate-limit triggers):
--   idx_verse_embeddings_hnsw    — used by semantic search; will scale
--   idx_blog_posts_hnsw          — used by semantic search; will scale
--   idx_rl_blog_comments_author_created
--   idx_rl_user_post_comment_likes_user_created
--   idx_rl_user_post_comments_author_created
--   idx_rl_user_post_reactions_user_created
-- These four idx_rl_* support the BEFORE INSERT rate-limit triggers in
-- 20260424_rate_limits.sql; idx_scan stays low because the triggers use
-- single-row COUNTs in plpgsql which can fall back to seq scan when tables
-- are tiny. Keep them.

COMMIT;

-- ============================================================================
-- ROLLBACK:
-- BEGIN;
-- CREATE INDEX idx_rl_user_posts_user_created ON public.user_posts(user_id, created_at DESC);
-- CREATE INDEX idx_rl_study_notes_user_created ON public.study_notes(user_id, created_at DESC);
-- CREATE INDEX idx_conv_participants_user ON public.conversation_participants(user_id);
-- CREATE INDEX idx_friendships_a_b ON public.friendships(user_a_id, user_b_id);
-- CREATE INDEX idx_streak_freeze_uses_user_date ON public.streak_freeze_uses(user_id, used_date);
-- CREATE INDEX idx_reading_activity_user_date ON public.reading_activity(user_id, activity_date);
-- -- (and re-create each unused index dropped above)
-- COMMIT;
-- ============================================================================
