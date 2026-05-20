import { supabase } from "../lib/supabase";

type ContentType = "thread" | "reply" | "post" | "comment";

export interface ContentReportRow {
  id: string;
  reporter_id: string | null;
  content_type: ContentType | string;
  content_id: string;
  content_preview: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  profiles: { display_name: string | null; email: string | null } | null;
}

export const reportsApi = {
  submit: async (reporterId: string, contentType: string, contentId: string, contentPreview: string, reason: string) => {
    const { error } = await supabase
      .from("content_reports")
      .insert({ reporter_id: reporterId, content_type: contentType, content_id: contentId, content_preview: contentPreview, reason });
    if (error) throw new Error(error.message);
  },

  getAll: async (): Promise<ContentReportRow[]> => {
    const { data, error } = await supabase
      .from("content_reports")
      .select("*, profiles!reporter_id(display_name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    type Joined = Omit<ContentReportRow, "profiles"> & { profiles: { display_name: string | null } | null };
    const rows = (data ?? []) as unknown as Joined[];
    const ids = rows.map(r => r.reporter_id).filter((v): v is string => !!v);
    if (ids.length === 0) return rows.map(r => ({ ...r, profiles: r.profiles ? { ...r.profiles, email: null } : null }));
    // Email column is REVOKE'd from authenticated SELECT; enrich via admin RPC.
    const { data: emails } = await supabase.rpc("admin_get_user_emails", { p_user_ids: ids });
    const emailMap = new Map(((emails ?? []) as Array<{ id: string; email: string | null }>).map(e => [e.id, e.email]));
    return rows.map(r => ({
      ...r,
      profiles: {
        display_name: r.profiles?.display_name ?? null,
        email: r.reporter_id ? (emailMap.get(r.reporter_id) ?? null) : null,
      },
    }));
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
