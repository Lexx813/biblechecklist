import { supabase } from "../lib/supabase";
import type { Database } from "../types/supabase";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type NoteInsert = Omit<Database["public"]["Tables"]["notes"]["Insert"], "user_id">;
type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];

export const notesApi = {
  list: async (userId: string): Promise<NoteRow[]> => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  create: async (userId: string, note: NoteInsert): Promise<NoteRow> => {
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: userId, ...note })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (noteId: string, updates: NoteUpdate): Promise<NoteRow> => {
    const { data, error } = await supabase
      .from("notes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (noteId: string): Promise<void> => {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) throw new Error(error.message);
  },
};
