import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   typescript: {
    ignoreBuildErrors: true, // ✅ ignore TS errors saat build
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ]
      }
    ]
  },
  serverExternalPackages: ["pdf-parse"],
  allowedDevOrigins: ["timothy-lubricate-junkman.ngrok-free.dev", "localhost:3000"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "timothy-lubricate-junkman.ngrok-free.dev"
      ]
    }
  }
};


export default nextConfig;
