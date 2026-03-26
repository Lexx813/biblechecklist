import { supabase } from "../lib/supabase";

export const studyNotesApi = {
  getMyNotes: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("study_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createNote: async (note) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("study_notes")
      .insert({ ...note, user_id: user.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateNote: async (noteId, updates) => {
    const { data, error } = await supabase
      .from("study_notes")
      .update(updates)
      .eq("id", noteId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteNote: async (noteId) => {
    const { error } = await supabase
      .from("study_notes")
      .delete()
      .eq("id", noteId);
    if (error) throw new Error(error.message);
  },
};
