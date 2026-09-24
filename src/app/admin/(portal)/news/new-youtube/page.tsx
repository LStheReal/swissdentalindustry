import { getAdminT } from "@/lib/i18n-admin";
import { NewsEditorPageShell } from "../NewsEditorPageShell";
import { YoutubeNewsForm } from "../YoutubeNewsForm";
import { createYoutubeNews } from "../actions";

export default async function NewYoutubeNewsPage() {
  const { t } = await getAdminT();
  return (
    <NewsEditorPageShell
      eyebrow={t("news.title")}
      title={t("news.pageYoutubeTitle")}
      description={t("news.pageYoutubeDesc")}
    >
      <YoutubeNewsForm action={createYoutubeNews} />
    </NewsEditorPageShell>
  );
}
