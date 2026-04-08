import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "../api/subscription";
import { trackBeginCheckout } from "../lib/analytics";

/**
 * Returns the user's subscription state and a mutation to start checkout.
 *
 * isPremium — true for admins and active subscribers
 * status    — raw value from profiles.subscription_status
 * subscribe — mutation: call .mutate() to redirect to Stripe Checkout
 */
export function useSubscription(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  // All features are free — treat every user as premium.
  // Stripe infra stays dormant for future re-enable.
  const isPremium = true;
  const status = "active";

  const subscribe = useMutation({
    mutationFn: subscriptionApi.createCheckoutSession,
    onMutate: () => { trackBeginCheckout(); },
    onSuccess: (url: string) => {
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
