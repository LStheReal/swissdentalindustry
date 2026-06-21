import {
  emptyMemberInternalProfile,
  normalizeMemberInternalProfile,
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
  const query = client.from("member_internal_profiles") as {
    select: (query: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
  const { data, error } = await query
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  if (error) {
    if (isMissingInternalProfilesTableError(error)) {
      logMissingTableOnce();
      return emptyMemberInternalProfile();
    }
    throw new Error(String((error as { message?: string }).message ?? error));
  }

  return data
    ? normalizeMemberInternalProfile(data as Partial<MemberInternalProfileFields>)
    : emptyMemberInternalProfile();
}

export async function listInternalProfilesByMemberId(
  client: MinimalSupabaseClient,
  memberIds: string[],
): Promise<Map<string, MemberInternalProfileFields>> {
  if (!memberIds.length) return new Map();

  const query = client.from("member_internal_profiles") as {
    select: (query: string) => {
      in: (
        column: string,
        values: string[],
      ) => Promise<{ data: unknown[] | null; error: unknown }>;
    };
  };
  const { data, error } = await query
    .select("*")
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
  const hasAnyValue = Object.values(profile).some(Boolean);
  const query = client.from("member_internal_profiles") as {
    delete: () => { eq: (column: string, value: string) => Promise<{ error: unknown }> };
    upsert: (value: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
  const { error } = hasAnyValue
    ? await query.upsert({
        member_id: memberId,
        ...profile,
      })
    : await query.delete().eq("member_id", memberId);

  if (error) {
    if (isMissingInternalProfilesTableError(error)) {
      logMissingTableOnce();
      return false;
    }
    throw new Error(String((error as { message?: string }).message ?? error));
  }

  return true;
}
