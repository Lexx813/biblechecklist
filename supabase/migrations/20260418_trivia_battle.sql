-- ============================================================
-- Bible Trivia Battle Tables
-- ============================================================

-- 1. trivia_questions
CREATE TABLE IF NOT EXISTS public.trivia_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question        text NOT NULL,
  options         jsonb NOT NULL,          -- array of 4 strings
  correct_index   int  NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  scripture_ref   text,
  difficulty      text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  category        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. trivia_rooms
CREATE TABLE IF NOT EXISTS public.trivia_rooms (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code               text NOT NULL UNIQUE,
  host_id                 uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status                  text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','playing','finished')),
  current_question_index  int  NOT NULL DEFAULT 0,
  current_team            text NOT NULL DEFAULT 'A' CHECK (current_team IN ('A','B')),
  team_a_score            int  NOT NULL DEFAULT 0,
  team_b_score            int  NOT NULL DEFAULT 0,
  time_limit_seconds      int  NOT NULL DEFAULT 30,
  question_count          int  NOT NULL DEFAULT 10,
  allow_custom            bool NOT NULL DEFAULT true,
  player_count            int  NOT NULL DEFAULT 2,
  has_timer               bool NOT NULL DEFAULT true,
  points_to_win           int  NOT NULL DEFAULT 0,
  selected_question_ids   uuid[]       NOT NULL DEFAULT '{}',
  pending_next            bool NOT NULL DEFAULT false,
  last_answer_index       int,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- 3. trivia_players
CREATE TABLE IF NOT EXISTS public.trivia_players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES public.trivia_rooms(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name          text NOT NULL,
  display_name  text NOT NULL,
  team          text NOT NULL CHECK (team IN ('A','B')),
  is_host       bool NOT NULL DEFAULT false,
  avatar_url    text,
  joined_at     timestamptz NOT NULL DEFAULT now()
);

-- 4. trivia_custom_questions
CREATE TABLE IF NOT EXISTS public.trivia_custom_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES public.trivia_rooms(id) ON DELETE CASCADE,
  question      text NOT NULL,
  options       jsonb NOT NULL,
  correct_index int  NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 5. trivia_game_log
CREATE TABLE IF NOT EXISTS public.trivia_game_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES public.trivia_rooms(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL,
  team          text NOT NULL CHECK (team IN ('A','B')),
  is_correct    bool NOT NULL,
  answered_at   timestamptz NOT NULL DEFAULT now()
);

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_trivia_rooms_updated_at ON public.trivia_rooms;
CREATE TRIGGER trg_trivia_rooms_updated_at
  BEFORE UPDATE ON public.trivia_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_trivia_rooms_code   ON public.trivia_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_trivia_rooms_status ON public.trivia_rooms(status);
CREATE INDEX IF NOT EXISTS idx_trivia_players_room ON public.trivia_players(room_id);
CREATE INDEX IF NOT EXISTS idx_trivia_game_log_room ON public.trivia_game_log(room_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.trivia_questions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_rooms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_players         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_custom_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_game_log        ENABLE ROW LEVEL SECURITY;

-- Questions: public read
CREATE POLICY "trivia_questions_public_read"
  ON public.trivia_questions FOR SELECT USING (true);

-- Rooms: public read (needed for Realtime + joining)
CREATE POLICY "trivia_rooms_public_read"
  ON public.trivia_rooms FOR SELECT USING (true);

-- Players: public read (lobby display)
CREATE POLICY "trivia_players_public_read"
  ON public.trivia_players FOR SELECT USING (true);

-- All writes go through service-role API routes — no anon/auth INSERT policies needed
-- (service role bypasses RLS)

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER publication supabase_realtime ADD TABLE public.trivia_rooms;
ALTER publication supabase_realtime ADD TABLE public.trivia_players;
