import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',

  // Optimasi untuk production
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ]
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ]
      }
    ]
  },

  serverExternalPackages: ["pdf-parse"],

  allowedDevOrigins: [
    "localhost:3000",
    "darialam-chatbot.0yowcn.easypanel.host"
  ],

  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "darialam-chatbot.0yowcn.easypanel.host"
      ]
    }
  }
};

export default nextConfig;