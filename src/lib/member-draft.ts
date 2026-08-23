// Entwurf und veröffentlichter Stand einer Mitgliedsfirma.
//
// Vorher gab es beides nicht getrennt: `members` trug genau eine Fassung des
// Inhalts, und jedes Speichern im Admin — und jede freigegebene Änderung aus
// dem Self-Service — stand damit sofort auf der öffentlichen Website. Ein
// Tippfehler war live, bevor jemand ihn sehen konnte.
//
// Jetzt gilt:
//
//   * Die Spalten von `members` sind der VERÖFFENTLICHTE Stand. Nur sie
//     werden auf der Website gelesen — die Leseseite musste deshalb nicht
//     angefasst werden.
//   * `members.draft` (jsonb) trägt die noch nicht veröffentlichten
//     Änderungen als Teilmenge derselben Felder. `null` heisst: der
//     veröffentlichte Stand ist aktuell.
//   * Öffentlich wird ein Entwurf ausschliesslich durch „Veröffentlichen".
//
// `status` behält seine Bedeutung: 'draft' = die Firma war noch nie online,
// 'published' = sie steht im Verzeichnis. Solange sie nie online war, wird
// direkt in die Spalten geschrieben — es gibt ja nichts, was dadurch live
// gehen könnte.

import type { Member } from "./types";

/** Felder, die den öffentlichen Auftritt ausmachen und deshalb Entwurf sein können. */
export const DRAFTABLE_KEYS = [
  "name",
  "logo_url",
  "description",
  "street_name",
  "street_number",
  "postal_code",
  "city",
  "address",
  "phone",
  "email",
  "website_url",
  "member_since",
  "source_lang",
] as const;

export type DraftableKey = (typeof DRAFTABLE_KEYS)[number];

export type MemberDraft = Partial<Pick<Member, DraftableKey>>;

/** Behält nur Felder, die überhaupt Entwurf sein dürfen. */
export function pickDraftable(patch: Record<string, unknown>): MemberDraft {
  const out: Record<string, unknown> = {};
  for (const key of DRAFTABLE_KEYS) {
    if (key in patch) out[key] = patch[key];
  }
  return out as MemberDraft;
}

/** Felder eines Patches, die NICHT zum Entwurf gehören (z.B. Koordinaten). */
export function pickNonDraftable(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(patch)) {
    if (!(DRAFTABLE_KEYS as readonly string[]).includes(key)) out[key] = patch[key];
  }
  return out;
}

/** Hat die Firma unveröffentlichte Änderungen? */
export function hasDraft(member: Pick<Member, "draft">): boolean {
  return Boolean(member.draft && Object.keys(member.draft).length > 0);
}

/**
 * Der Stand, den der Admin bearbeitet: veröffentlichte Werte, überlagert von
 * dem, was im Entwurf abweicht. Die Website benutzt das bewusst NICHT.
 */
export function effectiveMember(member: Member): Member {
  return member.draft ? { ...member, ...member.draft } : member;
}

/** Die Felder, in denen sich Entwurf und veröffentlichter Stand unterscheiden. */
export function draftedFields(member: Member): DraftableKey[] {
  if (!member.draft) return [];
  const draft = member.draft as Record<string, unknown>;
  return DRAFTABLE_KEYS.filter(
    (key) =>
      key in draft &&
      JSON.stringify(draft[key] ?? null) !== JSON.stringify(member[key] ?? null),
  );
}
