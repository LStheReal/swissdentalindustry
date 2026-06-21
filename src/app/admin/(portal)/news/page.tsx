import { createClient } from "@/lib/supabase/server";
import { getAdminLocale } from "@/lib/i18n-admin";
import { mlText, type News } from "@/lib/types";
import { NewNewsMenu } from "./NewNewsMenu";
import { NewsListItem } from "./NewsListItem";

function newsFavicon(linkUrl: string) {
  try {
    const { hostname } = new URL(linkUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

function youtubeThumb(youtubeUrl: string) {
  try {
    const u = new URL(youtubeUrl);
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1).split("?")[0] || null;
    else if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v");
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  } catch { /* ignore */ }
  return null;
}

export default async function NewsListPage() {
  const supabase = await createClient();
  const locale = await getAdminLocale();
  const { data } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false });
  const news = (data ?? []) as News[];

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="font-sdi-mono mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e1000f]">
            | News
          </div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.025em]">News</h1>
        </div>
        <NewNewsMenu />
      </div>

      {news.length === 0 ? (
        <div className="border border-[#e2e2e7] bg-[#fafaf8] p-8 text-sm text-[#6b6b73]">
          Noch keine News vorhanden.
        </div>
      ) : (
        <ul className="space-y-3">
          {news.map((n) => {
            const favicon = n.link_url ? newsFavicon(n.link_url) : null;
            const ytThumb = n.youtube_url ? youtubeThumb(n.youtube_url) : null;
            const thumbnail = n.image_url ?? ytThumb ?? favicon;

            return (
              <NewsListItem
                key={n.id}
                id={n.id}
                title={mlText(n.title, locale)}
                body={mlText(n.body, locale)}
                linkUrl={n.link_url}
                youtubeUrl={n.youtube_url}
                thumbnail={thumbnail}
                isActive={n.is_active}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
