import {
  emptyMemberInternalProfile,
  normalizeContactRoles,
  normalizeMemberInternalProfile,
  type ContactRole,
  type MemberInternalProfileFields,
} from "./types";

type MinimalSupabaseClient = {
  from: (table: string) => unknown;
};

export function isMissingInternalProfilesTableError(error: unknown): boolean {
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : String(error ?? "");

  return (
    message.includes("member_internal_profiles") &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}

export async function ensureInternalProfilesTableAvailable(
  client: MinimalSupabaseClient,
): Promise<void> {
  const query = client.from("member_internal_profiles") as {
    select: (query: string) => {
      limit: (count: number) => Promise<{ error: unknown }>;
    };
  };
  const { error } = await query.select("member_id").limit(1);

  if (!error) return;
  if (isMissingInternalProfilesTableError(error)) {
    throw new Error(
      "Die Supabase-Tabelle public.member_internal_profiles fehlt. Bitte Migration 0008_member_internal_profiles.sql ausführen und danach das Spreadsheet erneut importieren.",
    );
  }
  throw new Error(String((error as { message?: string }).message ?? error));
}

function logMissingTableOnce() {
  console.warn(
    "member_internal_profiles table is missing in Supabase. Run migration 0008_member_internal_profiles.sql.",
  );
}

export async function getInternalProfileForMember(
  client: MinimalSupabaseClient,
  memberId: string,
): Promise<MemberInternalProfileFields> {
  // Der Hauptkontakt der Firma.
  //
  // Seit Migration 0017 hängt das an der Rolle 'main' statt an position = 1 —
  // die Position war nur die Reihenfolge der Erfassung und hat nie bedeutet,
  // dass diese Person die zuständige ist. Für den Bestand ist beides
  // deckungsgleich, weil die Migration genau den Position-1-Zeilen die Rolle
  // gegeben hat.
  //
  // Fallback auf die erste Position, falls eine Firma (noch) keinen
  // Hauptkontakt markiert hat — sonst stünde das Self-Service-Formular ohne
  // Daten da.
  const table = client.from("member_internal_profiles") as ProfileTable;

  try {
    const byRole = await table
      .select("*")
      .eq("member_id", memberId)
      .contains("roles", ["main"])
      .maybeSingle();
    if (byRole.error) throw byRole.error;
    if (byRole.data) {
      return normalizeMemberInternalProfile(
        byRole.data as Partial<MemberInternalProfileFields>,
      );
    }

    const first = await table
      .select("*")
      .eq("member_id", memberId)
      .eq("position", 1)
      .maybeSingle();
    if (first.error) throw first.error;
    return first.data
      ? normalizeMemberInternalProfile(first.data as Partial<MemberInternalProfileFields>)
      : emptyMemberInternalProfile();
  } catch (error) {
    if (isMissingInternalProfilesTableError(error)) {
      logMissingTableOnce();
      return emptyMemberInternalProfile();
    }
    throw new Error(String((error as { message?: string }).message ?? error));
  }
}

export async function listInternalProfilesByMemberId(
  client: MinimalSupabaseClient,
  memberIds: string[],
): Promise<Map<string, MemberInternalProfileFields>> {
  if (!memberIds.length) return new Map();

  const query = client.from("member_internal_profiles") as {
    select: (query: string) => {
      eq: (
        column: string,
        value: number,
      ) => {
        in: (
          column: string,
          values: string[],
        ) => Promise<{ data: unknown[] | null; error: unknown }>;
      };
    };
  };
  // Nur die Hauptansprechperson — Listen und Export zeigen eine Zeile je Firma.
  const { data, error } = await query
    .select("*")
    .eq("position", 1)
    .in("member_id", memberIds);

  if (error) {
    if (isMissingInternalProfilesTableError(error)) {
      logMissingTableOnce();
      return new Map();
    }
    throw new Error(String((error as { message?: string }).message ?? error));
  }

  return new Map(
    ((data ?? []) as ({ member_id: string } & Partial<MemberInternalProfileFields>)[]).map(
      (row) => [row.member_id, normalizeMemberInternalProfile(row)],
    ),
  );
}

export async function saveInternalProfile(
  client: MinimalSupabaseClient,
  memberId: string,
  profile: MemberInternalProfileFields,
): Promise<boolean> {
  // Schreibt ausschliesslich Position 1. `upsert` auf member_id geht seit
  // Migration 0012 nicht mehr — member_id ist kein Primary Key mehr, mehrere
  // Zeilen pro Firma sind erlaubt. Auch das Löschen muss auf Position 1
  // begrenzt bleiben, sonst reisst ein leeres Formular alle weiteren
  // Kontaktpersonen mit.
  return saveContactPersonAt(client, memberId, 1, profile);
}

type ProfileTable = {
  select: (query: string) => {
    eq: (column: string, value: string | number) => {
      eq: (column: string, value: string | number) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      };
      contains: (
        column: string,
        value: string[],
      ) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> };
      maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      order: (
        column: string,
        opts: { ascending: boolean },
      ) => Promise<{ data: unknown[] | null; error: unknown }>;
    };
  };
  insert: (value: Record<string, unknown>) => Promise<{ error: unknown }>;
  update: (value: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<{ error: unknown }>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: unknown }>;
  };
};

