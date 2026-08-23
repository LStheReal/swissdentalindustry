// Firmen-interne Angaben: Mitarbeiterzahl, Mitgliederbeitrag, interne Notizen.
//
// Eigene Tabelle statt Spalten auf `members` (Migration 0019). `members` wird
// über den öffentlichen anon-Key gelesen und gibt für veröffentlichte Firmen
// alle Spalten heraus — was dort liegt, ist öffentlich. Was intern ist, ist es
// hier durch seine Lage, nicht durch eine Spaltenrechte-Akrobatik, die beim
// nächsten `add column` wieder aufgeht.

import type { createAdminClient } from "./supabase/admin";

type Client = ReturnType<typeof createAdminClient>;

export interface CompanyInternal {
  employee_count: number | null;
  membership_fee: string | null;
  internal_notes: string | null;
}

export function emptyCompanyInternal(): CompanyInternal {
  return { employee_count: null, membership_fee: null, internal_notes: null };
}

export async function getCompanyInternal(
  client: Client,
  memberId: string,
): Promise<CompanyInternal> {
  const { data, error } = await client
    .from("member_company_internal")
    .select("employee_count, membership_fee, internal_notes")
    .eq("member_id", memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { ...emptyCompanyInternal(), ...((data as CompanyInternal | null) ?? {}) };
}

/** Alle auf einmal — für Liste und Export, damit es nicht N Abfragen werden. */
export async function listCompanyInternal(
  client: Client,
  memberIds: string[],
): Promise<Map<string, CompanyInternal>> {
  if (!memberIds.length) return new Map();
  const { data, error } = await client
    .from("member_company_internal")
    .select("member_id, employee_count, membership_fee, internal_notes")
    .in("member_id", memberIds);
  if (error) throw new Error(error.message);
  return new Map(
    ((data ?? []) as ({ member_id: string } & CompanyInternal)[]).map((row) => [
      row.member_id,
      {
        employee_count: row.employee_count,
        membership_fee: row.membership_fee,
        internal_notes: row.internal_notes,
      },
    ]),
  );
}

/**
 * Legt an oder aktualisiert. Nur die übergebenen Felder werden angefasst —
 * ein Formular, das nur den Beitrag schickt, darf die Notizen nicht leeren.
 */
export async function saveCompanyInternal(
  client: Client,
  memberId: string,
  patch: Partial<CompanyInternal>,
): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  const current = await getCompanyInternal(client, memberId);
  const next = { ...current, ...patch };

  const { error } = await client
    .from("member_company_internal")
    .upsert({ member_id: memberId, ...next }, { onConflict: "member_id" });
  if (error) throw new Error(error.message);
}
