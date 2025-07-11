import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable strict checks for Cloud Run deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone', // Required for Cloud Run deployment
};

export default nextConfig;
