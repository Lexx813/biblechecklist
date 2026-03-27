import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import purgecss from 'vite-plugin-purgecss'

// ── Dev-only middleware for /api/ai-explain (mirrors the Vercel edge function) ─

function devApiPlugin(env) {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/ai-explain', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405); res.end('Method Not Allowed'); return;
        }

        // Read body
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        let passage = '', question = '';
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString());
          passage  = String(body.passage  ?? '').slice(0, 600);
          question = String(body.question ?? '').slice(0, 300);
        } catch { res.writeHead(400); res.end('Bad Request'); return; }

        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Add ANTHROPIC_API_KEY to your .env file' })); return;
        }

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 700,
            stream: true,
            system: 'You are a thoughtful Bible study companion. When given a scripture passage and a question, provide a clear, concise explanation (under 400 words) drawing from historical context, original language insights where helpful, and practical application. Be warm and accurate.',
            messages: [{ role: 'user', content: `Scripture passage:\n"${passage}"\n\nQuestion: ${question}` }],
          }),
        });

        if (!claudeRes.ok) {
          res.writeHead(502); res.end('AI service error'); return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
        });

        for await (const chunk of claudeRes.body) res.write(chunk);
        res.end();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [
    devApiPlugin(env),
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
  };
})
