// @ts-nocheck
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

  getPublicNotes: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("study_notes")
      .select("id, title, content, tags, book_index, chapter, verse, updated_at, user_id, like_count")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    if (!data?.length) return [];
    const userIds = [...new Set(data.map(n => n.user_id))];
    const [{ data: profiles }, { data: likedIds }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
      user ? supabase.rpc("get_user_note_likes", { p_user_id: user.id }) : { data: [] },
    ]);
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    const likedSet = new Set(likedIds ?? []);
    return data.map(n => ({ ...n, author: profileMap[n.user_id] ?? null, user_has_liked: likedSet.has(n.id) }));
  },

  toggleLike: async (noteId) => {
    const { data, error } = await supabase.rpc("toggle_study_note_like", { p_note_id: noteId });
    if (error) throw new Error(error.message);
    return data;
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

  // ── Folders ───────────────────────────────────────────────────────────────

  getFolders: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("note_folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createFolder: async (name) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("note_folders")
      .insert({ user_id: user.id, name: name.trim() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  renameFolder: async (folderId, name) => {
    const { error } = await supabase
      .from("note_folders")
      .update({ name: name.trim() })
      .eq("id", folderId);
    if (error) throw new Error(error.message);
  },

  deleteFolder: async (folderId) => {
    const { error } = await supabase
      .from("note_folders")
      .delete()
      .eq("id", folderId);
    if (error) throw new Error(error.message);
  },
};
