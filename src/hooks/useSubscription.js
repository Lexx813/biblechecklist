import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFullProfile } from "./useAdmin";
import { subscriptionApi } from "../api/subscription";

/**
 * Returns the user's subscription state and a mutation to start checkout.
 *
 * isPremium — true for admins and active subscribers
 * status    — raw value from profiles.subscription_status
 * subscribe — mutation: call .mutate() to redirect to Stripe Checkout
 */
export function useSubscription(userId) {
  const queryClient = useQueryClient();
  const { data: profile } = useFullProfile(userId);

  const isPremium =
    profile?.is_admin === true ||
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  const status = profile?.subscription_status ?? "inactive";

  const subscribe = useMutation({
    mutationFn: subscriptionApi.createCheckoutSession,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const cancel = useMutation({
    mutationFn: subscriptionApi.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fullProfile", userId] });
    },
  });

  return { isPremium, status, subscribe, cancel };
}
