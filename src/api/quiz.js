import { supabase } from "../lib/supabase";

export const quizApi = {
  getQuestionsForLevel: async (level) => {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, question, options, correct_index")
      .eq("level", level);
    if (error) throw new Error(error.message);
    // shuffle and take 10
    const shuffled = (data ?? []).sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  },

  getUserProgress: async (userId) => {
    const { data, error } = await supabase
      .from("user_quiz_progress")
      .select("*")
      .eq("user_id", userId)
      .order("level");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  submitResult: async (userId, level, score) => {
    const { data, error } = await supabase.rpc("submit_quiz_result", {
      p_user_id: userId,
      p_level: level,
      p_score: score,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  initProgress: async (userId) => {
    // Ensure level 1 is unlocked for new users
    const { error } = await supabase
      .from("user_quiz_progress")
      .upsert(
        { user_id: userId, level: 1, unlocked: true },
        { onConflict: "user_id,level", ignoreDuplicates: true }
      );
    if (error) throw new Error(error.message);
  },
};
