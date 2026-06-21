import type { MetadataRoute } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { LOCALES, type Member, type News } from "@/lib/types";
import { withLocalePath } from "@/lib/public-i18n";

export const revalidate = 3600;

function baseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://swissdentalindustry.ch";
}

function absolute(path: string) {
  return `${baseUrl()}${path === "/" ? "" : path}`;
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
  if (!url || !key) return { members: [] as Member[], news: [] as News[] };

  const supabase = createSupabaseClient(url, key);
  const [members, news] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("status", "published")
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    supabase
      .from("news")
      .select("*")
      .eq("is_published", true)
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
  ]);

  return {
    members: (members.data ?? []) as Member[],
    news: (news.data ?? []) as News[],
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = [
    "/",
    "/news",
    "/verband",
    "/mitglieder",
    "/mitglied-werden",
    "/kontakt",
    "/impressum",
    "/datenschutz",
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
      url: absolute(`/mitglieder/${member.id}`),
      lastModified: new Date(member.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: alternates(`/mitglieder/${member.id}`),
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
