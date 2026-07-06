// Validiert von Nutzern stammende Website-URLs, bevor sie gespeichert oder
// als href gerendert werden. React blockiert javascript:-URLs NICHT — ohne
// diese Prüfung wäre ein gespeichertes "javascript:…" ein Stored XSS.
export function sanitizeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value) return null;

  // "firma.ch" → "https://firma.ch"
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    /* ungültig */
  }
  return null;
}
