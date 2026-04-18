-- Expand notifications type constraint to include all used types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('reply', 'comment', 'mention', 'message', 'like', 'friend_request', 'meeting_prep_reminder', 'trivia_invite'));

-- ── forum_replies INSERT → notify thread author ───────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_forum_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_thread_author uuid;
  v_category_id   uuid;
BEGIN
  SELECT author_id, category_id
    INTO v_thread_author, v_category_id
    FROM public.forum_threads
   WHERE id = NEW.thread_id;

  PERFORM public.create_notification(
    v_thread_author,
    NEW.author_id,
    'reply',
    NEW.thread_id,
    NULL,
    left(NEW.content, 120),
    'forum/' || v_category_id || '/' || NEW.thread_id
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_forum_reply ON public.forum_replies;
CREATE TRIGGER trg_notify_forum_reply
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_forum_reply();

-- ── blog_comments INSERT → notify post author ────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_blog_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author uuid;
  v_post_slug   text;
BEGIN
  SELECT author_id, slug
    INTO v_post_author, v_post_slug
    FROM public.blog_posts
   WHERE id = NEW.post_id;

  PERFORM public.create_notification(
    v_post_author,
    NEW.author_id,
    'comment',
    NULL,
    NEW.post_id,
    left(NEW.content, 120),
    'blog/' || v_post_slug
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_blog_comment ON public.blog_comments;
CREATE TRIGGER trg_notify_blog_comment
  AFTER INSERT ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_blog_comment();

-- ── forum_likes INSERT → notify thread/reply author ──────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_forum_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner       uuid;
  v_thread_id   uuid;
  v_category_id uuid;
BEGIN
  IF NEW.target_type = 'thread' THEN
    SELECT author_id, id, category_id
      INTO v_owner, v_thread_id, v_category_id
      FROM public.forum_threads
     WHERE id = NEW.target_id;

    PERFORM public.create_notification(
      v_owner, NEW.user_id, 'like',
      v_thread_id, NULL, NULL,
      'forum/' || v_category_id || '/' || v_thread_id
    );

  ELSIF NEW.target_type = 'reply' THEN
    SELECT r.author_id, r.thread_id, t.category_id
      INTO v_owner, v_thread_id, v_category_id
      FROM public.forum_replies r
      JOIN public.forum_threads  t ON t.id = r.thread_id
     WHERE r.id = NEW.target_id;

    PERFORM public.create_notification(
      v_owner, NEW.user_id, 'like',
      v_thread_id, NULL, NULL,
      'forum/' || v_category_id || '/' || v_thread_id
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_forum_like ON public.forum_likes;
CREATE TRIGGER trg_notify_forum_like
  AFTER INSERT ON public.forum_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_forum_like();

-- ── blog_post_likes INSERT → notify post author ──────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_blog_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author uuid;
  v_post_slug   text;
BEGIN
  SELECT author_id, slug
    INTO v_post_author, v_post_slug
    FROM public.blog_posts
   WHERE id = NEW.post_id;

  PERFORM public.create_notification(
    v_post_author, NEW.user_id, 'like',
    NULL, NEW.post_id, NULL,
    'blog/' || v_post_slug
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_blog_like ON public.blog_post_likes;
CREATE TRIGGER trg_notify_blog_like
  AFTER INSERT ON public.blog_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_blog_like();
