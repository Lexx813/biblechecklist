import { supabase } from "../lib/supabase";

export const reportsApi = {
  submit: async (reporterId, contentType, contentId, contentPreview, reason) => {
    const { error } = await supabase
      .from("content_reports")
      .insert({ reporter_id: reporterId, content_type: contentType, content_id: contentId, content_preview: contentPreview, reason });
    if (error) throw new Error(error.message);
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from("content_reports")
      .select("*, profiles!reporter_id(display_name, email)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  updateStatus: async (reportId, status) => {
    const { error } = await supabase
      .from("content_reports")
      .update({ status })
      .eq("id", reportId);
    if (error) throw new Error(error.message);
  },

  delete: async (reportId) => {
    const { error } = await supabase.from("content_reports").delete().eq("id", reportId);
    if (error) throw new Error(error.message);
  },
};
