"use client";

import "../src/i18n";
import { useState, useEffect, useRef } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { Analytics } from "@vercel/analytics/react";
import { toast } from "../src/lib/toast";

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

// Stable no-op persister used during SSR and before hydration so both passes
// render the same JSX structure — avoids React hydration mismatch.
const noOpPersister = {
  persistClient: () => {},
  restoreClient: async () => undefined,
  removeClient: () => {},
};

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
  }, []);

  return null;
}

export default function Providers({ children }) {
  // Start with noOpPersister so server and initial client render match.
  // Swap to real localStorage persister after mount.
  const [persister, setPersister] = useState(noOpPersister);

  useEffect(() => {
    setPersister(
      createSyncStoragePersister({
        storage: window.localStorage,
        key: "nwt-query-cache-v2",
      })
    );
  }, []);

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ ...persistOptions, persister }}
      >
        <SideEffects />
        {children}
        <Analytics />
        {process.env.NODE_ENV !== "production" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
