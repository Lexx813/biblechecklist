-- Add group_type to study_groups table
-- Supported values: bible_study (default), prayer, family, congregation, general

ALTER TABLE study_groups
  ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'bible_study'
    CHECK (group_type IN ('bible_study', 'prayer', 'family', 'congregation', 'general'));
