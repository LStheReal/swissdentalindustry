import type { ApplicationPayload } from "./types";

/**
 * Baut den "Antworten"-Link einer Kontaktanfrage: ein mailto-Link mit
 * Empfänger, Betreff und der zitierten Originalnachricht.
 *
 * Eigene Datei, damit die Zusammensetzung testbar ist — an mailto-Links geht
 * still etwas kaputt (nicht kodierte Zeilenumbrüche, ein `&` im Betreff, das
 * den Body abschneidet), und im Mailclient sieht man den Fehler erst, wenn man
 * ihn abschickt.
 */

/** Zitierte Originalnachricht unter einer Anrede. */
export function buildInquiryReplyBody({
  sender,
  message,
}: {
  sender?: string | null;
  message?: string | null;
}): string {
  const name = (sender ?? "").trim();
  const greeting = name ? `Guten Tag ${name}\n\n` : "Guten Tag\n\n";
  const text = (message ?? "").trim();
  if (!text) return greeting;

  const quoted = text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `${greeting}\n\n---\nIhre Nachricht:\n${quoted}\n`;
}

/**
 * Vollständiger mailto-Link — oder `null`, wenn die Anfrage keine
 * E-Mail-Adresse enthält (dann gibt es nichts zu antworten).
 */
export function buildInquiryReplyHref(payload: ApplicationPayload): string | null {
  const email = (payload.email ?? "").trim();
  if (!email) return null;

  const subject = (payload.subject ?? "").trim();
  const sender = (payload.name ?? payload.contact_person ?? "").trim();

  const params = new URLSearchParams({
    subject: subject ? `Re: ${subject}` : "Ihre Anfrage an Swiss Dental Industry",
    body: buildInquiryReplyBody({ sender, message: payload.message }),
  });

  // URLSearchParams kodiert Leerzeichen als "+", was im mailto-Body als
  // Plus-Zeichen ankommt. Betreff und Text brauchen daher %20.
  return `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`;
}
