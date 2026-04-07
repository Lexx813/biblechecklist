/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pre-existing ESLint warnings exist in the codebase; don't block builds
  eslint: { ignoreDuringBuilds: true },

  // Security: remove X-Powered-By: Next.js response header
  poweredByHeader: false,

  // Gzip/Brotli compression (already on by default; explicit for clarity)
  compress: true,

  // Keep static exports working for Vercel
  trailingSlash: false,

  // Redirect junk/invalid paths back to homepage
  async redirects() {
    return [
      { source: "/$", destination: "/", permanent: true },
    ];
  },

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
    ],
  },

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
