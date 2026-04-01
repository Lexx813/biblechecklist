/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pre-existing ESLint warnings exist in the codebase; don't block builds
  eslint: { ignoreDuringBuilds: true },

  // Keep static exports working for Vercel
  trailingSlash: false,

  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yudyhigvqaodnoqwwtns.supabase.co",
      },
    ],
  },

  // Suppress the "Critical dependency: the request of a dependency is an expression" warning
  // from i18next-http-backend and other dynamic-require libs
  webpack(config) {
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
