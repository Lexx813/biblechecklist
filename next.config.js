import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabase auth uses the Web Locks API; React Strict Mode's intentional
  // double-mount in dev leaves orphaned locks and floods the console.
  reactStrictMode: false,

  // ESLint and TS checks gate the build. The @ts-nocheck cleanup is complete
  // and the typecheck currently passes — keep these on so a regression breaks
  // the build instead of silently shipping.
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  // Security: remove X-Powered-By: Next.js response header
  poweredByHeader: false,

  // Gzip/Brotli compression (already on by default; explicit for clarity)
  compress: true,

  // Tree-shake common heavy packages to reduce polyfill surface
  experimental: {
    optimizePackageImports: [
      "@supabase/supabase-js",
      "lucide-react",
      "date-fns",
      "@tanstack/react-query",
      "react-i18next",
      "i18next",
      "remotion",
      "@remotion/player",
    ],
  },

  // Don't try to webpack-bundle Node-only or WASM packages — load them at runtime.
  // jsdom + isomorphic-dompurify are externalized because jsdom@29 transitively
  // pulls html-encoding-sniffer@6 which `require()`s ESM-only @exodus/bytes —
  // bundling it triggers ERR_REQUIRE_ESM at runtime on Vercel. Letting Node
  // resolve them natively avoids the broken require chain.
  serverExternalPackages: [
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "isomorphic-dompurify",
    "jsdom",
  ],

  // Keep static exports working for Vercel
  trailingSlash: false,

  // Image optimization
  images: {
    // Prefer AVIF (smaller), fall back to WebP
    formats: ["image/avif", "image/webp"],
    // Cache optimised images for 1 year on the CDN
    minimumCacheTTL: 31536000,
    // Allow SVG inputs — used for song cover art in /public/covers/.
    // Sources are 100% under our control (committed to the repo); the
    // CSP below blocks any embedded scripts at render time.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Standard responsive breakpoints
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yudyhigvqaodnoqwwtns.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Turbopack (dev) needs no extra config — webpack function below is build-only
  turbopack: {},

  webpack(config) {
    // Suppress "Critical dependency" warnings from i18next-http-backend
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    return config;
  },
};

export default bundleAnalyzer(nextConfig);
