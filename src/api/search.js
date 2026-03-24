import { supabase } from "../lib/supabase";

export const searchApi = {
  search: async (query) => {
    if (!query || query.trim().length < 2) return { posts: [], threads: [] };
    const { data, error } = await supabase.rpc("global_search", {
      p_query: query.trim(),
      p_limit: 6,
    });
    if (error) throw new Error(error.message);
    return data ?? { posts: [], threads: [] };
  },
};
