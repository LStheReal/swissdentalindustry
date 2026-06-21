import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace-Root explizit setzen (es gibt mehrere Lockfiles im Home-Verzeichnis).
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
