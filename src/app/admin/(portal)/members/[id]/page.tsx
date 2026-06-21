import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInternalProfileForMember } from "@/lib/member-internal-profiles";
import {
  type Member,
  type MemberEditToken,
} from "@/lib/types";
import { MemberForm } from "../MemberForm";
import { EditLinkPanel } from "../EditLinkPanel";
import { LogoUploadField } from "../LogoUploadField";
import {
  updateMember,
  generateEditLink,
  revokeEditLink,
  sendEditLinkToMember,
} from "../actions";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: memberData }, { data: tokenData }, internalProfile] = await Promise.all([
    supabase.from("members").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("member_edit_tokens")
      .select("*")
      .eq("member_id", id)
      .eq("is_active", true)
      .maybeSingle(),
    getInternalProfileForMember(supabase, id),
  ]);

  if (!memberData) notFound();
  const member = memberData as Member;
  const token = tokenData as MemberEditToken | null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const editUrl = token ? `${appUrl}/edit/${token.token}` : null;
  const status = member.status === "published" ? "Publiziert" : "Entwurf";
  const formId = `member-form-${member.id}`;

  return (
    <div className="overflow-hidden border border-[#e2e2e7] bg-white">
      <div className="border-b border-[#e2e2e7] px-5 py-5 sm:px-8">
        <div className="font-sdi-mono mb-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6b6b73]">
          Mitglieder / {member.name}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-extrabold tracking-[-0.025em]">
              {member.name}
            </h1>
            <div className="font-sdi-mono mt-2 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6b6b73]">
              <span className={member.status === "published" ? "text-[#1f8a5b]" : "text-[#a66a00]"}>
                ● {status}
              </span>
              {member.canton && <span>{member.canton}</span>}
              {member.member_since && <span>Seit {member.member_since}</span>}
            </div>
            <div className="mt-4 max-w-sm">
              <label className="block">
                <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
                  Sprache der Firma
                </span>
                <select
                  form={formId}
                  name="source_lang"
                  defaultValue={member.source_lang}
                  className="mt-2 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20"
                >
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </label>
              <span className="font-sdi-mono mt-1.5 block text-[10.5px] uppercase tracking-[0.04em] text-[#6b6b73]">
                Wird beim Speichern aus der Beschreibung automatisch erkannt · Auswahl dient nur als Fallback
              </span>
            </div>

            <div className="mt-6 max-w-[640px]">
              <EditLinkPanel
                url={editUrl}
                hasEmail={Boolean(member.email)}
                onGenerate={async () => {
                  "use server";
                  await generateEditLink(member.id);
                }}
                onRevoke={async () => {
                  "use server";
                  await revokeEditLink(member.id);
                }}
                onSendMail={async () => {
                  "use server";
                  try {
                    await sendEditLinkToMember(member.id);
                  } catch (err) {
                    return {
                      error: err instanceof Error ? err.message : "Unbekannter Fehler",
                    };
                  }
                }}
              />
            </div>
          </div>
          <div className="mt-8 w-full max-w-[320px] space-y-5 lg:mt-16">
            <LogoUploadField formId={formId} initialLogoUrl={member.logo_url} />
          </div>
        </div>
      </div>

      <MemberForm
        formId={formId}
        action={updateMember.bind(null, member.id)}
        initial={{
          name: member.name,
          description:
            member.description[member.source_lang] || member.description.de,
          descriptions: member.description,
          source_lang: member.source_lang,
          logo_url: member.logo_url,
          address: member.address,
          phone: member.phone,
          email: member.email,
          website_url: member.website_url,
          member_since: member.member_since,
          internal_profile: internalProfile,
        }}
      />
    </div>
  );
}
