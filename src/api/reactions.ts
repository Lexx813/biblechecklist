import { supabase } from "../lib/supabase";

export type ReactionEmoji = "👍" | "❤️" | "🙏" | "📖" | "🔥";
export const REACTION_EMOJIS: ReactionEmoji[] = ["👍", "❤️", "🙏", "📖", "🔥"];

export interface ReactionTarget {
  type: string;
  id: string;
}

export interface ReactionSummary {
  counts: Record<string, number>;
  mine: string[];
}

export type ReactionMap = Record<string, ReactionSummary>;

export const reactionsApi = {
  toggle: async (targetType: string, targetId: string, emoji: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("toggle_reaction", {
      p_target_type: targetType,
      p_target_id: targetId,
      p_emoji: emoji,
    });
    if (error) throw new Error(error.message);
    return data as boolean;
  },

  bulk: async (targets: ReactionTarget[]): Promise<ReactionMap> => {
    if (targets.length === 0) return {};
    const { data, error } = await supabase.rpc("get_reactions_bulk", { p_targets: targets });
    if (error) throw new Error(error.message);
    return (data as ReactionMap) ?? {};
  },
};
