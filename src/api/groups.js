import { supabase } from "../lib/supabase";

export const groupsApi = {
  // ── Groups ──────────────────────────────────────────────────────────────────

  getMyGroups: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("study_group_members")
      .select("role, joined_at, group:study_groups(id, name, description, cover_url, is_private, invite_code, goal_label, goal_deadline, creator_id, created_at)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(r => ({ ...r.group, myRole: r.role, joinedAt: r.joined_at }));
  },

  getPublicGroups: async () => {
    const { data, error } = await supabase
      .from("study_groups")
      .select("id, name, description, cover_url, goal_label, goal_deadline, created_at, creator_id")
      .eq("is_private", false)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getGroup: async (groupId) => {
    const { data, error } = await supabase
      .from("study_groups")
      .select("*")
      .eq("id", groupId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  createGroup: async ({ name, description, isPrivate, goalLabel, goalDeadline }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    // Insert group
    const { data: group, error: ge } = await supabase
      .from("study_groups")
      .insert({ name, description, is_private: isPrivate, goal_label: goalLabel, goal_deadline: goalDeadline || null, creator_id: user.id })
      .select()
      .single();
    if (ge) throw new Error(ge.message);
    // Auto-join as admin
    const { error: me } = await supabase
      .from("study_group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "admin" });
    if (me) throw new Error(me.message);
    return group;
  },

  updateGroup: async (groupId, updates) => {
    const { error } = await supabase
      .from("study_groups")
      .update(updates)
      .eq("id", groupId);
    if (error) throw new Error(error.message);
  },

  deleteGroup: async (groupId) => {
    const { error } = await supabase
      .from("study_groups")
      .delete()
      .eq("id", groupId);
    if (error) throw new Error(error.message);
  },

  // ── Membership ───────────────────────────────────────────────────────────────

  getMembers: async (groupId) => {
    const { data: members, error } = await supabase
      .from("study_group_members")
      .select("role, joined_at, user_id")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });
    if (error) throw new Error(error.message);
    if (!members?.length) return [];

    const userIds = members.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    return members.map(m => ({
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      display_name: profileMap[m.user_id]?.display_name ?? null,
      avatar_url: profileMap[m.user_id]?.avatar_url ?? null,
    }));
  },

  joinGroup: async (groupId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("study_group_members")
      .insert({ group_id: groupId, user_id: user.id, role: "member" });
    if (error) throw new Error(error.message);
  },

  joinByCode: async (code) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: group, error: ge } = await supabase
      .from("study_groups")
      .select("id")
      .eq("invite_code", code.trim().toLowerCase())
      .single();
    if (ge || !group) throw new Error("Invalid invite code");
    const { error: me } = await supabase
      .from("study_group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "member" });
    if (me) throw new Error(me.message);
    return group.id;
  },

  leaveGroup: async (groupId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("study_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
  },

  removeMember: async (groupId, userId) => {
    const { error } = await supabase
      .from("study_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  promoteMember: async (groupId, userId) => {
    const { error } = await supabase
      .from("study_group_members")
      .update({ role: "admin" })
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  getMemberCount: async (groupId) => {
    const { count, error } = await supabase
      .from("study_group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);
    if (error) return 0;
    return count ?? 0;
  },

  // ── Group leaderboard (streaks from existing RPC) ─────────────────────────

  getLeaderboard: async (groupId) => {
    const { data: members, error } = await supabase
      .from("study_group_members")
      .select("user_id")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    if (!members?.length) return [];

    const userIds = members.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    const results = await Promise.all(
      userIds.map(async (uid) => {
        const { data: streak } = await supabase.rpc("get_reading_streaks", { p_user_id: uid });
        return {
          userId: uid,
          displayName: profileMap[uid]?.display_name || "Unknown",
          avatarUrl: profileMap[uid]?.avatar_url || null,
          currentStreak: streak?.current_streak ?? 0,
          longestStreak: streak?.longest_streak ?? 0,
        };
      })
    );
    return results.sort((a, b) => b.currentStreak - a.currentStreak);
  },

  // ── Group chat ────────────────────────────────────────────────────────────

  getMessages: async (groupId) => {
    const { data: msgs, error } = await supabase
      .from("study_group_messages")
      .select("id, content, created_at, sender_id, reply_to_id, edited_at")
      .eq("group_id", groupId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    if (!msgs?.length) return [];

    const senderIds = [...new Set(msgs.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", senderIds);
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    return msgs.map(m => ({
      ...m,
      sender: profileMap[m.sender_id] ?? null,
    }));
  },

  sendMessage: async (groupId, senderId, content, replyToId = null) => {
    const { data, error } = await supabase
      .from("study_group_messages")
      .insert({ group_id: groupId, sender_id: senderId, content: content.trim(), reply_to_id: replyToId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  editMessage: async (messageId, content) => {
    const { error } = await supabase
      .from("study_group_messages")
      .update({ content: content.trim(), edited_at: new Date().toISOString() })
      .eq("id", messageId);
    if (error) throw new Error(error.message);
  },

  deleteMessage: async (messageId) => {
    const { error } = await supabase
      .from("study_group_messages")
      .delete()
      .eq("id", messageId);
    if (error) throw new Error(error.message);
  },

  getGroupReactions: async (groupId) => {
    const { data, error } = await supabase
      .from("study_group_message_reactions")
      .select("id, message_id, user_id, emoji")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  toggleGroupReaction: async (messageId, groupId, emoji, userId) => {
    const { data: existing } = await supabase
      .from("study_group_message_reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("study_group_message_reactions").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("study_group_message_reactions").insert({ message_id: messageId, group_id: groupId, user_id: userId, emoji });
      if (error) throw new Error(error.message);
    }
  },
};
