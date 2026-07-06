import { createClient } from "@/lib/supabase/server";
import type { Member, News } from "@/lib/types";

// Zentrale Lesezugriffe der öffentlichen Website. Die RLS-Policies liefern
// über den anon-Key ohnehin nur veröffentlichte Daten; die Filter hier
// machen die Absicht explizit und halten alle Seiten konsistent.

export async function getPublishedMembers(limit?: number): Promise<Member[]> {
  const supabase = await createClient();
  let query = supabase
    .from("members")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data ?? []) as Member[];
}

export async function getPublishedMember(id: string): Promise<Member | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .eq("is_active", true)
    .maybeSingle();
  return data as Member | null;
}

export async function getPublishedNews(limit?: number): Promise<News[]> {
  const supabase = await createClient();
  let query = supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .eq("is_active", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data ?? []) as News[];
}

export async function getPublishedNewsItem(id: string): Promise<News | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .eq("is_active", true)
    .maybeSingle();
  return data as News | null;
}

// ─── Darstellungs-Helfer für News ────────────────────────────────────────────

export function excerpt(text: string, length = 150): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}...` : clean;
}

export function newsFaviconUrl(linkUrl: string): string | null {
  try {
    const { hostname } = new URL(linkUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
}

export function youtubeThumbnailUrl(youtubeUrl: string): string | null {
  try {
    const u = new URL(youtubeUrl);
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1).split("?")[0] || null;
    else if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v");
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  } catch {
    /* ignore */
  }
  return null;
}

export function extractYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1).split("?")[0] || null;
    else if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1].split("?")[0] || null;
      else id = u.searchParams.get("v");
    }
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch {
    /* ignore */
  }
  return null;
}
