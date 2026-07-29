import type { MetadataRoute } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { LOCALES } from "@/lib/types";
import { withLocalePath } from "@/lib/public-i18n";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

type SitemapRow = { id: string; updated_at: string };

function absolute(path: string) {
  return `${getSiteUrl()}${path === "/" ? "" : path}`;
}

function alternates(path: string) {
  return {
    languages: Object.fromEntries(
      LOCALES.map((locale) => [locale, absolute(withLocalePath(path, locale))]),
    ),
  };
}

async function loadDynamicRows() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { members: [] as SitemapRow[], news: [] as SitemapRow[] };

  // Bewusst der einfache Client ohne Cookies — die Sitemap ist nutzerunabhängig.
  const supabase = createSupabaseClient(url, key);
  const [members, news] = await Promise.all([
    supabase
      .from("members")
      .select("id, updated_at")
      .eq("status", "published")
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    supabase
      .from("news")
      .select("id, updated_at")
      .eq("is_published", true)
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
  ]);

  return {
    members: (members.data ?? []) as SitemapRow[],
    news: (news.data ?? []) as SitemapRow[],
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = [
    "/",
    "/news",
    "/about",
    "/members",
    "/join",
    "/contact",
    "/legal-notice",
    "/privacy",
  ];

  const { members, news } = await loadDynamicRows();

  return [
    ...staticPaths.map((path) => ({
      url: absolute(path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: alternates(path),
    })),
    ...members.map((member) => ({
      url: absolute(`/members/${member.id}`),
      lastModified: new Date(member.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: alternates(`/members/${member.id}`),
    })),
    ...news.map((item) => ({
      url: absolute(`/news/${item.id}`),
      lastModified: new Date(item.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: alternates(`/news/${item.id}`),
    })),
  ];
}
