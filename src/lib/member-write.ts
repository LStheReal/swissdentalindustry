// Der einzige Schreibpfad auf eine Mitgliedsfirma.
//
// Alles, was Inhalte einer Firma ändert — das Admin-Formular, eine freigegebene
// Self-Service-Änderung, die nachgereichte Übersetzung, der Spreadsheet-Import
// — geht hier durch. Nur so lässt sich die Regel „nichts geht ohne
// ausdrückliches Veröffentlichen live" an einer Stelle durchsetzen statt an
// sechs.

import { geocodeAddress } from "./geocode";
import { formatAddress, formatAddressOneLine, normalizeAddress } from "./address";
import { pickDraftable, pickNonDraftable, type MemberDraft } from "./member-draft";
import type { createAdminClient } from "./supabase/admin";
import type { Member } from "./types";

type Client = ReturnType<typeof createAdminClient>;

export interface ApplyResult {
  /** true = der Patch steht sofort öffentlich (die Firma war noch nie online). */
  wentLive: boolean;
}

/**
 * Übernimmt Änderungen an einer Firma.
 *
 * Ist die Firma veröffentlicht, landen die öffentlichen Felder im Entwurf und
 * bleiben unsichtbar, bis jemand veröffentlicht. War sie noch nie online, wird
 * direkt geschrieben — dort kann nichts live gehen, was nicht ohnehin schon
 * unsichtbar wäre.
 *
 * Nicht-öffentliche Felder (Koordinaten, Prüf-Flags) gehen immer direkt in die
 * Spalten: sie sind abgeleitet bzw. reine Verwaltung und haben im Entwurf
 * nichts verloren.
 */
export async function applyMemberPatch(
  supabase: Client,
  memberId: string,
  patch: Record<string, unknown>,
): Promise<ApplyResult> {
  const { data, error } = await supabase
    .from("members")
    .select("status, draft")
    .eq("id", memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const status = (data as { status?: string } | null)?.status ?? "draft";

  if (status !== "published") {
    const { error: updErr } = await supabase.from("members").update(patch).eq("id", memberId);
    if (updErr) throw new Error(updErr.message);
    return { wentLive: true };
  }

  const current = ((data as { draft?: MemberDraft | null } | null)?.draft ?? {}) as MemberDraft;
  const nextDraft = { ...current, ...pickDraftable(patch) };

  const { error: updErr } = await supabase
    .from("members")
    .update({ ...pickNonDraftable(patch), draft: nextDraft })
    .eq("id", memberId);
  if (updErr) throw new Error(updErr.message);
  return { wentLive: false };
}

export interface PublishResult {
  published: boolean;
  /** Die Adresse hat sich durch das Veröffentlichen geändert → neu geokodieren. */
  addressChanged: boolean;
  address: string | null;
}

/**
 * Schaltet eine Firma öffentlich: der Entwurf wird zum veröffentlichten Stand.
 *
 * Das ist die einzige Stelle, an der Inhalte einer Firma öffentlich werden.
 */
export async function publishMemberRow(
  supabase: Client,
  memberId: string,
): Promise<PublishResult> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { published: false, addressChanged: false, address: null };

  const member = data as Member;
  const draft = (member.draft ?? {}) as Record<string, unknown>;

  const before = normalizeAddress(member);
  const after = normalizeAddress({ ...member, ...draft });
  const addressChanged = formatAddress(before) !== formatAddress(after);

  const update: Record<string, unknown> = {
    ...draft,
    draft: null,
    status: "published",
  };
  // Koordinaten gehören zur alten Adresse — sofort verwerfen, die neuen holt
  // der Aufrufer nach der Antwort nach.
  if (addressChanged) {
    update.lat = null;
    update.lng = null;
    update.canton = null;
  }

  const { error: updErr } = await supabase.from("members").update(update).eq("id", memberId);
  if (updErr) throw new Error(updErr.message);

  return {
    published: true,
    addressChanged,
    address: formatAddressOneLine(after) || null,
  };
}

/** Verwirft die unveröffentlichten Änderungen; der Live-Stand bleibt. */
export async function discardMemberDraft(supabase: Client, memberId: string): Promise<void> {
  const { error } = await supabase
    .from("members")
    .update({ draft: null })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
}

/** Nimmt eine veröffentlichte Firma wieder von der Website. */
export async function unpublishMemberRow(supabase: Client, memberId: string): Promise<void> {
  const { error } = await supabase
    .from("members")
    .update({ status: "draft" })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
}

export { geocodeAddress };
