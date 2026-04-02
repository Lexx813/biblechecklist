import { supabase } from "../lib/supabase";

export const pushApi = {
  save: async (subscription: PushSubscription) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const json = subscription.toJSON();
    const endpoint = json.endpoint!;
    const p256dh = json.keys?.["p256dh"]!;
    const auth = json.keys?.["auth"]!;
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: user.id, endpoint, p256dh, auth },
        { onConflict: "user_id,endpoint" }
      );
    if (error) throw new Error(error.message);
  },

  remove: async (endpoint: string) => {
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
