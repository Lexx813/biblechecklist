import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

export interface Profile {
  id: string;
  email: string | null;
  is_admin: boolean | null;
  is_moderator: boolean | null;
  can_blog: boolean | null;
  is_approved_creator: boolean | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string | null;
  reading_goal_date: string | null;
  bio: string | null;
  subscription_status: string | null;
  email_notifications_blog: boolean | null;
  email_notifications_digest: boolean | null;
  email_notifications_streak: boolean | null;
  terms_accepted_at: string | null;
  show_online: boolean | null;
  referred_by: string | null;
}

export type ProfileUpdates = Partial<Omit<Profile, "id" | "created_at">>;

export interface ProfileSearchResult {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const profileApi = {
  // Own profile → SECURITY DEFINER RPC (returns the full row incl. PII like
  // email + notification prefs the settings page needs). Other users → select
  // only the public columns directly; the PII columns have their SELECT grant
  // revoked from `authenticated`, but every public column (display_name,
  // avatar_url, cover_url, bio, …) is still readable under the
  // profiles_*_read_public RLS policy.
  //
  // NOTE: get_own_profile() resolves to auth.uid() server-side, so it can ONLY
  // return the caller's own row. Calling it for someone else's id silently
  // returns the caller's profile — which previously made every /user/<id>
  // page render the logged-in user's own profile.
  get: async (userId: string): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      const { data, error } = await supabase.rpc("get_own_profile");
      if (error) throw new Error(error.message);
      if (!data) return null;
      return (Array.isArray(data) ? data[0] : data) as Profile;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, cover_url, bio, created_at, is_admin, is_moderator, can_blog, is_approved_creator, top_badge_level, reading_goal_date, show_online, last_active_at, current_streak, longest_streak, preferred_language, referred_by",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    // PII columns aren't readable for other users — surface them as null so the
    // shape still satisfies Profile (the UI only renders these when isOwner).
    return {
      ...data,
      email: null,
      subscription_status: null,
      email_notifications_blog: null,
      email_notifications_digest: null,
      email_notifications_streak: null,
      terms_accepted_at: null,
    } as Profile;
  },

  acceptTerms: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  },

  update: async (userId: string, updates: ProfileUpdates): Promise<Profile> => {
    assertNoPII(updates.bio, updates.display_name);
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  },

  searchByName: async (prefix: string): Promise<ProfileSearchResult[]> => {
    const { data, error } = await supabase.rpc("search_profiles_by_name", {
      p_prefix: (prefix ?? "").trim(),
      p_limit: 8,
    });
    if (error) return [];
    return (data ?? []) as ProfileSearchResult[];
  },

  uploadAvatar: async (userId: string, file: File): Promise<string> => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
    if (file.size > MAX_SIZE) throw new Error("Image must be under 5 MB.");
    const ext = file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "");
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

  uploadCover: async (userId: string, file: File): Promise<string> => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only JPEG, PNG, or WebP images are allowed.");
    if (file.size > MAX_SIZE) throw new Error("Image must be under 8 MB.");
    const ext = file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/cover.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const coverUrl = `${publicUrl}?t=${Date.now()}`;
    await profileApi.update(userId, { cover_url: coverUrl });
    return coverUrl;
  },
};
