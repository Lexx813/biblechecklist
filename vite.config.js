import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import purgecss from 'vite-plugin-purgecss'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    purgecss({
      content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
      safelist: {
        // Keep dynamic classes: dark mode, data attributes, JS-toggled states
        standard: [/^dark/, /^light/, /theme/, /toast/, /active/, /open/, /show/, /hidden/, /disabled/, /loading/, /error/, /success/, /pinned/, /locked/, /solved/, /badge/, /level/],
        deep: [/data-theme/, /data-level/],
        greedy: [/ql-/, /tiptap/, /ProseMirror/],
      },
    }),
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
