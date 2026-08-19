import * as XLSX from "xlsx";
import { askForJson, hasAI } from "./ai";
import { emptyAddress, parseAddress, type Address } from "./address";
import {
  normalizeMemberInternalProfile,
  type MemberInternalProfileFields,
} from "./types";

type ImportFieldKey =
  | "name"
  | "address"
  | "website_url"
  | "member_number"
  | "contact_title"
  | "contact_first_name"
  | "contact_last_name"
  | "contact_job_title"
  | "street_name"
  | "street_number"
  | "postal_code"
  | "city"
  | "direct_phone"
  | "direct_email";

export interface ImportedMemberRow {
  rowNumber: number;
  name: string;
  /** Strasse / Hausnummer / PLZ / Ort — seit Migration 0013 getrennte Felder. */
  address: Address;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  internalProfile: MemberInternalProfileFields;
}

export interface ParsedMemberImport {
  rows: ImportedMemberRow[];
  headers: string[];
  mappedHeaders: Partial<Record<ImportFieldKey, string>>;
  skippedRows: string[];
  aiApplied: boolean;
}

interface AIRowEnrichment {
  name: string | null;
  website_url: string | null;
  address: string | null;
  member_number: string | null;
  contact_title: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_job_title: string | null;
  street_name: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  direct_phone: string | null;
  direct_email: string | null;
  membership_fee: string | null;
  internal_notes: string | null;
}

const IMPORT_FIELD_LABELS: Record<ImportFieldKey, string> = {
  name: "Firmenname",
  address: "Adresse",
  website_url: "Website",
  member_number: "Kontaktnummer",
  contact_title: "Anrede / Titel",
  contact_first_name: "Vorname",
  contact_last_name: "Nachname",
  contact_job_title: "Funktion",
  street_name: "Strasse",
  street_number: "Hausnummer",
  postal_code: "PLZ",
  city: "Ort",
  direct_phone: "Direkttelefon",
  direct_email: "Direkt-E-Mail",
};

