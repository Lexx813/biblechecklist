import "./i18n";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import App from './App.jsx'
import { Analytics } from "@vercel/analytics/react"
import { toast } from './lib/toast'

// ── Sentry error monitoring ───────────────────────────────────────────────────
// Loaded lazily after app mounts so it doesn't block first paint.
if (import.meta.env.PROD) {
  const initSentry = () =>
    import("@sentry/react").then(({ init, browserTracingIntegration }) =>
      init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
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

// When a new deploy invalidates old chunk hashes, reload once to get fresh assets
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  } else {
    // In dev, unregister any stale service workers so they don't serve cached source files
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // keep cache 24 hours for offline use
      staleTime: 30 * 1000,         // don't re-fetch within 30 s
      retry: 1,                     // one automatic retry on failure
    },
    mutations: {
      // Mutations can set meta.silent = true to suppress the global toast
      // (e.g. auth forms that display inline errors instead)
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.silent) return;
        toast(error?.message ?? "Something went wrong", "error");
      },
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "nwt-query-cache-v2",
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              const key = query.queryKey[0];
              // Persist app data but not auth session (security)
              return ["progress", "profile", "notes", "blog", "reading"].includes(key);
            },
          },
          hydrateOptions: {
            shouldHydrateQuery: (query) => {
              const key = query.queryKey[0];
              // Mirror the dehydrate allowlist so old cache entries for other
              // keys (e.g. feature-flags) are never restored and don't
              // appear as stale before their observer attaches
              return ["progress", "profile", "notes", "blog", "reading"].includes(key);
            },
          },
        }}
      >
        <App />
<Analytics />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
