import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("@tanstack/")) {
            return "vendor-query";
          }
          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "vendor-i18n";
          }
          if (id.includes("@supabase/")) {
            return "vendor-supabase";
          }
        },
      },
    },
  },
})
