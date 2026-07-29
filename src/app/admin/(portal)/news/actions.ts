"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withLocalePath } from "@/lib/public-i18n";
import { provisionalMultilingual, translateAfterResponse } from "@/lib/after-response";
import { uploadImage } from "@/lib/storage";
import { LOCALES, type Locale } from "@/lib/types";

function readLocale(formData: FormData): Locale {
  const v = String(formData.get("source_lang") || "de");
  return (LOCALES.includes(v as Locale) ? v : "de") as Locale;
}

function newsPaths(id?: string): string[] {
  const paths = ["/admin/news"];
  for (const locale of LOCALES) {
    paths.push(withLocalePath("/", locale));
    paths.push(withLocalePath("/news", locale));
    if (id) paths.push(withLocalePath(`/news/${id}`, locale));
  }
  return paths;
}

function revalidateNewsPaths(id?: string) {
  for (const path of newsPaths(id)) revalidatePath(path);
}

export async function createNews(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const sourceLang = readLocale(formData);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const image = formData.get("image");

  const imageUrl = await uploadImage("news", image instanceof File ? image : null);

  const { data: created, error } = await supabase
    .from("news")
    .insert({
      title: provisionalMultilingual(title),
      body: provisionalMultilingual(body),
      image_url: imageUrl,
      source_lang: sourceLang,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  translateAfterResponse({
    table: "news",
    id: created.id,
    fields: { title, body },
    sourceLang,
    paths: newsPaths(created.id),
  });

  revalidateNewsPaths();
  redirect("/admin/news");
}

export async function updateNews(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const sourceLang = readLocale(formData);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const image = formData.get("image");

  const newImageUrl = await uploadImage("news", image instanceof File ? image : null);

  const update: Record<string, unknown> = {
    title: provisionalMultilingual(title),
    body: provisionalMultilingual(body),
    source_lang: sourceLang,
  };
  if (newImageUrl) update.image_url = newImageUrl;

  const { error } = await supabase.from("news").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  translateAfterResponse({
    table: "news",
    id,
    fields: { title, body },
    sourceLang,
    paths: newsPaths(id),
  });

  revalidateNewsPaths(id);
  redirect("/admin/news");
}

export async function createLinkNews(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const sourceLang = readLocale(formData);
  const title = String(formData.get("title") || "").trim();
  const linkUrl = String(formData.get("link_url") || "").trim();

  const { data: created, error } = await supabase
    .from("news")
    .insert({
      title: provisionalMultilingual(title),
      body: { de: "", fr: "", it: "", en: "" },
      link_url: linkUrl,
      image_url: null,
      source_lang: sourceLang,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  translateAfterResponse({
    table: "news",
    id: created.id,
    fields: { title },
    sourceLang,
    paths: newsPaths(created.id),
  });

  revalidateNewsPaths();
  redirect("/admin/news");
}

export async function createYoutubeNews(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const sourceLang = readLocale(formData);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const youtubeUrl = String(formData.get("youtube_url") || "").trim();

  const { data: created, error } = await supabase
    .from("news")
    .insert({
      title: provisionalMultilingual(title),
      body: provisionalMultilingual(body),
      youtube_url: youtubeUrl,
      image_url: null,
      source_lang: sourceLang,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  translateAfterResponse({
    table: "news",
    id: created.id,
    fields: { title, body },
    sourceLang,
    paths: newsPaths(created.id),
  });

  revalidateNewsPaths();
  redirect("/admin/news");
}

export async function updateYoutubeNews(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const sourceLang = readLocale(formData);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const youtubeUrl = String(formData.get("youtube_url") || "").trim();

  const { error } = await supabase
    .from("news")
    .update({
      title: provisionalMultilingual(title),
      body: provisionalMultilingual(body),
      youtube_url: youtubeUrl,
      source_lang: sourceLang,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  translateAfterResponse({
    table: "news",
    id,
    fields: { title, body },
    sourceLang,
    paths: newsPaths(id),
  });

  revalidateNewsPaths(id);
  redirect("/admin/news");
}

export async function setNewsActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("news").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateNewsPaths(id);
}

export async function deleteNews(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateNewsPaths(id);
}
