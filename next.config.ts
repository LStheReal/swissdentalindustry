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
  // Die öffentlichen Routen heissen seit 2026-07-29 englisch (/members statt
  // /mitglieder usw.). Die alten deutschen Slugs — und die englischen Pfade der
  // bisherigen WordPress-Seite (/en/members) — bleiben als 301 bestehen, damit
  // bestehende Links, Lesezeichen und Suchtreffer nicht ins Leere laufen.
  async redirects() {
    const slugs: [string, string][] = [
      ["mitglieder", "members"],
      ["mitglied-werden", "join"],
      ["verband", "about"],
      ["kontakt", "contact"],
      ["datenschutz", "privacy"],
      ["impressum", "legal-notice"],
    ];
    const locales = ["de", "fr", "it"];

    return slugs.flatMap(([from, to]) => [
      { source: `/${from}`, destination: `/${to}`, permanent: true },
      { source: `/${from}/:path*`, destination: `/${to}/:path*`, permanent: true },
      ...locales.flatMap((locale) => [
        { source: `/${locale}/${from}`, destination: `/${locale}/${to}`, permanent: true },
        {
          source: `/${locale}/${from}/:path*`,
          destination: `/${locale}/${to}/:path*`,
          permanent: true,
        },
      ]),
    ]);
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
