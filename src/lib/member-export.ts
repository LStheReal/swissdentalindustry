// Export der Mitglieder und ihrer Kontakte als Tabelle.
//
// Eine Zeile je Kontakt, die Firmenangaben wiederholt. Das ist die Form, in
// der eine Tabelle tatsächlich benutzt wird — Serienbrief, Rechnungslauf,
// Filtern nach Kanton. Eine Zeile je Firma mit Kontakten in einer Zelle wäre
// kompakter und für nichts davon zu gebrauchen.

import { formatAddress } from "./address";
import { listCompanyInternal } from "./member-company-internal";
import { listContactPersonsByMember, type ContactPerson } from "./member-internal-profiles";
import type { createAdminClient } from "./supabase/admin";
import { CONTACT_ROLE_LABELS, type ContactRole, type Member } from "./types";

type Client = ReturnType<typeof createAdminClient>;

export const EXPORT_FILTERS = ["main", "billing", "all"] as const;
export type ExportFilter = (typeof EXPORT_FILTERS)[number];

/** Deutsch — für den HTTP-Header des Downloads. Die Seite übersetzt selbst. */
export const EXPORT_FILTER_LABELS: Record<ExportFilter, string> = {
  main: "Nur Hauptkontakte",
  billing: "Nur Rechnungskontakte",
  all: "Alle Kontakte",
};

export function isExportFilter(value: unknown): value is ExportFilter {
  return typeof value === "string" && (EXPORT_FILTERS as readonly string[]).includes(value);
}

/** Spaltenüberschriften in fester Reihenfolge — die Tabelle soll stabil bleiben. */
export const EXPORT_COLUMNS = [
  "Firma",
  "Status",
  "Strasse",
  "Hausnummer",
  "PLZ",
  "Ort",
  "Kanton",
  "Firmen-E-Mail",
  "Firmen-Telefon",
  "Website",
  "Mitarbeiterzahl",
  "Mitgliederbeitrag",
  "Mitglied seit",
  "Interne Notizen",
  "Kontakt-Rollen",
  "Kontaktnummer",
  "Anrede / Titel",
  "Vorname",
  "Nachname",
  "Funktion",
  "Direkt-E-Mail",
  "Direkttelefon",
  "Kontakt Strasse",
  "Kontakt Hausnummer",
  "Kontakt PLZ",
  "Kontakt Ort",
] as const;

export type ExportRow = Record<(typeof EXPORT_COLUMNS)[number], string | number | null>;

function roleLabels(roles: ContactRole[]): string {
  return roles.map((role) => CONTACT_ROLE_LABELS[role].de).join(", ");
}

/**
 * Baut die Zeilen für den Export.
 *
 * Firmen ohne passenden Kontakt fallen NICHT heraus: sie erscheinen mit
 * leeren Kontaktspalten. Eine Mitgliederliste, in der Firmen fehlen, weil
 * niemand einen Rechnungskontakt gepflegt hat, wäre stillschweigend falsch.
 */
export async function buildExportRows(
  supabase: Client,
  filter: ExportFilter,
): Promise<ExportRow[]> {
  return (await buildExportRowsForFilters(supabase, [filter]))[filter];
}

/**
 * Mehrere Filter aus einem einzigen Datenstand — für die Exportseite, die alle
 * drei Zeilenzahlen zeigt. Drei Abfragen insgesamt, unabhängig von der Zahl
 * der Firmen und Filter.
 */
export async function buildExportRowsForFilters<F extends ExportFilter>(
  supabase: Client,
  filters: readonly F[],
): Promise<Record<F, ExportRow[]>> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);

  const members = (data ?? []) as Member[];
  const ids = members.map((m) => m.id);
  const [internal, contactsByMember] = await Promise.all([
    listCompanyInternal(supabase, ids),
    listContactPersonsByMember(supabase, ids),
  ]);

  return Object.fromEntries(
    filters.map((filter) => [filter, rowsFor(members, internal, contactsByMember, filter)]),
  ) as Record<F, ExportRow[]>;
}

function rowsFor(
  members: Member[],
  internal: Awaited<ReturnType<typeof listCompanyInternal>>,
  contactsByMember: Map<string, ContactPerson[]>,
  filter: ExportFilter,
): ExportRow[] {
  const rows: ExportRow[] = [];

  for (const member of members) {
    const company = internal.get(member.id) ?? {
      employee_count: null,
      membership_fee: null,
      internal_notes: null,
    };

    const companyCells = {
      Firma: member.name,
      Status: member.status === "published" ? "Publiziert" : "Entwurf",
      Strasse: member.street_name,
      Hausnummer: member.street_number,
      PLZ: member.postal_code,
      Ort: member.city,
      Kanton: member.canton,
      "Firmen-E-Mail": member.email,
      "Firmen-Telefon": member.phone,
      Website: member.website_url,
      Mitarbeiterzahl: company.employee_count,
      Mitgliederbeitrag: company.membership_fee,
      "Mitglied seit": member.member_since,
      "Interne Notizen": company.internal_notes,
    };

    const allContacts = contactsByMember.get(member.id) ?? [];
    const contacts =
      filter === "all"
        ? allContacts
        : allContacts.filter((c) => c.roles.includes(filter));

    if (contacts.length === 0) {
      rows.push({
        ...companyCells,
        "Kontakt-Rollen": null,
        Kontaktnummer: null,
        "Anrede / Titel": null,
        Vorname: null,
        Nachname: null,
        Funktion: null,
        "Direkt-E-Mail": null,
        Direkttelefon: null,
        "Kontakt Strasse": null,
        "Kontakt Hausnummer": null,
        "Kontakt PLZ": null,
        "Kontakt Ort": null,
      } as ExportRow);
      continue;
    }

    for (const contact of contacts) {
      rows.push({
        ...companyCells,
        "Kontakt-Rollen": roleLabels(contact.roles),
        Kontaktnummer: contact.member_number,
        "Anrede / Titel": contact.contact_title,
        Vorname: contact.contact_first_name,
        Nachname: contact.contact_last_name,
        Funktion: contact.contact_job_title,
        "Direkt-E-Mail": contact.direct_email,
        Direkttelefon: contact.direct_phone,
        "Kontakt Strasse": contact.street_name,
        "Kontakt Hausnummer": contact.street_number,
        "Kontakt PLZ": contact.postal_code,
        "Kontakt Ort": contact.city,
      } as ExportRow);
    }
  }

  return rows;
}

/** Nur für die Anzeige im Admin — wie viele Zeilen der Export hätte. */
export function summarise(rows: ExportRow[]): { rows: number; companies: number } {
  return {
    rows: rows.length,
    companies: new Set(rows.map((r) => r.Firma)).size,
  };
}

export { formatAddress };
