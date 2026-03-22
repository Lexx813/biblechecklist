import { supabase } from "../lib/supabase";

export const profileApi = {
  get: async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, is_admin, display_name, avatar_url, created_at")
      .eq("id", userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (userId, updates) => {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  uploadAvatar: async (userId, file) => {
    const ext = file.name.split(".").pop();
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
