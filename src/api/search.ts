import { supabase } from "../lib/supabase";

interface SearchResult {
  posts: unknown[];
  threads: unknown[];
  users?: unknown[];
}

interface SemanticSearchResult {
  verses: unknown[];
  posts: unknown[];
}

export const searchApi = {
  search: async (query: string): Promise<SearchResult> => {
    if (!query || query.trim().length < 2) return { posts: [], threads: [] };
    const { data, error } = await supabase.rpc("global_search", {
      p_query: query.trim(),
      p_limit: 6,
    });
    if (error) throw new Error(error.message);
    return (data as SearchResult) ?? { posts: [], threads: [], users: [] };
  },

  semanticSearch: async (query: string): Promise<SemanticSearchResult> => {
    if (!query || query.trim().length < 3) return { verses: [], posts: [] };
    const { data, error } = await supabase.functions.invoke("semantic-search", {
      body: { query: query.trim() },
    });
    if (error) throw new Error(error.message);
    return (data as SemanticSearchResult) ?? { verses: [], posts: [] };
  },
};
