-- Add missing indexes on all high-traffic foreign key and filter columns
-- These tables had zero indexes, causing full table scans on every query.

-- user_follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower    ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following   ON public.user_follows(following_id);

-- group_members
CREATE INDEX IF NOT EXISTS idx_group_members_group      ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user       ON public.group_members(user_id);

-- group_posts
CREATE INDEX IF NOT EXISTS idx_group_posts_group        ON public.group_posts(group_id);

-- group_post_likes
CREATE INDEX IF NOT EXISTS idx_group_post_likes_post    ON public.group_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_likes_user    ON public.group_post_likes(user_id);

-- group_post_comments
CREATE INDEX IF NOT EXISTS idx_group_post_comments_post ON public.group_post_comments(post_id);

-- group_events / RSVPs
CREATE INDEX IF NOT EXISTS idx_group_events_group       ON public.group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_event_rsvps_event  ON public.group_event_rsvps(event_id);

-- messages / reactions
CREATE INDEX IF NOT EXISTS idx_messages_conversation    ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_msg    ON public.message_reactions(message_id);

-- conversation_participants
CREATE INDEX IF NOT EXISTS idx_conv_participants_user   ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv   ON public.conversation_participants(conversation_id);

-- forum
CREATE INDEX IF NOT EXISTS idx_forum_threads_category   ON public.forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread     ON public.forum_replies(thread_id);

-- blog
CREATE INDEX IF NOT EXISTS idx_blog_comments_post       ON public.blog_comments(post_id);

-- user_posts
CREATE INDEX IF NOT EXISTS idx_user_posts_user          ON public.user_posts(user_id);

-- chapter_reads
CREATE INDEX IF NOT EXISTS idx_chapter_reads_user       ON public.chapter_reads(user_id);

-- bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user           ON public.bookmarks(user_id);
