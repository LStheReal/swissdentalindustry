import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type News } from "@/lib/types";
import { getAdminT } from "@/lib/i18n-admin";
import { NewsEditorPageShell } from "../NewsEditorPageShell";
import { NewsForm } from "../NewsForm";
import { YoutubeNewsForm } from "../YoutubeNewsForm";
import { updateNews, updateYoutubeNews } from "../actions";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { t } = await getAdminT();
  const { data } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const news = data as News;

  if (news.youtube_url) {
    return (
      <NewsEditorPageShell
        eyebrow={t("news.title")}
        title={t("news.pageEditYoutubeTitle")}
        description={t("news.pageEditYoutubeDesc")}
      >
        <YoutubeNewsForm
          action={updateYoutubeNews.bind(null, news.id)}
          initial={{
            title: news.title[news.source_lang] || news.title.de,
            youtube_url: news.youtube_url,
            body: news.body[news.source_lang] || news.body.de || "",
            source_lang: news.source_lang,
          }}
        />
      </NewsEditorPageShell>
    );
  }

  return (
    <NewsEditorPageShell
      eyebrow={t("news.title")}
      title={t("news.pageEditTitle")}
      description={t("news.pageEditDesc")}
    >
      <NewsForm
        action={updateNews.bind(null, news.id)}
        initial={{
          title: news.title[news.source_lang] || news.title.de,
          body: news.body[news.source_lang] || news.body.de,
          source_lang: news.source_lang,
          image_url: news.image_url,
        }}
      />
    </NewsEditorPageShell>
  );
}
