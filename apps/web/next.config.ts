import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: ["@meme-foundry/db", "@meme-foundry/ui"]
};

export default nextConfig;