const HEADER_ALIASES: Record<ImportFieldKey, string[]> = {
  name: [
    "company",
    "company name",
    "firma",
    "firmenname",
    "unternehmen",
    "member company",
    "organization",
    "organisation",
  ],
  address: ["address", "adresse", "anschrift", "full address"],
  website_url: ["website", "website url", "web", "url", "homepage"],
  member_number: ["members", "member", "member number", "mitglied", "mitgliedsnummer", "nr"],
  contact_title: ["title", "anrede", "salutation"],
  contact_first_name: ["first name", "firstname", "vorname", "given name"],
  contact_last_name: ["last name", "lastname", "surname", "nachname", "family name"],
  contact_job_title: ["job title", "position", "funktion", "role", "job", "title function"],
  street_name: ["street name", "street", "strasse", "straße", "rue", "via"],
  street_number: ["street number", "house number", "hausnummer", "nummer", "no", "nr."],
  postal_code: ["postal code", "zip", "zip code", "plz", "npa"],
  city: ["city", "ort", "town", "ville"],
  direct_phone: [
    "direct phone number",
    "phone",
    "phone number",
    "telephone",
    "telefon",
    "direct phone",
    "tel",
  ],
  direct_email: ["e-mail", "email", "mail", "direct email", "e mail"],
};

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeCell(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeCompanyName(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function scoreAliasMatch(header: string, alias: string): number {
  if (header === alias) return 100;
  if (header.startsWith(alias) || header.endsWith(alias)) return 80;
  if (header.includes(alias) || alias.includes(header)) return 60;
  return 0;
}

/**
 * Baut die strukturierte Adresse aus den Spalten der Tabelle.
 *
 * Eigene Spalten für Strasse/Nr./PLZ/Ort haben Vorrang — sie sind bereits
 * zerlegt und müssen nicht geraten werden. Nur wenn die Tabelle stattdessen
 * eine Sammelspalte "Adresse" führt, wird sie geparst; das ist derselbe
 * Parser wie überall sonst.
 */
function buildAddress(parts: {
  address: string | null;
  streetName: string | null;
  streetNumber: string | null;
  postalCode: string | null;
  city: string | null;
}): Address {
  const explicit: Address = {
    street_name: parts.streetName,
    street_number: parts.streetNumber,
    postal_code: parts.postalCode,
    city: parts.city,
  };
  if (explicit.postal_code && explicit.city) return explicit;

  if (parts.address) {
    const { address, parsed } = parseAddress(parts.address);
    if (parsed) {
      // Explizite Spalten gewinnen Feld für Feld gegen den geparsten Rest.
      return {
        street_name: explicit.street_name ?? address.street_name,
        street_number: explicit.street_number ?? address.street_number,
        postal_code: explicit.postal_code ?? address.postal_code,
        city: explicit.city ?? address.city,
      };
    }
  }

  return explicit.street_name || explicit.postal_code || explicit.city
    ? explicit
    : emptyAddress();
}

function nullable(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function rowSnapshot(cells: Map<string, string>) {
  return Object.fromEntries(
    [...cells.entries()].map(([key, value]) => [key, nullable(value)]),
  );
}

function readSpreadsheet(fileName: string, buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    dense: true,
    raw: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error(`Die Datei "${fileName}" enthält kein Tabellenblatt.`);
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  if (!rows.length) {
    throw new Error(`Die Datei "${fileName}" ist leer.`);
  }

  return rows;
}

async function inferHeadersWithAI(
  headers: string[],
): Promise<{
  mappedHeaders: Partial<Record<ImportFieldKey, string>>;
  used: boolean;
}> {
  if (!headers.length || !hasAI()) {
    return { mappedHeaders: {}, used: false };
  }

  try {
    const parsed = await askForJson<Partial<Record<ImportFieldKey, string | null>>>({
      system:
        "You map spreadsheet headers to structured company import fields. " +
        "Each key must be one of the allowed target keys. " +
        "Each value must be an original spreadsheet header or null if unclear. " +
        "Prefer semantically best matches, even across German, French, Italian, and English labels.",
      user:
        `Headers: ${JSON.stringify(headers)}\n` +
        `Allowed target keys: ${JSON.stringify(Object.keys(IMPORT_FIELD_LABELS))}\n` +
        `Field descriptions: ${JSON.stringify(IMPORT_FIELD_LABELS)}\n` +
        "Return a JSON object like {\"name\":\"Company\",\"contact_first_name\":\"First Name\"}. Use null when not confident.",
    });
    const next: Partial<Record<ImportFieldKey, string>> = {};

    for (const field of Object.keys(IMPORT_FIELD_LABELS) as ImportFieldKey[]) {
      const header = parsed[field];
      if (!header || !headers.includes(header)) continue;
      if (Object.values(next).includes(header)) continue;
      next[field] = header;
    }

    return { mappedHeaders: next, used: true };
  } catch (error) {
    console.error("inferHeadersWithAI failed:", error);
    return { mappedHeaders: {}, used: false };
  }
}

async function mapHeaders(headers: string[]): Promise<{
  mappedHeaders: Partial<Record<ImportFieldKey, string>>;
  aiApplied: boolean;
}> {
  const normalized = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));
  const aiResult = await inferHeadersWithAI(headers);
  const mapped: Partial<Record<ImportFieldKey, string>> = { ...aiResult.mappedHeaders };

  for (const field of Object.keys(HEADER_ALIASES) as ImportFieldKey[]) {
    if (mapped[field]) continue;
    let bestMatch: { header: string; score: number } | null = null;

    for (const candidate of normalized) {
      const score = Math.max(
        ...HEADER_ALIASES[field].map((alias) =>
          scoreAliasMatch(candidate.normalized, normalizeHeader(alias)),
        ),
      );

      if (!score) continue;
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { header: candidate.original, score };
      }
    }

    if (bestMatch && !Object.values(mapped).includes(bestMatch.header)) {
      mapped[field] = bestMatch.header;
    }
  }

  return { mappedHeaders: mapped, aiApplied: aiResult.used };
}

