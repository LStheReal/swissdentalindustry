import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace-Root explizit setzen (es gibt mehrere Lockfiles im Home-Verzeichnis).
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Clickjacking-Schutz (Admin-Login/Portal darf nicht framebar sein).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Verhindert u. a., dass /edit/[token]-Pfade an fremde Ziele leaken.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