/** Legt die Kontaktperson an der gegebenen Position an oder aktualisiert sie. */
async function saveContactPersonAt(
  client: MinimalSupabaseClient,
  memberId: string,
  position: number,
  profile: MemberInternalProfileFields,
  roles?: ContactRole[],
): Promise<boolean> {
  const table = client.from("member_internal_profiles") as ProfileTable;
  const hasAnyValue = Object.values(profile).some(Boolean);

  try {
    const { data: existing } = await table
      .select("id")
      .eq("member_id", memberId)
      .eq("position", position)
      .maybeSingle();
    const existingId = (existing as { id?: string } | null)?.id ?? null;

    let error: unknown = null;
    if (!hasAnyValue) {
      if (existingId) ({ error } = await table.delete().eq("id", existingId));
    } else if (existingId) {
      ({ error } = await table
        .update({ ...profile, ...(roles ? { roles } : {}) })
        .eq("id", existingId));
    } else {
      ({ error } = await table.insert({
        member_id: memberId,
        position,
        ...profile,
        roles: roles ?? [],
      }));
    }

    if (error) {
      if (isMissingInternalProfilesTableError(error)) {
        logMissingTableOnce();
        return false;
      }
      throw new Error(String((error as { message?: string }).message ?? error));
    }
    return true;
  } catch (err) {
    if (isMissingInternalProfilesTableError(err)) {
      logMissingTableOnce();
      return false;
    }
    throw err;
  }
}

export interface ContactPerson extends MemberInternalProfileFields {
  id: string;
  position: number;
  /** main | billing | marketing — eine Person kann mehrere halten. */
  roles: ContactRole[];
}

/** Alle Kontaktpersonen einer Firma, aufsteigend nach Position. */
export async function listContactPersons(
  client: MinimalSupabaseClient,
  memberId: string,
): Promise<ContactPerson[]> {
  const table = client.from("member_internal_profiles") as ProfileTable;
  try {
    const { data, error } = await table
      .select("*")
      .eq("member_id", memberId)
      .order("position", { ascending: true });
    if (error) {
      if (isMissingInternalProfilesTableError(error)) {
        logMissingTableOnce();
        return [];
      }
      throw new Error(String((error as { message?: string }).message ?? error));
    }
    return (
      (data ?? []) as ({ id: string; position: number; roles?: unknown } & Partial<MemberInternalProfileFields>)[]
    ).map((row) => ({
      ...normalizeMemberInternalProfile(row),
      id: row.id,
      position: row.position,
      roles: normalizeContactRoles(row.roles),
    }));
  } catch (err) {
    if (isMissingInternalProfilesTableError(err)) {
      logMissingTableOnce();
      return [];
    }
    throw err;
  }
}

/**
 * Hängt eine weitere Kontaktperson an — die Nummer ergibt sich fortlaufend aus
 * den bestehenden (erste, zweite, dritte Person dieser Firma).
 */
export async function addContactPerson(
  client: MinimalSupabaseClient,
  memberId: string,
  profile: MemberInternalProfileFields,
  roles: ContactRole[] = [],
): Promise<number> {
  const existing = await listContactPersons(client, memberId);
  const nextPosition = existing.reduce((max, p) => Math.max(max, p.position), 0) + 1;

  // Höchstens ein Hauptkontakt je Firma — die Datenbank erzwingt das über einen
  // Unique-Index. Statt den Insert daran scheitern zu lassen, wird die Rolle
  // hier abgegeben: der neue Kontakt übernimmt sie, der alte verliert sie.
  if (roles.includes("main")) {
    await clearMainRole(client, memberId);
  }

  await saveContactPersonAt(
    client,
    memberId,
    nextPosition,
    {
      ...profile,
      // Die Kontaktnummer ist der laufende Index innerhalb der Firma.
      member_number: profile.member_number ?? String(nextPosition),
    },
    roles,
  );
  return nextPosition;
}

/** Nimmt der bisherigen Hauptkontakt-Zeile die Rolle ab. */
async function clearMainRole(
  client: MinimalSupabaseClient,
  memberId: string,
  exceptId?: string,
): Promise<void> {
  const people = await listContactPersons(client, memberId);
  const table = client.from("member_internal_profiles") as ProfileTable;
  for (const person of people) {
    if (person.id === exceptId) continue;
    if (!person.roles.includes("main")) continue;
    const { error } = await table
      .update({ roles: person.roles.filter((r) => r !== "main") })
      .eq("id", person.id);
    if (error) throw new Error(String((error as { message?: string }).message ?? error));
  }
}

/** Aktualisiert eine bestehende Kontaktperson anhand ihrer Zeilen-ID. */
export async function updateContactPerson(
  client: MinimalSupabaseClient,
  id: string,
  profile: MemberInternalProfileFields,
  roles?: ContactRole[],
  memberId?: string,
): Promise<void> {
  if (roles?.includes("main") && memberId) {
    await clearMainRole(client, memberId, id);
  }
  const table = client.from("member_internal_profiles") as ProfileTable;
  const { error } = await table
    .update({ ...profile, ...(roles ? { roles } : {}) })
    .eq("id", id);
  if (error) throw new Error(String((error as { message?: string }).message ?? error));
}

/** Entfernt eine Kontaktperson. Position 1 bleibt erhalten. */
export async function deleteContactPerson(
  client: MinimalSupabaseClient,
  id: string,
): Promise<void> {
  const table = client.from("member_internal_profiles") as ProfileTable;
  const { error } = await table.delete().eq("id", id);
  if (error) throw new Error(String((error as { message?: string }).message ?? error));
}
