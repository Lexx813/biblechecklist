// @ts-nocheck
import { supabase } from "../lib/supabase";

export const notesApi = {
  list: async (userId) => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  create: async (userId, note) => {
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: userId, ...note })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (noteId, updates) => {
    const { data, error } = await supabase
      .from("notes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (noteId) => {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) throw new Error(error.message);
  },
};
