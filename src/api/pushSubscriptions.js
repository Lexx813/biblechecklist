import { supabase } from "../lib/supabase";

export const pushApi = {
  save: async (subscription) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { endpoint, keys: { p256dh, auth } } = subscription.toJSON();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: user.id, endpoint, p256dh, auth },
        { onConflict: "user_id,endpoint" }
      );
    if (error) throw new Error(error.message);
  },

  remove: async (endpoint) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
    if (error) throw new Error(error.message);
  },
};
