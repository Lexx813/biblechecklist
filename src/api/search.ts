import { supabase } from "../lib/supabase";

export interface SearchPost { id: string; slug: string; title: string; excerpt?: string | null }
export interface SearchThread { id: string; category_id: string | null; title: string }
export interface SearchUser { id: string; display_name: string | null; avatar_url: string | null }
export interface SearchVerse { id: string; book_name: string; book_theme: string; verse_ref: string; verse_text: string }

interface SearchResult {
  posts: SearchPost[];
  threads: SearchThread[];
  users?: SearchUser[];
}

interface SemanticSearchResult {
  verses: SearchVerse[];
  posts: SearchPost[];
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
