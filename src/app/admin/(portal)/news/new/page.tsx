import { getAdminT } from "@/lib/i18n-admin";
import { NewsEditorPageShell } from "../NewsEditorPageShell";
import { NewsForm } from "../NewsForm";
import { createNews } from "../actions";

export default async function NewNewsPage() {
  const { t } = await getAdminT();
  return (
    <NewsEditorPageShell
      eyebrow={t("news.title")}
      title={t("news.pageNewTitle")}
      description={t("news.pageNewDesc")}
    >
      <NewsForm action={createNews} />
    </NewsEditorPageShell>
  );
}
