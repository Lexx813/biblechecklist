import { supabase } from "../lib/supabase";

export const blocksApi = {
  blockUser: async (blockedId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: user.id, blocked_id: blockedId });
    // 23505 = unique_violation — already blocked, treat as success
    if (error && error.code !== "23505") throw new Error(error.message);
  },

  unblockUser: async (blockedId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);
    if (error) throw new Error(error.message);
  },

  getBlocks: async (userId: string): Promise<{ blocker_id: string; blocked_id: string }[]> => {
    const { data, error } = await supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getMyBlocks: async (userId: string): Promise<{ id: string; display_name: string | null; avatar_url: string | null }[]> => {
    const { data, error } = await supabase
      .from("user_blocks")
      .select("blocked_id, profiles:blocked_id(id, display_name, avatar_url)")
      .eq("blocker_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => row.profiles as { id: string; display_name: string | null; avatar_url: string | null });
  },
};
