import "./i18n";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import App from './App.jsx'

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // keep cache 24 hours for offline use
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "nwt-query-cache",
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
        }}
      >
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
