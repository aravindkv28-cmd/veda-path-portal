// next.config.js (or .ts / .mjs)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. This line fixes the 'serverComponentsExternalPackages' warning
  serverExternalPackages: ['@xenova/transformers'],

  // 2. This line fixes the 'Turbopack' error
  turbopack: {},

  // 3. This IS THE CRITICAL PART for your AI model to work
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;