import { supabase } from "../lib/supabase";

export interface LearnLessonProgressRow {
  user_id: string;
  lesson_id: string;
  unit_id: string;
  exercise_id: string | null;
  score: number | null;
  response_data: unknown;
  completed_at: string;
  updated_at: string;
}

export interface UpsertLearnLessonInput {
  lessonId: string;
  unitId: string;
  exerciseId?: string | null;
  score?: number | null;
  responseData?: unknown;
}

export interface AdminLearnPerLesson {
  lesson_id: string;
  unit_id: string;
  completion_count: number;
  unique_users: number;
  latest_completion: string | null;
}

export interface AdminLearnPerUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  lessons_completed: number;
  last_activity: string;
  first_activity: string;
  units_touched: string[];
}

export interface AdminLearnTotals {
  unique_starters: number;
  total_completions: number;
  first_activity: string | null;
  last_activity: string | null;
}

export interface AdminLearnStats {
  per_lesson: AdminLearnPerLesson[];
  per_user: AdminLearnPerUser[];
  totals: AdminLearnTotals;
}

export const learnApi = {
  listMine: async (userId: string): Promise<LearnLessonProgressRow[]> => {
    const { data, error } = await supabase
      .from("learn_lesson_progress")
      .select("user_id, lesson_id, unit_id, exercise_id, score, response_data, completed_at, updated_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []) as LearnLessonProgressRow[];
  },

  upsert: async (userId: string, input: UpsertLearnLessonInput): Promise<void> => {
    const { error } = await supabase
      .from("learn_lesson_progress")
      .upsert(
        {
          user_id: userId,
          lesson_id: input.lessonId,
          unit_id: input.unitId,
          exercise_id: input.exerciseId ?? null,
          score: input.score ?? null,
          response_data: input.responseData ?? null,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );
    if (error) throw new Error(error.message);
  },

  remove: async (userId: string, lessonId: string): Promise<void> => {
    const { error } = await supabase
      .from("learn_lesson_progress")
      .delete()
      .eq("user_id", userId)
      .eq("lesson_id", lessonId);
    if (error) throw new Error(error.message);
  },

  getAdminStats: async (): Promise<AdminLearnStats> => {
    const { data, error } = await supabase.rpc("admin_learn_stats");
    if (error) throw new Error(error.message);
    const stats = (data ?? {}) as Partial<AdminLearnStats>;
    return {
      per_lesson: stats.per_lesson ?? [],
      per_user: stats.per_user ?? [],
      totals: stats.totals ?? {
        unique_starters: 0,
        total_completions: 0,
        first_activity: null,
        last_activity: null,
      },
    };
  },
};
