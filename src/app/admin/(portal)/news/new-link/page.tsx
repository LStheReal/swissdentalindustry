import { getAdminT } from "@/lib/i18n-admin";
import { NewsEditorPageShell } from "../NewsEditorPageShell";
import { LinkNewsForm } from "../LinkNewsForm";
import { createLinkNews } from "../actions";

export default async function NewLinkNewsPage() {
  const { t } = await getAdminT();
  return (
    <NewsEditorPageShell
      eyebrow={t("news.title")}
      title={t("news.pageLinkTitle")}
      description={t("news.pageLinkDesc")}
    >
      <LinkNewsForm action={createLinkNews} />
    </NewsEditorPageShell>
  );
}
