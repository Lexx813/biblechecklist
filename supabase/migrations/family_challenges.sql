-- Family quiz challenges: async multiplayer quiz where one person creates a
-- challenge from the question bank and shares a link for family/friends to attempt.

CREATE TABLE family_challenges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'Family Bible Challenge',
  question_ids uuid[]     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE challenge_attempts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid        NOT NULL REFERENCES family_challenges(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers      jsonb       NOT NULL DEFAULT '[]', -- array of chosen option indices
  score        integer     NOT NULL DEFAULT 0,
  total        integer     NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

-- Index for quick lookup of attempts by challenge
CREATE INDEX challenge_attempts_challenge_id_idx ON challenge_attempts(challenge_id);
-- Index for user's own challenges
CREATE INDEX family_challenges_creator_id_idx ON family_challenges(creator_id);

-- RLS
ALTER TABLE family_challenges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read a challenge (shared by link)
CREATE POLICY "challenges_select" ON family_challenges
  FOR SELECT TO authenticated USING (true);

-- Any authenticated user can create a challenge
CREATE POLICY "challenges_insert" ON family_challenges
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

-- Creator can delete their own challenges
CREATE POLICY "challenges_delete" ON family_challenges
  FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- Anyone authenticated can read attempts for a challenge
CREATE POLICY "attempts_select" ON challenge_attempts
  FOR SELECT TO authenticated USING (true);

-- A user can insert their own attempt
CREATE POLICY "attempts_insert" ON challenge_attempts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
