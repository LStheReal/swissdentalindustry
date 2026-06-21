import { createClient } from "@/lib/supabase/server";
import { diffMemberChange, wordDiff, type FieldDiff } from "@/lib/diff";
import { listInternalProfilesByMemberId } from "@/lib/member-internal-profiles";
import {
  LOCALES,
  emptyMemberInternalProfile,
  type Member,
  type MemberEditableFields,
  type Multilingual,
} from "@/lib/types";
import { approveChange, rejectChange } from "./actions";
import { MemberFilter } from "./MemberFilter";

function timeAgo(iso: string): { label: string; days: number } {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  let label: string;
  if (min < 1) label = "gerade eben";
  else if (min < 60) label = `vor ${min} Minute${min === 1 ? "" : "n"}`;
  else if (min < 24 * 60) {
    const h = Math.floor(min / 60);
    label = `vor ${h} Stunde${h === 1 ? "" : "n"}`;
  } else {
    label = `vor ${days} Tag${days === 1 ? "" : "en"}`;
  }
  return { label, days };
}

function ageColor(days: number): string {
  if (days >= 7) return "bg-[#fdecec] text-[#e1000f]";
  if (days >= 3) return "bg-[#fff4d6] text-[#8a5a00]";
  return "bg-[#fafaf8] text-[#6b6b73]";
}

interface RequestWithMember {
  id: string;
  member_id: string;
  proposed: Partial<MemberEditableFields>;
  submitted_at: string;
  contact_email: string | null;
  members: Member;
}

function InlineDiff({
  before,
  after,
  show,
}: {
  before: string | null;
  after: string | null;
  show: "before" | "after";
}) {
  const ops = wordDiff(before ?? "", after ?? "");
  const visible = ops.filter(
    (op) =>
      op.type === "same" ||
      op.type === (show === "before" ? "removed" : "added"),
  );
  if (visible.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <>
      {visible.map((op, i) => {
        const space = i < visible.length - 1 ? " " : "";
        if (op.type === "same")
          return (
            <span key={i}>
              {op.text}
              {space}
            </span>
          );
        if (show === "before")
          return (
            <mark
              key={i}
              className="rounded bg-red-100 px-0.5 text-red-700 line-through"
            >
              {op.text}
              {space}
            </mark>
          );
        return (
          <mark
            key={i}
            className="rounded bg-green-300 px-0.5 text-green-900"
          >
            {op.text}
            {space}
          </mark>
        );
      })}
    </>
  );
}

