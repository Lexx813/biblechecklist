/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabase auth uses the Web Locks API; React Strict Mode's intentional
  // double-mount in dev leaves orphaned locks and floods the console.
  reactStrictMode: false,

  // Pre-existing ESLint warnings exist in the codebase; don't block builds
  eslint: { ignoreDuringBuilds: true },

  // Skip TS type-checking during build (136 files carry @ts-nocheck; typecheck runs separately)
  typescript: { ignoreBuildErrors: true },

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

  // Don't try to webpack-bundle Node-only or WASM packages — load them at runtime
  serverExternalPackages: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],

  // Keep static exports working for Vercel
  trailingSlash: false,

  // Image optimization
  images: {
    // Prefer AVIF (smaller), fall back to WebP
    formats: ["image/avif", "image/webp"],
    // Cache optimised images for 1 year on the CDN
    minimumCacheTTL: 31536000,
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

  webpack(config, { isServer }) {
    // Suppress "Critical dependency" warnings from i18next-http-backend
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    // Bundle analyser: ANALYZE=true npm run build
    if (process.env.ANALYZE === "true") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: isServer
            ? "../analyze/server.html"
            : "../analyze/client.html",
          openAnalyzer: false,
        })
      );
    }

    return config;
  },
};

export default nextConfig;
