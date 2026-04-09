-- Add language column to study_notes so community notes can be split by language.
-- Existing notes default to 'en'.

ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS lang text NOT NULL DEFAULT 'en';

-- Index for filtering public notes by language
CREATE INDEX IF NOT EXISTS idx_study_notes_public_lang
  ON study_notes (is_public, lang, updated_at DESC)
  WHERE is_public = true;
