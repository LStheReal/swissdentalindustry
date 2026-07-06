// Eine einzige Quelle für die absolute Basis-URL der Website.
// Produktions-Fallback (nie localhost): falsch konfigurierte Deployments
// erzeugen sonst kaputte Links in Sitemap, Metadata und E-Mails.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://swissdentalindustry.ch";
}
