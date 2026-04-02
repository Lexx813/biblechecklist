// src/api/groupChallenge.js
import { supabase } from "../lib/supabase";
import { PLAN_TEMPLATES } from "../data/readingPlanTemplates";
import { BOOKS } from "../data/books";

// Build the flat chapter list for a plan key — returns [{bookIndex, chapter}]
// Templates store bookIndices (e.g. [39,40,41,42]); we expand each book's chapters.
function getPlanChapters(planKey) {
  const template = PLAN_TEMPLATES.find((t) => t.key === planKey);
  if (!template) return [];
  const chapters = [];
  for (const bookIndex of template.bookIndices) {
    const book = BOOKS[bookIndex];
    for (let ch = 1; ch <= book.chapters; ch++) {
      chapters.push({ bookIndex, chapter: ch });
    }
  }
  return chapters;
}

export const groupChallengeApi = {
  getActiveChallenge: async (groupId) => {
    const { data, error } = await supabase
      .from("group_challenges")
      .select("id, group_id, plan_key, start_date, created_by, created_at")
      .eq("group_id", groupId)
      .is("ended_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  startChallenge: async (groupId, planKey, userId) => {
    // End any existing active challenge first
    await supabase
      .from("group_challenges")
      .update({ ended_at: new Date().toISOString() })
      .eq("group_id", groupId)
      .is("ended_at", null);

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("group_challenges")
      .insert({
        group_id: groupId,
        plan_key: planKey,
        start_date: today,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  endChallenge: async (challengeId) => {
    const { error } = await supabase
      .from("group_challenges")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", challengeId);

    if (error) throw error;
  },

  getChallengeProgress: async (challengeId, planKey) => {
    const planChapters = getPlanChapters(planKey);
    const { data, error } = await supabase.rpc("get_group_challenge_progress", {
      p_challenge_id: challengeId,
      p_plan_chapters: planChapters,
    });

    if (error) throw error;
    return data ?? [];
  },

  getUserGroupChallenges: async (userId) => {
    const { data: memberRows, error: memberError } = await supabase
      .from("study_group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (memberError) throw memberError;

    const groupIds = (memberRows ?? []).map((r) => r.group_id);
    if (!groupIds.length) return [];

    const { data, error } = await supabase
      .from("group_challenges")
      .select("id, group_id, plan_key, start_date")
      .in("group_id", groupIds)
      .is("ended_at", null);

    if (error) throw error;
    return data ?? [];
  },
};