function ValueBlock({
  before,
  after,
  kind,
  tone,
}: {
  before: string | Multilingual | null;
  after: string | Multilingual | null;
  kind: FieldDiff["kind"];
  tone: "before" | "after";
}) {
  const base =
    tone === "before"
      ? "border-[#e2e2e7] bg-[#fafaf8]"
      : "border-[#c4e8d2] bg-[#eef9f3]";

  if (kind === "image") {
    const value = tone === "before" ? before : after;
    return (
      <div className={`border p-3 ${base}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value as string} alt="" className="h-16 object-contain" />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>
    );
  }

  if (kind === "multilingual") {
    const beforeMl = (before as Multilingual) || null;
    const afterMl = (after as Multilingual) || null;
    return (
      <div className={`space-y-1 border p-3 text-sm ${base}`}>
        {LOCALES.map((l) => (
          <p key={l}>
            <span className="mr-1 text-xs font-semibold uppercase text-slate-400">
              {l}
            </span>
            <InlineDiff
              before={beforeMl?.[l] ?? null}
              after={afterMl?.[l] ?? null}
              show={tone}
            />
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={`border p-3 text-sm ${base}`}>
      <InlineDiff
        before={before as string | null}
        after={after as string | null}
        show={tone}
      />
    </div>
  );
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const { member: memberFilter } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_change_requests")
    .select("*, members(*)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  const requests = (data ?? []) as unknown as RequestWithMember[];
  const memberIds = Array.from(new Set(requests.map((r) => r.member_id)));
  const internalByMemberId = await listInternalProfilesByMemberId(supabase, memberIds);

  const uniqueMembers = Array.from(
    new Map(requests.map((r) => [r.member_id, { id: r.member_id, name: r.members.name }])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filtered = memberFilter
    ? requests.filter((r) => r.member_id === memberFilter)
    : requests;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-sdi-mono mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e1000f]">
            | Freigabe-Workflow
          </div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.025em]">
            Änderungs-Feed
          </h1>
          <p className="mt-1.5 text-[13.5px] text-[#6b6b73]">
            {memberFilter
              ? `${filtered.length} von ${requests.length} Anforderung${
                  requests.length === 1 ? "" : "en"
                } offen`
              : `${requests.length} Anforderung${
                  requests.length === 1 ? "" : "en"
                } offen`}
            {" · "}
            Links der aktuelle Stand, rechts der Vorschlag der Firma.
          </p>
        </div>
        {uniqueMembers.length > 1 && (
          <MemberFilter members={uniqueMembers} />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[#e2e2e7] bg-[#fafaf8] p-8 text-sm text-[#6b6b73]">
          Keine offenen Änderungen.
        </div>
      ) : (
        <ul className="space-y-6">
          {filtered.map((req) => {
            const member = req.members;
            const diffs = diffMemberChange(
              {
                ...member,
                internal_profile:
                  internalByMemberId.get(req.member_id) ??
                  emptyMemberInternalProfile(),
              },
              req.proposed,
            );
            return (
              <li
                key={req.id}
                className="border border-[#e2e2e7] bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e2e7] bg-[#fafaf8] px-5 py-4">
                  <div className="flex items-center gap-3.5">
                    <div className="font-sdi-mono flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#e2e2e7] bg-white text-[10px] font-bold">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold tracking-[-0.01em]">
                        {member.name}
                      </p>
                      <div className="font-sdi-mono mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-[0.04em] text-[#6b6b73]">
                      <span
                        className={`rounded-[2px] px-2 py-0.5 ${ageColor(
                          timeAgo(req.submitted_at).days,
                        )}`}
                      >
                        {timeAgo(req.submitted_at).label}
                      </span>
                      <span>
                        {new Date(req.submitted_at).toLocaleString("de-CH")}
                      </span>
                      <span>·</span>
                      <span>{diffs.length} Felder geändert</span>
                      {req.contact_email && (
                        <>
                          <span>·</span>
                          <span>{req.contact_email}</span>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={approveChange.bind(null, req.id)}>
                      <button
                        type="submit"
                        className="rounded-[3px] bg-[#1f8a5b] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#176b45]"
                      >
                        Freigeben & publizieren
                      </button>
                    </form>
                    <form action={rejectChange.bind(null, req.id)}>
                      <button
                        type="submit"
                        className="rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
                      >
                        Ablehnen
                      </button>
                    </form>
                  </div>
                </div>

                <div className="font-sdi-mono grid grid-cols-[130px_1fr_1fr] border-b border-[#e2e2e7] px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6b6b73] max-md:hidden">
                  <span>Feld</span>
                  <span>Aktuell</span>
                  <span>Vorgeschlagen</span>
                </div>

                <div>
                  {diffs.map((d) => (
                    <div
                      key={d.field}
                      className="grid gap-3 border-b border-[#ececf0] px-5 py-4 last:border-b-0 md:grid-cols-[130px_1fr_1fr]"
                    >
                      <div>
                        <p className="text-[13px] font-bold">{d.label}</p>
                        <p className="font-sdi-mono mt-1 text-[10.5px] uppercase text-[#6b6b73]">
                          {d.kind}
                        </p>
                      </div>
                      <div>
                        <p className="font-sdi-mono mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b6b73] md:hidden">
                          Aktuell
                        </p>
                        <ValueBlock before={d.before} after={d.after} kind={d.kind} tone="before" />
                      </div>
                      <div>
                        <p className="font-sdi-mono mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1f8a5b] md:hidden">
                          Vorgeschlagen
                        </p>
                        <ValueBlock before={d.before} after={d.after} kind={d.kind} tone="after" />
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
