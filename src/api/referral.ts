import { supabase } from "../lib/supabase";

export const referralApi = {
  getMyCode: async (userId: string) => {
    const { data, error } = await supabase.rpc("generate_referral_code", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return data;
  },

  applyReferral: async (newUserId: string, code: string) => {
    const { data, error } = await supabase.rpc("apply_referral", {
      p_new_user_id: newUserId,
      p_referral_code: code,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  getMyReferrals: async (userId: string) => {
    const { data, error } = await supabase
      .from("referrals")
      .select("id, referred_id, status, created_at, converted_at, profiles!referred_id(display_name, avatar_url)")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
