import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  allowedDevOrigins: ["192.168.50.209"],
  transpilePackages: [
    "@meme-foundry/db",
    "@meme-foundry/ui",
    "@meme-foundry/game-engine"
  ]
};

export default nextConfig;
