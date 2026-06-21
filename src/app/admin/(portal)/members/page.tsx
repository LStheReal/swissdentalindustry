import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { type Member } from "@/lib/types";
import { listInternalProfilesByMemberId } from "@/lib/member-internal-profiles";
import { MembersTable } from "./MembersTable";

export default async function MembersListPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .order("name", { ascending: true });
  const members = (data ?? []) as Member[];
  const published = members.filter((m) => m.status === "published").length;
  const drafts = members.length - published;

  const profilesMap = await listInternalProfilesByMemberId(supabase, members.map((m) => m.id));
  const internalProfiles = Object.fromEntries(profilesMap.entries());

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-sdi-mono mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e1000f]">
            | Alle Firmen
          </div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.025em]">
            Mitglieder
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6b6b73]">
            {published} publiziert · {drafts} Entwurf{drafts === 1 ? "" : "e"} ·{" "}
            {members.length} gesamt
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/members/import"
            className="rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0a0a0b] hover:bg-[#fafaf8]"
          >
            Firmen importieren
          </Link>
          <Link
            href="/admin/members/new"
            className="rounded-[3px] bg-[#0a0a0b] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#26262b]"
          >
            + Neue Firma
          </Link>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="border border-[#e2e2e7] bg-[#fafaf8] p-8 text-sm text-[#6b6b73]">
          Noch keine Firmen vorhanden.
        </div>
      ) : (
        <MembersTable members={members} internalProfiles={internalProfiles} />
      )}
    </div>
  );
}
