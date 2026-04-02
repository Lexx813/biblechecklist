import { supabase } from "../lib/supabase";

export interface FollowProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

interface ThreadAuthor {
  display_name: string | null;
  avatar_url: string | null;
}

interface FeedThread {
  type: "thread";
  id: string;
  authorId: string;
  title: string;
  author: ThreadAuthor | ThreadAuthor[] | null;
  ts: string;
}

interface FeedBadge {
  type: "badge";
  level: string;
  authorId: string;
  author: FollowProfile | null;
  ts: string;
}

interface FeedPost {
  type: "post";
  id: string;
  authorId: string;
  content: string;
  author: ThreadAuthor | ThreadAuthor[] | null;
  ts: string;
}

export type FeedItem = FeedThread | FeedBadge | FeedPost;

export const followsApi = {
  toggleFollow: async (targetId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("toggle_follow", { p_following_id: targetId });
    if (error) throw new Error(error.message);
    return data as boolean; // true = now following, false = unfollowed
  },

  isFollowing: async (followerId: string, targetId: string): Promise<boolean> => {
    const { count, error } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", followerId)
      .eq("following_id", targetId);
    if (error) return false;
    return (count ?? 0) > 0;
  },

  getFollowCounts: async (userId: string): Promise<FollowCounts> => {
    try {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
      ]);
      return { followers: followers ?? 0, following: following ?? 0 };
    } catch {
      return { followers: 0, following: 0 };
    }
  },

  getFollowers: async (userId: string): Promise<unknown[]> => {
    const { data, error } = await supabase
      .from("user_follows")
      .select("follower_id, profiles!follower_id(id, display_name, avatar_url)")
      .eq("following_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(r => r.profiles).filter(Boolean);
  },

  getFollowing: async (userId: string): Promise<unknown[]> => {
    const { data, error } = await supabase
      .from("user_follows")
      .select("following_id, profiles!following_id(id, display_name, avatar_url)")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(r => r.profiles).filter(Boolean);
  },

  getActivityFeed: async (userId: string, limit = 40): Promise<FeedItem[]> => {
    const { data: follows, error: fe } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", userId);
    if (fe || !follows?.length) return [];

    const ids = follows.map(f => f.following_id);

    const results = await Promise.allSettled([
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
    const threads  = results[0].status === "fulfilled" ? results[0].value.data : null;
    const badgeRows = results[1].status === "fulfilled" ? results[1].value.data : null;
    const postRows  = results[2].status === "fulfilled" ? results[2].value.data : null;

    // Fetch profiles for badge row authors separately (user_quiz_progress → profiles join)
    const badgeAuthorMap = new Map<string, FollowProfile>();
    if (badgeRows?.length) {
      const badgeUserIds = [...new Set(badgeRows.map(b => b.user_id as string))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", badgeUserIds);
      for (const p of profiles ?? []) badgeAuthorMap.set(p.id as string, p as FollowProfile);
    }

    const items: FeedItem[] = [
      ...(threads ?? []).map(t => ({
        type: "thread" as const,
        id: t.id as string,
        authorId: t.author_id as string,
        title: t.title as string,
        author: t.profiles as ThreadAuthor | ThreadAuthor[] | null,
        ts: t.created_at as string,
      })),
      ...(badgeRows ?? []).map(b => ({
        type: "badge" as const,
        level: b.level as string,
        authorId: b.user_id as string,
        author: badgeAuthorMap.get(b.user_id as string) ?? null,
        ts: b.updated_at as string,
      })),
      ...(postRows ?? []).map(p => ({
        type: "post" as const,
        id: p.id as string,
        authorId: p.user_id as string,
        content: p.content as string,
        author: p.profiles as ThreadAuthor | ThreadAuthor[] | null,
        ts: p.created_at as string,
      })),
    ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, limit);

    return items;
  },
};
