import { supabase } from "../lib/supabase";

export const quizApi = {
  getQuestionsForLevel: async (level: number, language = "en") => {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select(`
      id,
      question,
      options,
      correct_index,
      explanation,
      quiz_question_translations (
        lang,
        question,
        options,
        explanation
      )
    `)
      .eq("level", level)
      .order("created_at");

    if (error) throw error;

    const questions = (data ?? []).map((q) => {
      const tx = q.quiz_question_translations?.find((t) => t.lang === language);
      return {
        id: q.id,
        question: tx?.question ?? q.question,
        options: tx?.options ?? q.options,
        correct_index: q.correct_index,
        explanation: tx?.explanation ?? q.explanation ?? null,
      };
    });
    return questions.sort(() => Math.random() - 0.5).slice(0, 10);
  },

  getUserProgress: async (userId: string) => {
    const { data, error } = await supabase
      .from("user_quiz_progress")
      .select("*")
      .eq("user_id", userId)
      .order("level");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  submitResult: async (userId: string, level: number, score: number) => {
    const { data, error } = await supabase.rpc("submit_quiz_result", {
      p_user_id: userId,
      p_level: level,
      p_score: score,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  initProgress: async (userId: string, startLevel = 1) => {
    // Ensure the starting level is unlocked for new users
    const { error } = await supabase
      .from("user_quiz_progress")
      .upsert(
        { user_id: userId, level: startLevel, unlocked: true },
        { onConflict: "user_id,level", ignoreDuplicates: true }
      );
    if (error) throw new Error(error.message);
  },

  // Admin: create a question
  createQuestion: async (level: number, question: string, options: string[], correctIndex: number) => {
    const { data, error } = await supabase
      .from("quiz_questions")
      .insert({ level, question, options, correct_index: correctIndex })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Admin: update a question
  updateQuestion: async (id: string, level: number, question: string, options: string[], correctIndex: number) => {
    const { data, error } = await supabase
      .from("quiz_questions")
      .update({ level, question, options, correct_index: correctIndex })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Admin: delete a question
  deleteQuestion: async (id: string) => {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  // Admin: get all questions
  getAllQuestions: async () => {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .order("level")
      .order("created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
