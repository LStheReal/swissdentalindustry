// Einfaches In-Memory-Rate-Limit (Sliding Window) für die öffentlichen
// Formular-Endpunkte. Pro Prozess-Instanz — bei mehreren Serverless-Instanzen
// ist das Limit entsprechend weicher, hält aber einfache Fluten trotzdem auf.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);

  // Gelegentliches Aufräumen, damit die Map nicht unbegrenzt wächst.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
