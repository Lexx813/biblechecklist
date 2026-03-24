import { supabase } from "../lib/supabase";

export const followsApi = {
  toggleFollow: async (targetId) => {
    const { data, error } = await supabase.rpc("toggle_follow", { p_following_id: targetId });
    if (error) throw new Error(error.message);
    return data; // true = now following, false = unfollowed
  },

  isFollowing: async (followerId, targetId) => {
    const { count, error } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", followerId)
      .eq("following_id", targetId);
    if (error) return false;
    return count > 0;
  },

  getFollowCounts: async (userId) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    ]);
    return { followers: followers ?? 0, following: following ?? 0 };
  },

  getActivityFeed: async (userId, limit = 40) => {
    const { data: follows, error: fe } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", userId);
    if (fe || !follows?.length) return [];

    const ids = follows.map(f => f.following_id);

    const [{ data: threads }, { data: badgeRows }, { data: postRows }] = await Promise.all([
      supabase
        .from("forum_threads")
        .select("id, title, created_at, author_id, profiles!author_id(display_name, avatar_url)")
        .in("author_id", ids)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_quiz_progress")
        .select("user_id, level, updated_at")
        .in("user_id", ids)
        .eq("badge_earned", true)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_posts")
        .select("id, user_id, content, created_at, profiles!user_id(display_name, avatar_url)")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    // Fetch profiles for badge row authors separately (user_quiz_progress → profiles join)
    let badgeAuthorMap = new Map();
    if (badgeRows?.length) {
      const badgeUserIds = [...new Set(badgeRows.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", badgeUserIds);
      for (const p of profiles ?? []) badgeAuthorMap.set(p.id, p);
    }

    const items = [
      ...(threads ?? []).map(t => ({
        type: "thread",
        id: t.id,
        authorId: t.author_id,
        title: t.title,
        author: t.profiles,
        ts: t.created_at,
      })),
      ...(badgeRows ?? []).map(b => ({
        type: "badge",
        level: b.level,
        authorId: b.user_id,
        author: badgeAuthorMap.get(b.user_id) ?? null,
        ts: b.updated_at,
      })),
      ...(postRows ?? []).map(p => ({
        type: "post",
        id: p.id,
        authorId: p.user_id,
        content: p.content,
        author: p.profiles,
        ts: p.created_at,
      })),
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, limit);

    return items;
  },
};
