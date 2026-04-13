import { supabase } from "../lib/supabase";
import { generateVideoSlug } from "../utils/videoEmbed";
import { assertNoPII } from "../lib/pii";

export interface CreatorRequest {
  id: string;
  user_id: string;
  display_name: string;
  topic_description: string;
  sample_url: string | null;
  status: string;
  created_at: string;
  profiles?: { display_name: string | null; email: string | null; created_at: string } | null;
}

export interface VideoInput {
  title: string;
  description?: string;
  embed_url?: string;
  storage_path?: string;
  duration_sec?: number;
  thumbnail_url?: string;
  scripture_tag?: string | null;
}

export interface VideoDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  creator_id: string;
  embed_url: string | null;
  storage_path: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  likes_count: number;
  created_at: string;
  scripture_tag: string | null;
  published: boolean;
  playback_url: string | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export interface SpotlightVideo {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  creator_id: string;
  embed_url: string | null;
  storage_path: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  likes_count: number;
  is_spotlight: boolean;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export interface VideoComment {
  id: string;
  video_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export const videosApi = {
  listPublished: async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("id, slug, title, description, creator_id, embed_url, storage_path, thumbnail_url, duration_sec, likes_count, created_at, scripture_tag, profiles!creator_id(display_name, avatar_url)")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getBySlug: async (slug: string): Promise<VideoDetail | null> => {
    const { data, error } = await supabase
      .from("videos")
      .select("*, profiles!creator_id(display_name, avatar_url)")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    // Generate a 1-hour signed URL for private Storage files
    if (data.storage_path) {
      const { data: signed } = await supabase.storage
        .from("videos")
        .createSignedUrl(data.storage_path, 3600);
      return { ...data, playback_url: signed?.signedUrl ?? null } as VideoDetail;
    }
    return { ...data, playback_url: null } as VideoDetail;
  },

  create: async (userId: string, input: VideoInput) => {
    assertNoPII(input.title, input.description ?? "");
    const slug = generateVideoSlug(input.title);
    const { data, error } = await supabase
      .from("videos")
      .insert({ creator_id: userId, slug, published: true, ...input })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /** Upload a compressed video file, returns storage_path. */
  uploadFile: async (userId: string, file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "mp4";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("videos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return path;
  },

  listComments: async (videoId: string): Promise<VideoComment[]> => {
    const { data, error } = await supabase
      .from("video_comments")
      .select("*, profiles!author_id(display_name, avatar_url)")
      .eq("video_id", videoId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as VideoComment[];
  },

  createComment: async (userId: string, videoId: string, content: string): Promise<VideoComment> => {
    assertNoPII(content);
    const { data, error } = await supabase
      .from("video_comments")
      .insert({ author_id: userId, video_id: videoId, content })
      .select("*, profiles!author_id(display_name, avatar_url)")
      .single();
    if (error) throw new Error(error.message);
    return data as VideoComment;
  },

  deleteComment: async (commentId: string) => {
    const { error } = await supabase.from("video_comments").delete().eq("id", commentId);
    if (error) throw new Error(error.message);
  },

  toggleLike: async (videoId: string): Promise<{ liked: boolean; likes_count: number }> => {
    const { data, error } = await supabase.rpc("toggle_video_like", { p_video_id: videoId });
    if (error) throw new Error(error.message);
    return data as { liked: boolean; likes_count: number };
  },

  getUserLikedVideoIds: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("video_likes")
      .select("video_id")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: { video_id: string }) => r.video_id);
  },

  submitCreatorRequest: async (
    userId: string,
    req: { display_name: string; topic_description: string; sample_url?: string }
  ) => {
    const { data, error } = await supabase
      .from("creator_requests")
      .upsert({ user_id: userId, ...req, status: "pending" }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  getMyCreatorRequest: async (userId: string): Promise<CreatorRequest | null> => {
    const { data, error } = await supabase
      .from("creator_requests")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as CreatorRequest | null;
  },

  adminListCreatorRequests: async (): Promise<CreatorRequest[]> => {
    const { data, error } = await supabase
      .from("creator_requests")
      .select("*, profiles!user_id(display_name, email, created_at)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as CreatorRequest[];
  },

  adminSetCreatorApproval: async (userId: string, approved: boolean) => {
    const { error } = await supabase.rpc("admin_approve_creator", { p_user_id: userId, p_approved: approved });
    if (error) throw new Error(error.message);
  },

  adminDeleteVideo: async (videoId: string, storagePath?: string | null) => {
    if (storagePath) {
      // Best-effort — ignore storage errors (file may already be gone)
      await supabase.storage.from("videos").remove([storagePath]);
    }
    const { error } = await supabase.from("videos").delete().eq("id", videoId);
    if (error) throw new Error(error.message);
  },

  getSpotlight: async (): Promise<SpotlightVideo | null> => {
    const { data, error } = await supabase
      .from("videos")
      .select("id, slug, title, description, creator_id, embed_url, storage_path, thumbnail_url, duration_sec, likes_count, is_spotlight, created_at, profiles!creator_id(display_name, avatar_url)")
      .eq("is_spotlight", true)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as unknown as SpotlightVideo) ?? null;
  },

  adminSetSpotlight: async (videoId: string) => {
    // Clear any existing spotlight first
    const { error: clearError } = await supabase
      .from("videos")
      .update({ is_spotlight: false })
      .eq("is_spotlight", true);
    if (clearError) throw new Error(clearError.message);
    // Set the new spotlight
    const { error } = await supabase
      .from("videos")
      .update({ is_spotlight: true })
      .eq("id", videoId);
    if (error) throw new Error(error.message);
  },
};
