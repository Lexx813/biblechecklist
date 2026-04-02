import { supabase } from "../lib/supabase";

type ContentType = "thread" | "reply" | "post" | "comment";

export const reportsApi = {
  submit: async (reporterId: string, contentType: string, contentId: string, contentPreview: string, reason: string) => {
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

  updateStatus: async (reportId: string, status: string) => {
    const { error } = await supabase
      .from("content_reports")
      .update({ status })
      .eq("id", reportId);
    if (error) throw new Error(error.message);
  },

  delete: async (reportId: string) => {
    const { error } = await supabase.from("content_reports").delete().eq("id", reportId);
    if (error) throw new Error(error.message);
  },

  deleteContent: async (contentType: ContentType, contentId: string) => {
    const tableMap: Record<ContentType, string> = {
      thread:   "forum_threads",
      reply:    "forum_replies",
      post:     "blog_posts",
      comment:  "blog_comments",
    };
    const table = tableMap[contentType];
    if (!table) throw new Error(`Unknown content type: ${contentType}`);
    const { error } = await supabase.from(table).delete().eq("id", contentId);
    if (error) throw new Error(error.message);
  },
};