async function enrichRowWithAI(args: {
  rowNumber: number;
  cells: Map<string, string>;
  heuristic: AIRowEnrichment;
}): Promise<{
  values: AIRowEnrichment;
  used: boolean;
}> {
  if (!hasAI()) {
    return { values: args.heuristic, used: false };
  }

  try {
    const parsed = await askForJson<Partial<Record<keyof AIRowEnrichment, string | null>>>({
      system:
        "You extract structured member-company admin data from a spreadsheet row. " +
        "Clean whitespace. Keep company names exactly as written except trimming. " +
        "Split people and addresses into the requested fields when possible. " +
        "If a value is unknown, return null. Never invent facts.",
      user:
            `Spreadsheet row number: ${args.rowNumber}\n` +
            `Raw row data: ${JSON.stringify(rowSnapshot(args.cells))}\n` +
            `Heuristic extraction: ${JSON.stringify(args.heuristic)}\n` +
            "Return a JSON object with exactly these keys: " +
            JSON.stringify([
              "name",
              "website_url",
              "address",
              "member_number",
              "contact_title",
              "contact_first_name",
              "contact_last_name",
              "contact_job_title",
              "street_name",
              "street_number",
              "postal_code",
              "city",
              "direct_phone",
              "direct_email",
              "membership_fee",
              "internal_notes",
            ]) +
            ". Prefer raw spreadsheet values over heuristic guesses when they conflict.",
    });

    const values: AIRowEnrichment = {
      name: nullable(parsed.name) ?? args.heuristic.name,
      website_url: nullable(parsed.website_url) ?? args.heuristic.website_url,
      address: nullable(parsed.address) ?? args.heuristic.address,
      member_number: nullable(parsed.member_number) ?? args.heuristic.member_number,
      contact_title: nullable(parsed.contact_title) ?? args.heuristic.contact_title,
      contact_first_name:
        nullable(parsed.contact_first_name) ?? args.heuristic.contact_first_name,
      contact_last_name:
        nullable(parsed.contact_last_name) ?? args.heuristic.contact_last_name,
      contact_job_title:
        nullable(parsed.contact_job_title) ?? args.heuristic.contact_job_title,
      street_name: nullable(parsed.street_name) ?? args.heuristic.street_name,
      street_number: nullable(parsed.street_number) ?? args.heuristic.street_number,
      postal_code: nullable(parsed.postal_code) ?? args.heuristic.postal_code,
      city: nullable(parsed.city) ?? args.heuristic.city,
      direct_phone: nullable(parsed.direct_phone) ?? args.heuristic.direct_phone,
      direct_email: nullable(parsed.direct_email) ?? args.heuristic.direct_email,
      membership_fee: nullable(parsed.membership_fee) ?? args.heuristic.membership_fee,
      internal_notes: nullable(parsed.internal_notes) ?? args.heuristic.internal_notes,
    };

    return { values, used: true };
  } catch (error) {
    console.error("enrichRowWithAI failed:", error);
    return { values: args.heuristic, used: false };
  }
}

// Erlaubte Tabellen-Endungen und Grössenlimit. Grenzt die Angriffsfläche des
// (aktuell nicht patchbaren) xlsx-Parsers ein — siehe SECURITY.md.
const ALLOWED_IMPORT_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5 MB

