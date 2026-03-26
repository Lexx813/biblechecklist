import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import purgecss from 'vite-plugin-purgecss'

// Inlines the main index CSS directly into the HTML after build,
// eliminating the render-blocking CSS request from the critical path.
function inlineMainCss() {
  return {
    name: 'inline-main-css',
    enforce: 'post',
    apply: 'build',
    closeBundle: {
      order: 'post',
      async handler() {
        const fs = await import('fs');
        const path = await import('path');
        const distDir = path.resolve('dist');
        const assetsDir = path.join(distDir, 'assets');
        const htmlPath = path.join(distDir, 'index.html');

        // Find the main index CSS file
        const cssFile = fs.readdirSync(assetsDir).find(f => /^index-[^.]+\.css$/.test(f));
        if (!cssFile) return;

        const cssPath = path.join(assetsDir, cssFile);
        const css = fs.readFileSync(cssPath, 'utf8');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Replace the <link rel="stylesheet"> with an inline <style>
        const linkPattern = new RegExp(`<link rel="stylesheet" crossorigin href="/assets/${cssFile.replace(/\./g, '\\.')}">`);
        if (linkPattern.test(html)) {
          html = html.replace(linkPattern, `<style>${css}</style>`);
          fs.writeFileSync(htmlPath, html);
          fs.unlinkSync(cssPath); // Remove the now-unused CSS file
        }
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    inlineMainCss(),
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
