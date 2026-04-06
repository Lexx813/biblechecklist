-- ─────────────────────────────────────────────────────────────────────────────
-- Groups v2 — replaces study_groups / study_group_members / chat tables
-- Apply in Supabase SQL editor or via supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: check membership ──────────────────────────────────────────────────

DROP FUNCTION IF EXISTS is_group_member(uuid);
CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id  = auth.uid()
      AND status   = 'member'
  );
$$;

DROP FUNCTION IF EXISTS is_group_admin(uuid);
CREATE OR REPLACE FUNCTION is_group_admin(p_group_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id  = auth.uid()
      AND status   = 'member'
      AND role     IN ('owner', 'admin')
  );
$$;

-- ── Slug generator ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_group_slug(p_name text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(regexp_replace(regexp_replace(trim(p_name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
$$;

-- ── groups ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS groups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  slug         text        UNIQUE NOT NULL,
  description  text,
  cover_url    text,
  privacy      text        NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  owner_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  member_count int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Public groups visible to all; private visible to members or owner
CREATE POLICY "groups_select" ON groups FOR SELECT USING (
  privacy = 'public'
  OR owner_id = auth.uid()
  OR is_group_member(id)
);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (is_group_admin(id));
CREATE POLICY "groups_delete" ON groups FOR DELETE USING (owner_id = auth.uid());

-- ── group_members ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_members (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  uuid        NOT NULL REFERENCES groups ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role      text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status    text        NOT NULL DEFAULT 'member' CHECK (status IN ('pending', 'member')),
  joined_at timestamptz,
  UNIQUE (group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gm_select" ON group_members FOR SELECT USING (
  user_id = auth.uid()
  OR is_group_member(group_id)
  OR EXISTS (SELECT 1 FROM groups WHERE id = group_id AND privacy = 'public')
);
-- Users insert themselves (pending for private, member for public handled in app)
CREATE POLICY "gm_insert" ON group_members FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
-- Admins update others; users can update nothing (role/status changes are admin-only)
CREATE POLICY "gm_update" ON group_members FOR UPDATE USING (is_group_admin(group_id));
-- Owner/admin removes others; user removes themselves (leave)
CREATE POLICY "gm_delete" ON group_members FOR DELETE USING (
  user_id = auth.uid() OR is_group_admin(group_id)
);

-- ── member_count trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'member' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'member' THEN
    UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'member' AND NEW.status = 'member' THEN
      UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF OLD.status = 'member' AND NEW.status != 'member' THEN
      UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_group_member_count ON group_members;
CREATE TRIGGER trg_group_member_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- joined_at: set automatically when status becomes 'member'
CREATE OR REPLACE FUNCTION set_group_member_joined_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'member' AND (OLD IS NULL OR OLD.status != 'member') THEN
    NEW.joined_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_member_joined_at ON group_members;
CREATE TRIGGER trg_group_member_joined_at
  BEFORE INSERT OR UPDATE OF status ON group_members
  FOR EACH ROW EXECUTE FUNCTION set_group_member_joined_at();

-- ── group_posts ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_posts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid        NOT NULL REFERENCES groups ON DELETE CASCADE,
  author_id       uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content         text        NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  media_urls      text[]      NOT NULL DEFAULT '{}',
  is_announcement bool        NOT NULL DEFAULT false,
  like_count      int         NOT NULL DEFAULT 0,
  comment_count   int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gp_select" ON group_posts FOR SELECT USING (is_group_member(group_id));
-- Members can post; announcements require admin (enforced in app + DB check)
CREATE POLICY "gp_insert" ON group_posts FOR INSERT WITH CHECK (
  auth.uid() = author_id
  AND is_group_member(group_id)
  AND (NOT is_announcement OR is_group_admin(group_id))
);
CREATE POLICY "gp_delete" ON group_posts FOR DELETE USING (
  author_id = auth.uid() OR is_group_admin(group_id)
);

-- ── group_post_likes ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_post_likes (
  post_id    uuid        NOT NULL REFERENCES group_posts ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE group_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gpl_select" ON group_post_likes FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_posts WHERE id = post_id AND is_group_member(group_id))
);
CREATE POLICY "gpl_insert" ON group_post_likes FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM group_posts WHERE id = post_id AND is_group_member(group_id))
);
CREATE POLICY "gpl_delete" ON group_post_likes FOR DELETE USING (user_id = auth.uid());

-- like_count trigger
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSE
    UPDATE group_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_post_like_count ON group_post_likes;
CREATE TRIGGER trg_post_like_count
  AFTER INSERT OR DELETE ON group_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- ── group_post_comments ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_post_comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES group_posts ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content    text        NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE group_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gpc_select" ON group_post_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_posts WHERE id = post_id AND is_group_member(group_id))
);
CREATE POLICY "gpc_insert" ON group_post_comments FOR INSERT WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (SELECT 1 FROM group_posts WHERE id = post_id AND is_group_member(group_id))
);
CREATE POLICY "gpc_delete" ON group_post_comments FOR DELETE USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_posts gp
    WHERE gp.id = post_id AND is_group_admin(gp.group_id)
  )
);