export async function parseMemberImportSpreadsheet(file: File): Promise<ParsedMemberImport> {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_IMPORT_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Nicht unterstütztes Dateiformat "${ext}". Erlaubt: ${ALLOWED_IMPORT_EXTENSIONS.join(", ")}.`,
    );
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("Die Datei ist zu gross (max. 5 MB).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const matrix = readSpreadsheet(file.name, buffer);
  const rawHeaders = (matrix[0] ?? []).map((cell) => normalizeCell(cell));
  const headers = rawHeaders.filter(Boolean);

  if (!headers.length) {
    throw new Error("Die erste Zeile der Datei enthält keine Spaltenüberschriften.");
  }

  const { mappedHeaders, aiApplied } = await mapHeaders(headers);

  if (!mappedHeaders.name) {
    throw new Error(
      "Keine Firmen-Spalte erkannt. Erwartet wird z.B. eine Spalte wie Company, Firma oder Firmenname.",
    );
  }

  const rows: ImportedMemberRow[] = [];
  const skippedRows: string[] = [];
  let rowAiApplied = false;

  for (let index = 1; index < matrix.length; index += 1) {
    const values = matrix[index] ?? [];
    const rowNumber = index + 1;
    const cells = new Map<string, string>();

    rawHeaders.forEach((header, columnIndex) => {
      if (!header) return;
      cells.set(header, normalizeCell(values[columnIndex]));
    });

    const allValues = [...cells.values()];
    if (!allValues.some(Boolean)) continue;

    const read = (field: ImportFieldKey) => {
      const header = mappedHeaders[field];
      return header ? cells.get(header) || "" : "";
    };

    const heuristic: AIRowEnrichment = {
      name: nullable(read("name")),
      website_url: nullable(read("website_url")),
      address: nullable(read("address")),
      member_number: nullable(read("member_number")),
      contact_title: nullable(read("contact_title")),
      contact_first_name: nullable(read("contact_first_name")),
      contact_last_name: nullable(read("contact_last_name")),
      contact_job_title: nullable(read("contact_job_title")),
      street_name: nullable(read("street_name")),
      street_number: nullable(read("street_number")),
      postal_code: nullable(read("postal_code")),
      city: nullable(read("city")),
      direct_phone: nullable(read("direct_phone")),
      direct_email: nullable(read("direct_email")),
      membership_fee: null,
      internal_notes: `Importiert aus Spreadsheet, Zeile ${rowNumber}.`,
    };

    const enrichment = await enrichRowWithAI({
      rowNumber,
      cells,
      heuristic,
    });
    if (enrichment.used) {
      rowAiApplied = true;
    }

    const name = enrichment.values.name ?? heuristic.name ?? null;
    if (!name) {
      skippedRows.push(`Zeile ${rowNumber}: Firmenname fehlt.`);
      continue;
    }

    const directEmail = enrichment.values.direct_email;
    const directPhone = enrichment.values.direct_phone;
    const websiteUrl = enrichment.values.website_url;
    const address = buildAddress({
      address: enrichment.values.address,
      streetName: enrichment.values.street_name,
      streetNumber: enrichment.values.street_number,
      postalCode: enrichment.values.postal_code,
      city: enrichment.values.city,
    });

    rows.push({
      rowNumber,
      name,
      address,
      email: directEmail,
      phone: directPhone,
      websiteUrl,
      internalProfile: normalizeMemberInternalProfile({
        member_number: enrichment.values.member_number,
        contact_title: enrichment.values.contact_title,
        contact_first_name: enrichment.values.contact_first_name,
        contact_last_name: enrichment.values.contact_last_name,
        contact_job_title: enrichment.values.contact_job_title,
        street_name: enrichment.values.street_name,
        street_number: enrichment.values.street_number,
        postal_code: enrichment.values.postal_code,
        city: enrichment.values.city,
        direct_phone: directPhone,
        direct_email: directEmail,
        membership_fee: enrichment.values.membership_fee,
        internal_notes: enrichment.values.internal_notes,
      }),
    });
  }

  return {
    rows,
    headers,
    mappedHeaders,
    skippedRows,
    aiApplied: aiApplied || rowAiApplied,
  };
}

export function getImportedMemberKey(name: string): string {
  return normalizeCompanyName(name);
}
