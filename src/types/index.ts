// Re-export Supabase generated types for convenience
export type { Database } from "./supabase";

// Shorthand row types for the most-used tables
import type { Database } from "./supabase";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type ChapterRead = Tables["chapter_reads"]["Row"];
export type UserReadingPlan = Tables["user_reading_plans"]["Row"];
export type BlogPost = Tables["blog_posts"]["Row"];
export type ForumThread = Tables["forum_threads"]["Row"];
export type ForumReply = Tables["forum_replies"]["Row"];
export type UserBadge = Tables["user_badges"]["Row"];
export type StreakFreezeUse = Tables["streak_freeze_uses"]["Row"];
export type GroupChallenge = Tables["group_challenges"]["Row"];
export type QuizQuestion = Tables["quiz_questions"]["Row"];
export type QuizTimedScore = Tables["quiz_timed_scores"]["Row"];
export type StudyNote = Tables["study_notes"]["Row"];
