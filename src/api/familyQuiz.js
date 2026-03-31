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
    // Fetch challenge without any FK join to avoid ambiguity (creator_id has
    // two FKs: one to auth.users and one to profiles)
    const { data: challenge, error: cErr } = await supabase
      .from("family_challenges")
      .select("id, title, creator_id, created_at, question_ids")
      .eq("id", challengeId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!challenge) return null;

    // Fetch creator display name separately to avoid FK ambiguity
    const { data: creator } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", challenge.creator_id)
      .maybeSingle();

    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, level, question, options, correct_index")
      .in("id", challenge.question_ids);
    if (qErr) throw new Error(qErr.message);

    // Restore original insertion order
    const qMap = Object.fromEntries((questions ?? []).map(q => [q.id, q]));
    const ordered = challenge.question_ids.map(id => qMap[id]).filter(Boolean);
    return { ...challenge, creatorName: creator?.display_name ?? null, questions: ordered };
  },

  // Get all completed attempts for a challenge, joined with display names
  getAttempts: async (challengeId) => {
    const { data, error } = await supabase
      .from("challenge_attempts")
      .select("id, user_id, score, total, completed_at")
      .eq("challenge_id", challengeId)
      .order("score", { ascending: false })
      .order("completed_at", { ascending: true });
    if (error) throw new Error(error.message);
    if (!data?.length) return [];

    // Fetch profiles separately to avoid FK ambiguity on user_id
    const userIds = [...new Set(data.map(a => a.user_id))];
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    const profileMap = Object.fromEntries((profileRows ?? []).map(p => [p.id, p]));
    return data.map(a => ({ ...a, profiles: profileMap[a.user_id] ?? null }));
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
      .select("challenge_id, score, total, completed_at, family_challenges(id, title, creator_id, created_at, question_ids)")
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
