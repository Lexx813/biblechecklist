import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  privacy: "public" | "private";
  owner_id: string;
  member_count: number;
  created_at: string;
  myRole?: "owner" | "admin" | "member";
  myStatus?: "pending" | "member";
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "member";
  joined_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  is_announcement: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: { id: string; display_name: string | null; avatar_url: string | null } | null;
  liked_by_me?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: { id: string; display_name: string | null; avatar_url: string | null } | null;
}

export interface GroupEvent {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  rsvp_count: number;
  created_at: string;
  my_rsvp?: "going" | "maybe" | "not_going" | null;
}

export interface GroupFile {
  id: string;
  group_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploader: { display_name: string | null; avatar_url: string | null } | null;
}

// ── Slug helper ───────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60)
    + "-" + Math.random().toString(36).slice(2, 7);
}

// ── Groups ────────────────────────────────────────────────────────────────────

export const groupsApi = {
  getMyGroups: async (): Promise<Group[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("group_members")
      .select("role, status, group:groups(id, name, slug, description, cover_url, privacy, owner_id, member_count, created_at)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(r => ({
      ...(r.group as unknown as Group),
      myRole: r.role as Group["myRole"],
      myStatus: r.status as Group["myStatus"],
    }));
  },

  getPublicGroups: async (): Promise<Group[]> => {
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, slug, description, cover_url, privacy, owner_id, member_count, created_at")
      .eq("privacy", "public")
      .order("member_count", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as Group[];
  },

  getGroup: async (groupId: string): Promise<Group> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, slug, description, cover_url, privacy, owner_id, member_count, created_at")
      .eq("id", groupId)
      .single();
    if (error) throw new Error(error.message);
    // Fetch my membership
    if (user) {
      const { data: mem } = await supabase
        .from("group_members")
        .select("role, status")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (mem) return { ...data as Group, myRole: mem.role as Group["myRole"], myStatus: mem.status as Group["myStatus"] };
    }
    return data as Group;
  },

  createGroup: async ({ name, description, privacy }: { name: string; description?: string; privacy: "public" | "private" }): Promise<Group> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const slug = toSlug(name);
    const { data: group, error: ge } = await supabase
      .from("groups")
      .insert({ name, slug, description: description || null, privacy, owner_id: user.id })
      .select()
      .single();
    if (ge) throw new Error(ge.message);
    // Auto-join as owner + member
    const { error: me } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "owner", status: "member" });
    if (me) throw new Error(me.message);
    return group as Group;
  },

  updateGroup: async (groupId: string, updates: Partial<Pick<Group, "name" | "description" | "cover_url" | "privacy">>): Promise<void> => {
    const { error } = await supabase.from("groups").update(updates).eq("id", groupId);
    if (error) throw new Error(error.message);
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    if (error) throw new Error(error.message);
  },

  // ── Members ────────────────────────────────────────────────────────────────

  getMembers: async (groupId: string): Promise<GroupMember[]> => {
    const { data, error } = await supabase
      .from("group_members")
      .select("id, group_id, user_id, role, status, joined_at")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    if (!data?.length) return [];
    const ids = data.map(m => m.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
    const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    return data.map(m => ({
      ...m,
      display_name: pm[m.user_id]?.display_name ?? null,
      avatar_url: pm[m.user_id]?.avatar_url ?? null,
    }));
  },

  joinGroup: async (groupId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: group } = await supabase.from("groups").select("privacy").eq("id", groupId).single();
    const status = group?.privacy === "private" ? "pending" : "member";
    const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id, role: "member", status });
    if (error) throw new Error(error.message);
  },

  leaveGroup: async (groupId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    if (error) throw new Error(error.message);
  },

  approveJoinRequest: async (memberId: string): Promise<void> => {
    const { error } = await supabase.from("group_members").update({ status: "member" }).eq("id", memberId);
    if (error) throw new Error(error.message);
  },

  denyJoinRequest: async (memberId: string): Promise<void> => {
    const { error } = await supabase.from("group_members").delete().eq("id", memberId);
    if (error) throw new Error(error.message);
  },

  removeMember: async (memberId: string): Promise<void> => {
    const { error } = await supabase.from("group_members").delete().eq("id", memberId);
    if (error) throw new Error(error.message);
  },

  updateMemberRole: async (memberId: string, role: "admin" | "member"): Promise<void> => {
    const { error } = await supabase.from("group_members").update({ role }).eq("id", memberId);
    if (error) throw new Error(error.message);
  },

  // ── Posts ──────────────────────────────────────────────────────────────────

  getPosts: async (groupId: string): Promise<GroupPost[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("group_posts")
      .select("id, group_id, author_id, content, media_urls, is_announcement, like_count, comment_count, created_at")
      .eq("group_id", groupId)
      .order("is_announcement", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    if (!data?.length) return [];

    const authorIds = [...new Set(data.map(p => p.author_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", authorIds);
    const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    // Check which posts the current user liked
    let likedSet = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from("group_post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", data.map(p => p.id));
      likedSet = new Set((likes ?? []).map(l => l.post_id));
    }

    return data.map(p => ({
      ...p,
      author: pm[p.author_id] ? { id: p.author_id, ...pm[p.author_id] } : null,
      liked_by_me: likedSet.has(p.id),
    })) as GroupPost[];
  },

  createPost: async (groupId: string, content: string, isAnnouncement = false, mediaUrls: string[] = []): Promise<GroupPost> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("group_posts")
      .insert({ group_id: groupId, author_id: user.id, content: content.trim(), is_announcement: isAnnouncement, media_urls: mediaUrls })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as GroupPost;
  },

  deletePost: async (postId: string): Promise<void> => {
    const { error } = await supabase.from("group_posts").delete().eq("id", postId);
    if (error) throw new Error(error.message);
  },

  toggleLike: async (postId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: existing } = await supabase
      .from("group_post_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("group_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("group_post_likes").insert({ post_id: postId, user_id: user.id });
      if (error) throw new Error(error.message);
    }
  },

  // ── Comments ───────────────────────────────────────────────────────────────

  getComments: async (postId: string): Promise<PostComment[]> => {
    const { data, error } = await supabase
      .from("group_post_comments")
      .select("id, post_id, author_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    if (!data?.length) return [];
    const ids = [...new Set(data.map(c => c.author_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
    const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    return data.map(c => ({
      ...c,
      author: pm[c.author_id] ? { id: c.author_id, ...pm[c.author_id] } : null,
    })) as PostComment[];
  },

  addComment: async (postId: string, content: string): Promise<PostComment> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("group_post_comments")
      .insert({ post_id: postId, author_id: user.id, content: content.trim() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as PostComment;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    const { error } = await supabase.from("group_post_comments").delete().eq("id", commentId);
    if (error) throw new Error(error.message);
  },

  // ── Events ─────────────────────────────────────────────────────────────────

  getEvents: async (groupId: string): Promise<GroupEvent[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("group_events")
      .select("id, group_id, created_by, title, description, location, starts_at, ends_at, rsvp_count, created_at")
      .eq("group_id", groupId)
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    if (!data?.length) return [];

    let rsvpMap: Record<string, string> = {};
    if (user) {
      const { data: rsvps } = await supabase
        .from("group_event_rsvps")
        .select("event_id, status")
        .eq("user_id", user.id)
        .in("event_id", data.map(e => e.id));
      rsvpMap = Object.fromEntries((rsvps ?? []).map(r => [r.event_id, r.status]));
    }

    return data.map(e => ({ ...e, my_rsvp: (rsvpMap[e.id] ?? null) as GroupEvent["my_rsvp"] }));
  },

  createEvent: async (groupId: string, event: { title: string; description?: string; location?: string; starts_at: string; ends_at?: string }): Promise<GroupEvent> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("group_events")
      .insert({ group_id: groupId, created_by: user.id, ...event, ends_at: event.ends_at || null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as GroupEvent;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    const { error } = await supabase.from("group_events").delete().eq("id", eventId);
    if (error) throw new Error(error.message);
  },

  setRsvp: async (eventId: string, status: "going" | "maybe" | "not_going"): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("group_event_rsvps")
      .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: "event_id,user_id" });
    if (error) throw new Error(error.message);
  },

  removeRsvp: async (eventId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("group_event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
    if (error) throw new Error(error.message);
  },

  // ── Files ──────────────────────────────────────────────────────────────────

  getFiles: async (groupId: string): Promise<GroupFile[]> => {
    const { data, error } = await supabase
      .from("group_files")
      .select("id, group_id, uploaded_by, file_name, storage_path, file_size, mime_type, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!data?.length) return [];
    const ids = [...new Set(data.map(f => f.uploaded_by))];
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
    const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    return data.map(f => ({ ...f, uploader: pm[f.uploaded_by] ?? null })) as GroupFile[];
  },

  uploadFile: async (groupId: string, file: File): Promise<GroupFile> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const ext = file.name.split(".").pop();
    const path = `groups/${groupId}/${crypto.randomUUID()}.${ext}`;
    const { error: ue } = await supabase.storage.from("group-files").upload(path, file);
    if (ue) throw new Error(ue.message);
    const { data, error } = await supabase
      .from("group_files")
      .insert({ group_id: groupId, uploaded_by: user.id, file_name: file.name, storage_path: path, file_size: file.size, mime_type: file.type })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as GroupFile;
  },

  deleteFile: async (fileId: string, storagePath: string): Promise<void> => {
    await supabase.storage.from("group-files").remove([storagePath]);
    const { error } = await supabase.from("group_files").delete().eq("id", fileId);
    if (error) throw new Error(error.message);
  },

  getFileUrl: (storagePath: string): string => {
    const { data } = supabase.storage.from("group-files").getPublicUrl(storagePath);
    return data.publicUrl;
  },
};
