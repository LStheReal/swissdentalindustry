// Eine einzige Quelle für die absolute Basis-URL der Website.
// Produktions-Fallback (nie localhost): falsch konfigurierte Deployments
// erzeugen sonst kaputte Links in Sitemap, Metadata und E-Mails.
export function getSiteUrl(): string {
  // Beide Namen akzeptieren: der Rest der App (E-Mails, Edit-Links) liest
  // NEXT_PUBLIC_APP_URL, hier stand bisher nur NEXT_PUBLIC_SITE_URL. Folge:
  // auf Vercel fiel diese Funktion auf VERCEL_URL zurück — und das ist die
  // Hostname pro Deployment, ändert sich also bei jedem Deploy. Für den
  // Passwort-Reset war der redirectTo damit nie identisch mit dem, was in
  // Supabase freigegeben ist.
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://swissdentalindustry.ch";
}
