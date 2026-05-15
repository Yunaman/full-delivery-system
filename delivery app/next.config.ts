import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
