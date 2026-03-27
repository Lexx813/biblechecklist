import { supabase } from "../lib/supabase";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const subscriptionApi = {
  /**
   * Calls the create-checkout-session Edge Function.
   * Returns the Stripe Checkout URL; caller should redirect to it.
   */
  createCheckoutSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await fetch(`${FUNCTIONS_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error ?? `HTTP ${res.status}`);
    }

    const { url } = await res.json();
    return url;
  },

  cancelSubscription: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await fetch(`${FUNCTIONS_URL}/cancel-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error ?? `HTTP ${res.status}`);
    }

    return res.json();
  },
};
