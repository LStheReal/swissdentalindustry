import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminT } from "@/lib/i18n-admin";
import { draftedFields, effectiveMember, hasDraft } from "@/lib/member-draft";
import { internalFieldLabel } from "@/lib/types";
import { PublishPanel } from "../PublishPanel";
import {
  getInternalProfileForMember,
  listContactPersons,
} from "@/lib/member-internal-profiles";
import {
  internalFieldLabels,
  type Member,
  type MemberEditToken,
} from "@/lib/types";
import { MemberForm } from "../MemberForm";
import { EditLinkPanel } from "../EditLinkPanel";
import { LogoUploadField } from "../LogoUploadField";
import { ContactPersonsPanel } from "../ContactPersonsPanel";
import {
  updateMember,
  publishMember,
  unpublishMember,
  discardDraft,
  generateEditLink,
  revokeEditLink,
  sendEditLinkToMember,
  addContactPersonAction,
  updateContactPersonAction,
  deleteContactPersonAction,
} from "../actions";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { locale: adminLocale, t } = await getAdminT();

  const [{ data: memberData }, { data: tokenData }, internalProfile, contactPersons] = await Promise.all([
    supabase.from("members").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("member_edit_tokens")
      .select("*")
      .eq("member_id", id)
      .eq("is_active", true)
      .maybeSingle(),
    getInternalProfileForMember(supabase, id),
    listContactPersons(supabase, id),
  ]);

  if (!memberData) notFound();
  const member = memberData as Member;
  const token = tokenData as MemberEditToken | null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const editUrl = token ? `${appUrl}/edit/${token.token}` : null;
  const status = member.status === "published" ? "Publiziert" : "Entwurf";
  const formId = `member-form-${member.id}`;
  // Bearbeitet wird immer der Entwurfsstand; öffentlich ist er erst nach
  // "Veröffentlichen".
  const editing = effectiveMember(member);
  const pendingFields = draftedFields(member).map((key) =>
    key === "description" ? "Beschreibung" : (internalFieldLabel(key as never, adminLocale) ?? key),
  );

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
              {hasDraft(member) && <span className="text-[#a66a00]">◐ Unveröffentlichte Änderung</span>}
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
                  defaultValue={editing.source_lang}
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
              <PublishPanel
                status={member.status}
                hasDraft={hasDraft(member)}
                pendingFields={pendingFields}
                onPublish={async () => {
                  "use server";
                  await publishMember(member.id);
                }}
                onUnpublish={async () => {
                  "use server";
                  await unpublishMember(member.id);
                }}
                onDiscard={async () => {
                  "use server";
                  await discardDraft(member.id);
                }}
              />
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
            <LogoUploadField formId={formId} initialLogoUrl={editing.logo_url} />
          </div>
        </div>
      </div>

      <MemberForm
        formId={formId}
        action={updateMember.bind(null, member.id)}
        initial={{
          name: editing.name,
          description:
            editing.description[editing.source_lang] || editing.description.de,
          descriptions: editing.description,
          source_lang: editing.source_lang,
          logo_url: editing.logo_url,
          street_name: editing.street_name,
          street_number: editing.street_number,
          postal_code: editing.postal_code,
          city: editing.city,
          address_needs_review: editing.address_needs_review,
          phone: editing.phone,
          email: editing.email,
          website_url: editing.website_url,
          member_since: editing.member_since,
          internal_profile: internalProfile,
        }}
      />

      <div className="mt-6">
        <ContactPersonsPanel
          people={contactPersons}
          copy={{
            title: t("contacts.title"),
            notPublic: t("contacts.notPublic"),
            intro: t("contacts.intro"),
            empty: t("contacts.empty"),
            item: t("contacts.item"),
            add: t("contacts.add"),
            saveNew: t("contacts.saveNew"),
            save: t("common.save"),
            cancel: t("common.cancel"),
            remove: t("contacts.remove"),
            removing: t("contacts.removing"),
            saving: t("contacts.saving"),
            creating: t("contacts.creating"),
            fieldLabels: internalFieldLabels(adminLocale),
          }}
          addAction={async (formData: FormData) => {
            "use server";
            await addContactPersonAction(member.id, formData);
          }}
          updateAction={async (contactId: string, formData: FormData) => {
            "use server";
            await updateContactPersonAction(member.id, contactId, formData);
          }}
          deleteAction={async (contactId: string) => {
            "use server";
            await deleteContactPersonAction(member.id, contactId);
          }}
        />
      </div>
    </div>
  );
}
