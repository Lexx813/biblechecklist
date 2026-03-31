import { supabase } from "../lib/supabase";

export const familyQuizApi = {
  // Pick N random questions from specified levels (empty array = all levels)
  pickQuestions: async (count, levels = []) => {
    let query = supabase
      .from("quiz_questions")
      .select("id, level, question, options, correct_index");
    if (levels.length > 0) query = query.in("level", levels);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const pool = data ?? [];
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);
    return shuffled;
  },

  // Create a new challenge; questions already picked by caller
  createChallenge: async (creatorId, title, questionIds) => {
    const { data, error } = await supabase
      .from("family_challenges")
      .insert({ creator_id: creatorId, title, question_ids: questionIds })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data.id;
  },

  // Load a challenge's metadata + its full questions (in order)
  getChallenge: async (challengeId) => {
    const { data: challenge, error: cErr } = await supabase
      .from("family_challenges")
      .select("id, title, creator_id, created_at, profiles!creator_id(display_name)")
      .eq("id", challengeId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!challenge) return null;

    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, level, question, options, correct_index")
      .in("id", challenge.question_ids);
    if (qErr) throw new Error(qErr.message);

    // Restore original insertion order
    const qMap = Object.fromEntries((questions ?? []).map(q => [q.id, q]));
    const ordered = challenge.question_ids.map(id => qMap[id]).filter(Boolean);
    return { ...challenge, questions: ordered };
  },

  // Get all completed attempts for a challenge, joined with display names
  getAttempts: async (challengeId) => {
    const { data, error } = await supabase
      .from("challenge_attempts")
      .select("id, user_id, score, total, completed_at, profiles!user_id(display_name, avatar_url)")
      .eq("challenge_id", challengeId)
      .order("score", { ascending: false })
      .order("completed_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Check if current user already has an attempt for this challenge
  getMyAttempt: async (challengeId, userId) => {
    const { data, error } = await supabase
      .from("challenge_attempts")
      .select("id, score, total, answers, completed_at")
      .eq("challenge_id", challengeId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  },

  // Submit a completed attempt
  submitAttempt: async (challengeId, userId, answers, score, total) => {
    const { error } = await supabase.from("challenge_attempts").insert({
      challenge_id: challengeId,
      user_id: userId,
      answers,
      score,
      total,
    });
    if (error) throw new Error(error.message);
  },

  // List challenges created by a user (most recent first)
  getMyChallenges: async (userId) => {
    const { data, error } = await supabase
      .from("family_challenges")
      .select("id, title, created_at, question_ids")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // List challenges the user has attempted (most recent first)
  getMyAttemptedChallenges: async (userId) => {
    const { data, error } = await supabase
      .from("challenge_attempts")
      .select("challenge_id, score, total, completed_at, family_challenges(id, title, creator_id, created_at, profiles!creator_id(display_name))")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []).map(a => ({
      ...a.family_challenges,
      myScore: a.score,
      myTotal: a.total,
      attemptedAt: a.completed_at,
    }));
  },
};