-- comment_count trigger
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSE
    UPDATE group_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comment_count ON group_post_comments;
CREATE TRIGGER trg_post_comment_count
  AFTER INSERT OR DELETE ON group_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ── group_events ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES groups ON DELETE CASCADE,
  created_by  uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title       text        NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  description text,
  location    text,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz,
  rsvp_count  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ge_select" ON group_events FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "ge_insert" ON group_events FOR INSERT WITH CHECK (
  auth.uid() = created_by AND is_group_admin(group_id)
);
CREATE POLICY "ge_update" ON group_events FOR UPDATE USING (is_group_admin(group_id));
CREATE POLICY "ge_delete" ON group_events FOR DELETE USING (is_group_admin(group_id));

-- ── group_event_rsvps ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_event_rsvps (
  event_id   uuid        NOT NULL REFERENCES group_events ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status     text        NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE group_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ger_select" ON group_event_rsvps FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_events WHERE id = event_id AND is_group_member(group_id))
);
CREATE POLICY "ger_insert" ON group_event_rsvps FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM group_events WHERE id = event_id AND is_group_member(group_id))
);
CREATE POLICY "ger_update" ON group_event_rsvps FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "ger_delete" ON group_event_rsvps FOR DELETE USING (user_id = auth.uid());

-- rsvp_count trigger (counts 'going' only)
CREATE OR REPLACE FUNCTION update_event_rsvp_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'going' THEN
    UPDATE group_events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'going' THEN
    UPDATE group_events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = OLD.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'going' AND NEW.status = 'going' THEN
      UPDATE group_events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
    ELSIF OLD.status = 'going' AND NEW.status != 'going' THEN
      UPDATE group_events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = OLD.event_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_event_rsvp_count ON group_event_rsvps;
CREATE TRIGGER trg_event_rsvp_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON group_event_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

-- ── group_files ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_files (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid        NOT NULL REFERENCES groups ON DELETE CASCADE,
  uploaded_by  uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  file_name    text        NOT NULL,
  storage_path text        NOT NULL,
  file_size    int         NOT NULL,
  mime_type    text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE group_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gf_select" ON group_files FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "gf_insert" ON group_files FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND is_group_member(group_id)
);
CREATE POLICY "gf_delete" ON group_files FOR DELETE USING (
  uploaded_by = auth.uid() OR is_group_admin(group_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Old tables cleanup (run manually after verifying UI works):
-- DROP TABLE IF EXISTS study_group_message_reactions CASCADE;
-- DROP TABLE IF EXISTS study_group_messages CASCADE;
-- DROP TABLE IF EXISTS group_join_requests CASCADE;
-- DROP TABLE IF EXISTS group_announcements CASCADE;
-- DROP TABLE IF EXISTS study_group_members CASCADE;
-- DROP TABLE IF EXISTS study_groups CASCADE;
-- ─────────────────────────────────────────────────────────────────────────────
