import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

export const profileApi = {
  get: async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, is_admin, is_moderator, can_blog, display_name, avatar_url, created_at, reading_goal_date, bio, subscription_status, email_notifications_blog, email_notifications_digest, email_notifications_streak, terms_accepted_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  acceptTerms: async (userId) => {
    const { error } = await supabase
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  },

  update: async (userId, updates) => {
    assertNoPII(updates.bio, updates.display_name);
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  searchByName: async (prefix) => {
    const { data, error } = await supabase.rpc("search_profiles_by_name", {
      p_prefix: (prefix ?? "").trim(),
      p_limit: 8,
    });
    if (error) return [];
    return data ?? [];
  },

  uploadAvatar: async (userId, file) => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
    if (file.size > MAX_SIZE) throw new Error("Image must be under 5 MB.");
    const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    // Append timestamp to bust CDN cache on re-upload
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    await profileApi.update(userId, { avatar_url: avatarUrl });
    return avatarUrl;
  },
};
