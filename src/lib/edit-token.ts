import { createAdminClient } from "./supabase/admin";
import { getInternalProfileForMember } from "./member-internal-profiles";
import {
  type Member,
  type MemberEditableFields,
  type MemberInternalProfileFields,
} from "./types";

/**
 * Lädt die Firma zu einem aktiven Edit-Token. Gibt `null` zurück, wenn der
 * Token unbekannt oder widerrufen ist (→ "Link ungültig"-Seite).
 * Läuft über den Service-Role-Client, da kein User eingeloggt ist.
 */
export async function getMemberByToken(token: string): Promise<Member | null> {
  const supabase = createAdminClient();

  const { data: tokenRow } = await supabase
    .from("member_edit_tokens")
    .select("member_id, is_active")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow || !tokenRow.is_active) return null;

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", tokenRow.member_id)
    .maybeSingle();

  return (member as Member) ?? null;
}

/**
 * Liefert den jüngsten noch offenen Änderungsvorschlag eines Mitglieds zurück,
 * damit das Bearbeitungs-Formular dort weitermachen kann, wo die Firma zuletzt
 * aufgehört hat (statt nur den live-veröffentlichten Stand zu zeigen).
 */
export async function getLatestPendingProposal(
  memberId: string,
): Promise<Partial<MemberEditableFields> | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("member_change_requests")
    .select("proposed")
    .eq("member_id", memberId)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.proposed as Partial<MemberEditableFields>) ?? null;
}

export async function getInternalProfileByMemberId(
  memberId: string,
): Promise<MemberInternalProfileFields> {
  const supabase = createAdminClient();
  return getInternalProfileForMember(supabase, memberId);
}
