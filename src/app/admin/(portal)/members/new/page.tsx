import { MemberForm } from "../MemberForm";
import { createMember } from "../actions";
import { getAdminT } from "@/lib/i18n-admin";

export default async function NewMemberPage() {
  const { t } = await getAdminT();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("members.newTitle")}</h1>
      <MemberForm action={createMember} />
    </div>
  );
}
