-- Phase 3: Meeting Prep — CLAM + Watchtower Study checklist system

-- ── Scraped weekly meeting content ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_weeks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start      date NOT NULL UNIQUE,   -- Monday of the meeting week

  -- CLAM metadata
  clam_doc_id     text,
  clam_week_title text,                   -- e.g. "APRIL 6-12"
  clam_bible_reading text,               -- e.g. "ISAIAH 50-51"
  clam_opening_song  integer,
  clam_midpoint_song integer,
  clam_closing_song  integer,
  clam_parts      jsonb DEFAULT '[]',     -- [{num,section,title}]
  clam_wol_url    text,

  -- Watchtower study metadata
  wt_doc_id       text,
  wt_article_title     text,
  wt_theme_scripture   text,
  wt_paragraph_count   integer DEFAULT 20,
  wt_wol_url      text,

  scraped_at      timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- ── User meeting prep progress ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_meeting_prep (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start      date NOT NULL,

  -- CLAM progress: {partNum: true}
  clam_checked    jsonb DEFAULT '{}',
  clam_notes      text,
  clam_completed  boolean DEFAULT false,

  -- WT progress: {paragraphNum: true}
  wt_checked      jsonb DEFAULT '{}',
  wt_notes        text,
  wt_completed    boolean DEFAULT false,

  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  UNIQUE (user_id, week_start)
);

-- RLS
ALTER TABLE meeting_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_weeks_public_read" ON meeting_weeks FOR SELECT USING (true);

ALTER TABLE user_meeting_prep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prep_own" ON user_meeting_prep
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Meeting schedule settings on profiles ────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS meeting_day_midweek integer DEFAULT 3,  -- 1=Mon … 7=Sun
  ADD COLUMN IF NOT EXISTS meeting_day_weekend  integer DEFAULT 7;

-- ── Prep streak helper ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_prep_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_streak integer := 0;
  v_week   date;
  v_monday date;
BEGIN
  -- Walk backwards week by week from current week
  v_monday := date_trunc('week', CURRENT_DATE)::date;
  LOOP
    SELECT week_start INTO v_week
    FROM user_meeting_prep
    WHERE user_id = p_user_id
      AND week_start = v_monday
      AND (clam_completed OR wt_completed);

    EXIT WHEN NOT FOUND;
    v_streak := v_streak + 1;
    v_monday := v_monday - INTERVAL '7 days';
  END LOOP;
  RETURN v_streak;
END;
$$;
