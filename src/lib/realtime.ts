import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Wrap `channel.subscribe()` with status logging + Sentry breadcrumb so
 * realtime dropouts (CHANNEL_ERROR / TIMED_OUT / CLOSED) are visible in
 * production instead of silently freezing live UIs (DMs, notifications,
 * trivia, forum).
 *
 * Usage:
 *   const channel = supabase.channel("messages")
 *     .on("postgres_changes", ..., handler);
 *   subscribeWithMonitor(channel, "messages");
 *   return () => supabase.removeChannel(channel);
 *
 * Optional `onStatus` callback lets a hook trigger a reconnect or toast.
 */

type Status = "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED";

export function subscribeWithMonitor(
  channel: RealtimeChannel,
  name: string,
  onStatus?: (status: Status, err?: Error) => void,
): RealtimeChannel {
  return channel.subscribe((status, err) => {
    onStatus?.(status as Status, err);

    // SUBSCRIBED is the happy path — log only on degradation.
    if (status === "SUBSCRIBED") return;

    // eslint-disable-next-line no-console
    console.warn(`[realtime] ${name}: ${status}`, err?.message ?? "");

    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;

    // Lazy Sentry breadcrumb — never block on missing SDK.
    import("@sentry/react")
      .then(({ addBreadcrumb }) =>
        addBreadcrumb?.({
          category: "realtime",
          level: status === "CLOSED" ? "info" : "warning",
          message: `${name}: ${status}`,
          data: { error: err?.message },
        }),
      )
      .catch(() => {});
  });
}
