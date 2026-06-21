import {
  MEMBER_INTERNAL_PROFILE_KEYS,
  MEMBER_INTERNAL_PROFILE_LABELS,
  normalizeMemberInternalProfile,
  type Member,
  type MemberEditableFields,
  type MemberInternalProfileFields,
  type Multilingual,
} from "./types";

export type WordOp = { text: string; type: "same" | "added" | "removed" };

export function wordDiff(before: string, after: string): WordOp[] {
  const a = before.split(/\s+/).filter((w) => w.length > 0);
  const b = after.split(/\s+/).filter((w) => w.length > 0);
  const m = a.length;
  const n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] =
        a[i] === b[j]
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const ops: WordOp[] = [];
  let i = 0,
    j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && a[i] === b[j]) {
      ops.push({ text: a[i], type: "same" });
      i++;
      j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      ops.push({ text: b[j], type: "added" });
      j++;
    } else {
      ops.push({ text: a[i], type: "removed" });
      i++;
    }
  }
  return ops;
}

export interface FieldDiff {
  field: keyof MemberEditableFields | string;
  label: string;
  // Für mehrsprachige Felder: pro Sprache alt/neu; sonst einfacher String.
  kind: "text" | "image" | "multilingual";
  before: string | Multilingual | null;
  after: string | Multilingual | null;
}

const FIELD_LABELS: Record<keyof MemberEditableFields, string> = {
  logo_url: "Logo",
  description: "Beschreibung",
  address: "Adresse",
  phone: "Telefon",
  email: "E-Mail",
  website_url: "Website",
  internal_profile: "Interne Mitgliedsdaten",
};

const MULTILINGUAL_FIELDS = new Set<keyof MemberEditableFields>(["description"]);
const IMAGE_FIELDS = new Set<keyof MemberEditableFields>(["logo_url"]);

function isMultilingual(v: unknown): v is Multilingual {
  return !!v && typeof v === "object";
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Vergleicht den Live-Stand eines Mitglieds mit den vorgeschlagenen Feldern und
 * liefert nur die tatsächlich geänderten Felder zurück — für die Anzeige
 * "aktuell ↔ vorgeschlagen" im Review-Feed.
 */
export function diffMemberChange(
  current: Member & { internal_profile?: MemberInternalProfileFields | null },
  proposed: Partial<MemberEditableFields>,
): FieldDiff[] {
  const diffs: FieldDiff[] = [];

  for (const key of Object.keys(proposed) as (keyof MemberEditableFields)[]) {
    const after = proposed[key];
    if (key === "internal_profile") {
      const beforeInternal = normalizeMemberInternalProfile(current.internal_profile);
      const afterInternal = normalizeMemberInternalProfile(
        after as Partial<MemberInternalProfileFields>,
      );

      for (const internalKey of MEMBER_INTERNAL_PROFILE_KEYS) {
        const before = beforeInternal[internalKey];
        const next = afterInternal[internalKey];
        if (valuesEqual(before, next)) continue;
        diffs.push({
          field: `internal_profile.${internalKey}`,
          label: MEMBER_INTERNAL_PROFILE_LABELS[internalKey],
          kind: "text",
          before,
          after: next,
        });
      }
      continue;
    }

    const before = current[key as keyof Member] as
      | string
      | Multilingual
      | null;

    if (valuesEqual(before, after)) continue;

    diffs.push({
      field: key,
      label: FIELD_LABELS[key] ?? key,
      kind: MULTILINGUAL_FIELDS.has(key)
        ? "multilingual"
        : IMAGE_FIELDS.has(key)
          ? "image"
          : "text",
      before: before ?? null,
      after: (isMultilingual(after) ? after : (after ?? null)) as
        | string
        | Multilingual
        | null,
    });
  }

  return diffs;
}
