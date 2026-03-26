-- ── Direct Messaging ──────────────────────────────────────────────────────────
-- DEV-ONLY feature — not exposed in production UI

CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id)      ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES profiles(id)      ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX messages_conv_time_idx ON messages(conversation_id, created_at);
CREATE INDEX conv_participants_user_idx ON conversation_participants(user_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                  ENABLE ROW LEVEL SECURITY;

-- Conversations: visible only to participants
CREATE POLICY "participants can view conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "authenticated can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Participants: visible to members of the same conversation
CREATE POLICY "users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "authenticated can insert participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users can update their own participation"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Messages: visible to conversation participants
CREATE POLICY "participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Soft delete — only sender can delete their own messages
CREATE POLICY "sender can soft-delete their messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- ── RPC: get or create a DM conversation ─────────────────────────────────────

CREATE OR REPLACE FUNCTION get_or_create_dm(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Look for an existing 1-on-1 conversation between the two users
  SELECT cp1.conversation_id INTO conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp2.conversation_id = cp1.conversation_id
   AND cp2.user_id = other_user_id
  WHERE cp1.user_id = auth.uid()
  -- Ensure it's exactly 2 participants (no group chats)
  AND (
    SELECT COUNT(*) FROM conversation_participants cp3
    WHERE cp3.conversation_id = cp1.conversation_id
  ) = 2
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv_id;
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES
      (conv_id, auth.uid()),
      (conv_id, other_user_id);
  END IF;

  RETURN conv_id;
END;
$$;

-- ── RPC: get conversation list with last message + unread count ───────────────

CREATE OR REPLACE FUNCTION get_conversations()
RETURNS TABLE (
  conversation_id       UUID,
  other_user_id         UUID,
  other_display_name    TEXT,
  other_avatar_url      TEXT,
  last_message_content  TEXT,
  last_message_at       TIMESTAMPTZ,
  last_message_sender_id UUID,
  unread_count          BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.conversation_id,
    op.user_id            AS other_user_id,
    pr.display_name       AS other_display_name,
    pr.avatar_url         AS other_avatar_url,
    lm.content            AS last_message_content,
    lm.created_at         AS last_message_at,
    lm.sender_id          AS last_message_sender_id,
    COUNT(um.id)          AS unread_count
  FROM conversation_participants cp
  JOIN conversation_participants op
    ON op.conversation_id = cp.conversation_id AND op.user_id != auth.uid()
  JOIN profiles pr ON pr.id = op.user_id
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id
    FROM messages
    WHERE conversation_id = cp.conversation_id AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN messages um
    ON  um.conversation_id = cp.conversation_id
    AND um.deleted_at IS NULL
    AND um.sender_id != auth.uid()
    AND um.created_at > cp.last_read_at
  WHERE cp.user_id = auth.uid()
  GROUP BY
    cp.conversation_id, op.user_id, pr.display_name, pr.avatar_url,
    lm.content, lm.created_at, lm.sender_id, cp.last_read_at
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$;

-- ── RPC: total unread message count for nav badge ─────────────────────────────

CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total BIGINT;
BEGIN
  SELECT COUNT(m.id) INTO total
  FROM messages m
  JOIN conversation_participants cp
    ON cp.conversation_id = m.conversation_id
   AND cp.user_id = auth.uid()
  WHERE m.sender_id != auth.uid()
    AND m.deleted_at IS NULL
    AND m.created_at > cp.last_read_at;
  RETURN COALESCE(total, 0);
END;
$$;
