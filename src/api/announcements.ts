import { supabase } from "../lib/supabase";

export const announcementsApi = {
  getActive: async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  create: async (authorId: string, message: string, type: string) => {
    const { data, error } = await supabase
      .from("announcements")
      .insert({ author_id: authorId, message, type })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  toggle: async (id: string, active: boolean) => {
    const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
    if (error) throw new Error(error.message);
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
