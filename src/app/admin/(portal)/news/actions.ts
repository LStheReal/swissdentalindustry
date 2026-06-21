"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withLocalePath } from "@/lib/public-i18n";
import { translateToAll } from "@/lib/translate";
import { uploadImage } from "@/lib/storage";
import { LOCALES, type Locale } from "@/lib/types";

function readLocale(formData: FormData): Locale {
  const v = String(formData.get("source_lang") || "de");
  return (LOCALES.includes(v as Locale) ? v : "de") as Locale;
}

function revalidateNewsPaths(id?: string) {
  revalidatePath("/admin/news");

  for (const locale of LOCALES) {
    revalidatePath(withLocalePath("/", locale));
    revalidatePath(withLocalePath("/news", locale));
    if (id) revalidatePath(withLocalePath(`/news/${id}`, locale));
  }
}

export async function createNews(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const sourceLang = readLocale(formData);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const image = formData.get("image");

  const [titleMl, bodyMl, imageUrl] = await Promise.all([
    translateToAll(title, sourceLang),
    translateToAll(body, sourceLang),
    uploadImage("news", image instanceof File ? image : null),
  ]);

  const { error } = await supabase.from("news").insert({
    title: titleMl,
    body: bodyMl,
    image_url: imageUrl,
    source_lang: sourceLang,
    is_published: true,
    published_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

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

  const [titleMl, bodyMl, newImageUrl] = await Promise.all([
    translateToAll(title, sourceLang),
    translateToAll(body, sourceLang),
    uploadImage("news", image instanceof File ? image : null),
  ]);

  const update: Record<string, unknown> = {
    title: titleMl,
    body: bodyMl,
    source_lang: sourceLang,
  };
  if (newImageUrl) update.image_url = newImageUrl;

  const { error } = await supabase.from("news").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateNewsPaths(id);
  redirect("/admin/news");
}

export async function createLinkNews(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const sourceLang = readLocale(formData);
  const title = String(formData.get("title") || "").trim();
  const linkUrl = String(formData.get("link_url") || "").trim();

  const titleMl = await translateToAll(title, sourceLang);

  const { error } = await supabase.from("news").insert({
    title: titleMl,
    body: { de: "", fr: "", it: "", en: "" },
    link_url: linkUrl,
    image_url: null,
    source_lang: sourceLang,
    is_published: true,
    published_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

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

  const [titleMl, bodyMl] = await Promise.all([
    translateToAll(title, sourceLang),
    body ? translateToAll(body, sourceLang) : Promise.resolve({ de: "", fr: "", it: "", en: "" }),
  ]);

  const { error } = await supabase.from("news").insert({
    title: titleMl,
    body: bodyMl,
    youtube_url: youtubeUrl,
    image_url: null,
    source_lang: sourceLang,
    is_published: true,
    published_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

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

  const [titleMl, bodyMl] = await Promise.all([
    translateToAll(title, sourceLang),
    body ? translateToAll(body, sourceLang) : Promise.resolve({ de: "", fr: "", it: "", en: "" }),
  ]);

  const { error } = await supabase
    .from("news")
    .update({ title: titleMl, body: bodyMl, youtube_url: youtubeUrl, source_lang: sourceLang })
    .eq("id", id);
  if (error) throw new Error(error.message);

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
