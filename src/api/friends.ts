// @ts-nocheck
import { supabase } from "../lib/supabase";

export const friendsApi = {
  // ── Friend requests ──────────────────────────────────────

  sendRequest: async (toUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("friend_requests")
      .insert({ from_user_id: user.id, to_user_id: toUserId });
    if (error) throw new Error(error.message);
    // Notify recipient
    await supabase.rpc("create_notification", {
      p_user_id: toUserId,
      p_actor_id: user.id,
      p_type: "friend_request",
      p_thread_id: null,
      p_post_id: null,
      p_preview: null,
      p_link_hash: null,
    });
  },

  cancelRequest: async (toUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .eq("from_user_id", user.id)
      .eq("to_user_id", toUserId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
  },

  acceptRequest: async (fromUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Update request status
    const { error: reqErr } = await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("from_user_id", fromUserId)
      .eq("to_user_id", user.id)
      .eq("status", "pending");
    if (reqErr) throw new Error(reqErr.message);

    // Create friendship (user_a_id < user_b_id enforced)
    const [a, b] = [fromUserId, user.id].sort();
    const { error: friendErr } = await supabase
      .from("friendships")
      .insert({ user_a_id: a, user_b_id: b });
    if (friendErr && friendErr.code !== "23505") throw new Error(friendErr.message);
  },

  declineRequest: async (fromUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "declined" })
      .eq("from_user_id", fromUserId)
      .eq("to_user_id", user.id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
  },

  getIncoming: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*, sender:from_user_id(id, display_name, avatar_url)")
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getOutgoing: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*, recipient:to_user_id(id, display_name, avatar_url)")
      .eq("from_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getStatus: async (targetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "none";

    // Check friendship first
    const [a, b] = [user.id, targetId].sort();
    const { count: friendCount } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("user_a_id", a)
      .eq("user_b_id", b);
    if (friendCount > 0) return "friends";

    // Check sent request
    const { count: sentCount } = await supabase
      .from("friend_requests")
      .select("*", { count: "exact", head: true })
      .eq("from_user_id", user.id)
      .eq("to_user_id", targetId)
      .eq("status", "pending");
    if (sentCount > 0) return "pending_sent";

    // Check received request
    const { count: recvCount } = await supabase
      .from("friend_requests")
      .select("*", { count: "exact", head: true })
      .eq("from_user_id", targetId)
      .eq("to_user_id", user.id)
      .eq("status", "pending");
    if (recvCount > 0) return "pending_received";

    return "none";
  },

  // ── Friends list ─────────────────────────────────────────

  getFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id, sponsored_by, created_at,
        user_a:user_a_id(id, display_name, avatar_url, last_active_at),
        user_b:user_b_id(id, display_name, avatar_url, last_active_at)
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(f => {
      const friend = f.user_a?.id === user.id ? f.user_b : f.user_a;
      return { ...friend, friendship_id: f.id, sponsored_by: f.sponsored_by, friendship_created_at: f.created_at };
    });
  },

  removeFriend: async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    if (error) throw new Error(error.message);
  },

  // ── Invite tokens ────────────────────────────────────────

  getOrCreateToken: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: existing } = await supabase
      .from("invite_tokens")
      .select("token")
      .eq("user_id", user.id)
      .single();
    if (existing?.token) return existing.token;

    const { data: created, error } = await supabase
      .from("invite_tokens")
      .insert({ user_id: user.id })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    return created.token;
  },

  getInviterByToken: async (token: string) => {
    const { data, error } = await supabase
      .from("invite_tokens")
      .select("user_id, profiles:user_id(id, display_name, avatar_url)")
      .eq("token", token)
      .single();
    if (error || !data) return null;
    return data.profiles;
  },

  processInviteSignup: async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const inviter = await friendsApi.getInviterByToken(token);
    if (!inviter || inviter.id === user.id) return;

    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("subscription_status, is_admin")
      .eq("id", inviter.id)
      .single();

    const inviterIsPremium =
      inviterProfile?.is_admin ||
      ["active","trialing","gifted"].includes(inviterProfile?.subscription_status);

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("subscription_status, is_admin")
      .eq("id", user.id)
      .single();

    const myIsPremium =
      myProfile?.is_admin ||
      ["active","trialing","gifted"].includes(myProfile?.subscription_status);

    const { error: reqErr } = await supabase
      .from("friend_requests")
      .insert({ from_user_id: inviter.id, to_user_id: user.id });

    if (!reqErr && inviterIsPremium && !myIsPremium) {
      const [a, b] = [inviter.id, user.id].sort();
      await supabase.from("friend_requests")
        .update({ status: "accepted" })
        .eq("from_user_id", inviter.id)
        .eq("to_user_id", user.id);
      await supabase.from("friendships")
        .insert({ user_a_id: a, user_b_id: b, sponsored_by: inviter.id });
    }
  },

  // ── Sponsored messaging check ────────────────────────────

  isSponsoredWith: async (otherUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const [a, b] = [user.id, otherUserId].sort();
    const { data } = await supabase
      .from("friendships")
      .select("sponsored_by")
      .eq("user_a_id", a)
      .eq("user_b_id", b)
      .single();
    return !!data?.sponsored_by;
  },

  canMessageUser: async (otherUserId: string, userIsPremium: boolean) => {
    if (userIsPremium) return true;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const [a, b] = [user.id, otherUserId].sort();
    const { data } = await supabase
      .from("friendships")
      .select("sponsored_by")
      .eq("user_a_id", a)
      .eq("user_b_id", b)
      .single();
    return !!data?.sponsored_by;
  },
};
