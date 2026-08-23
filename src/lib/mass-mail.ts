// Serienmail an die Mitgliedsfirmen.
//
// Platzhalter werden je Empfänger ersetzt. Bewusst eine kleine, feste Liste
// statt einer Template-Sprache: was hier steht, muss für jede Firma auflösbar
// sein, sonst steht am Ende in einer Mail "{{vorname}}".

import { escapeHtml } from "./email-templates";

export const MASS_MAIL_PLACEHOLDERS = [
  "first_name",
  "last_name",
  "company",
  "edit_link",
] as const;

export type MassMailPlaceholder = (typeof MASS_MAIL_PLACEHOLDERS)[number];

export const PLACEHOLDER_LABELS: Record<MassMailPlaceholder, string> = {
  first_name: "Vorname",
  last_name: "Nachname",
  company: "Firmenname",
  edit_link: "Bearbeitungs-Link",
};

export interface MassMailRecipient {
  memberId: string;
  company: string;
  email: string;
  firstName: string;
  lastName: string;
  editUrl: string;
}

/** Wie ein Platzhalter im Text geschrieben wird. */
export function placeholderToken(key: MassMailPlaceholder): string {
  return `{{${key}}}`;
}

function valueFor(recipient: MassMailRecipient, key: MassMailPlaceholder): string {
  switch (key) {
    case "first_name":
      return recipient.firstName;
    case "last_name":
      return recipient.lastName;
    case "company":
      return recipient.company;
    case "edit_link":
      return recipient.editUrl;
  }
}

/**
 * Ersetzt die Platzhalter für einen Empfänger.
 *
 * Unbekannte `{{…}}` bleiben absichtlich stehen: sie im Stillen zu löschen
 * würde einen Tippfehler im Text unsichtbar machen, und die Vorschau soll ihn
 * zeigen.
 */
export function renderMassMailText(template: string, recipient: MassMailRecipient): string {
  let out = template;
  for (const key of MASS_MAIL_PLACEHOLDERS) {
    out = out.split(placeholderToken(key)).join(valueFor(recipient, key));
  }
  return out;
}

/** Dieselbe Ersetzung, aber HTML-sicher — für die HTML-Fassung der Mail. */
export function renderMassMailHtml(template: string, recipient: MassMailRecipient): string {
  let out = escapeHtml(template);
  for (const key of MASS_MAIL_PLACEHOLDERS) {
    const value =
      key === "edit_link"
        ? `<a href="${escapeHtml(recipient.editUrl)}" style="color:#e1000f;font-weight:600;">${escapeHtml(recipient.editUrl)}</a>`
        : escapeHtml(valueFor(recipient, key));
    out = out.split(escapeHtml(placeholderToken(key))).join(value);
  }
  return out.replace(/\r?\n/g, "<br>");
}

/** Platzhalter, die im Text stehen, aber keine sind — für die Warnung in der Vorschau. */
export function unknownPlaceholders(template: string): string[] {
  const found = template.match(/\{\{\s*[\w.-]+\s*\}\}/g) ?? [];
  const known = new Set(MASS_MAIL_PLACEHOLDERS.map(placeholderToken));
  return [...new Set(found.filter((token) => !known.has(token)))];
}

/** Empfänger, bei denen ein Platzhalter leer bliebe. */
export function recipientsWithGaps(
  template: string,
  recipients: MassMailRecipient[],
): { recipient: MassMailRecipient; missing: MassMailPlaceholder[] }[] {
  const used = MASS_MAIL_PLACEHOLDERS.filter((key) =>
    template.includes(placeholderToken(key)),
  );
  return recipients
    .map((recipient) => ({
      recipient,
      missing: used.filter((key) => !valueFor(recipient, key).trim()),
    }))
    .filter((entry) => entry.missing.length > 0);
}
