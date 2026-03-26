import "@fontsource-variable/plus-jakarta-sans";
import "./i18n";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import App from './App.jsx'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import { toast } from './lib/toast'

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
        <SpeedInsights />
        <Analytics />
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
