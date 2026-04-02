-- supabase/migrations/add_quiz_enhancements.sql

-- 1. Add explanation column to quiz questions (source language = English)
alter table quiz_questions add column if not exists explanation text;

-- 2. Add explanation to translations table
alter table quiz_question_translations add column if not exists explanation text;

-- 3. Timed mode scores
create table if not exists quiz_timed_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  level int not null check (level between 1 and 12),
  score int not null,
  achieved_at timestamptz default now()
);

alter table quiz_timed_scores enable row level security;

-- All authenticated users can read (for leaderboard)
create policy "Authenticated read timed scores"
  on quiz_timed_scores for select
  using (auth.role() = 'authenticated');

-- Users can only insert their own scores
create policy "Users insert own timed scores"
  on quiz_timed_scores for insert
  with check (auth.uid() = user_id);

create index if not exists idx_quiz_timed_scores_level_score
  on quiz_timed_scores(level, score desc);

create index if not exists idx_quiz_timed_scores_user
  on quiz_timed_scores(user_id);
