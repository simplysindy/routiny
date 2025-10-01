import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable build cache and performance optimizations
  experimental: {
    // Enable server-side React optimizations
    optimizeServerReact: true,
  },
  // Enable Turbopack for faster builds
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  typescript: {
    // Skip type checking during build (handled separately by CI/CD)
    // Only ignore in production builds where types are pre-validated
    ignoreBuildErrors: process.env.NODE_ENV === "production",
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
