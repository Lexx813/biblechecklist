// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { Analytics } from "@vercel/analytics/react";
import { toast } from "../src/lib/toast";
import { captureUtmParams, captureReferralCode } from "../src/lib/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 30 * 1000,
      retry: 1,
    },
    mutations: {
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.silent) return;
        toast(error?.message ?? "Something went wrong", "error");
      },
    },
  },
});

const persistOptions = {
  maxAge: 1000 * 60 * 60 * 24,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      const key = query.queryKey[0];
      return ["progress", "profile", "notes", "blog", "reading"].includes(key);
    },
  },
  hydrateOptions: {
    shouldHydrateQuery: (query) => {
      const key = query.queryKey[0];
      return ["progress", "profile", "notes", "blog", "reading"].includes(key);
    },
  },
};

function SideEffects() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Capture UTM parameters and referral codes from URL
    captureUtmParams();
    captureReferralCode();

    // Register service worker in production
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").catch(() => {});
        });
      } else {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => reg.unregister());
        });
      }
    }

    // Lazy-load Sentry in production
    if (process.env.NODE_ENV === "production") {
      const initSentry = () =>
        import("@sentry/react").then(({ init, browserTracingIntegration }) =>
          init({
            dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
            environment: process.env.NODE_ENV,
            integrations: [browserTracingIntegration()],
            tracesSampleRate: 0.1,
            ignoreErrors: [
              "ResizeObserver loop limit exceeded",
              "Non-Error promise rejection captured",
              "Network request failed",
              "Failed to fetch",
              "Unable to preload CSS",
            ],
            beforeSend(event) {
              if (event.request?.url) {
                try {
                  const url = new URL(event.request.url);
                  event.request.url = url.origin + url.pathname;
                } catch {}
              }
              return event;
            },
          })
        );
      if ("requestIdleCallback" in window) {
        requestIdleCallback(initSentry);
      } else {
        setTimeout(initSentry, 1);
      }
    }

    // Defer loading query persistence — avoids adding ~40 KiB to the initial bundle.
    // Cache is restored asynchronously after mount; users see fresh data immediately.
    Promise.all([
      import("@tanstack/react-query-persist-client"),
      import("@tanstack/query-sync-storage-persister"),
    ]).then(([{ persistQueryClient }, { createSyncStoragePersister }]) => {
      const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: "nwt-query-cache-v2",
      });
      persistQueryClient({
        queryClient,
        persister,
        maxAge: persistOptions.maxAge,
        dehydrateOptions: persistOptions.dehydrateOptions,
        hydrateOptions: persistOptions.hydrateOptions,
      });
    });
  }, []);

  return null;
}

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SideEffects />
        {children}
        <Analytics />
        {process.env.NODE_ENV !== "production" && (
          <DevTools />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Lazy-load devtools so they never appear in the production bundle
function DevTools() {
  const [Tools, setTools] = useState(null);
  useEffect(() => {
    import("@tanstack/react-query-devtools").then(({ ReactQueryDevtools }) => {
      setTools(() => ReactQueryDevtools);
    });
  }, []);
  return Tools ? <Tools initialIsOpen={false} /> : null;
}
