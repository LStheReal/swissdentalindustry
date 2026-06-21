"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateToAllAuto } from "@/lib/translate";
import { geocodeAddress } from "@/lib/geocode";
import type { MembershipApplication } from "@/lib/types";

// Best-effort-Mapping gängiger Feldnamen aus dem Fragebogen auf Mitglieder-Felder.
// Die genauen Formularfelder liefert der User später — dann hier verfeinern.
function pick(payload: Record<string, string>, keys: string[]): string | null {
  for (const k of Object.keys(payload)) {
    if (keys.includes(k.toLowerCase().trim())) {
      const v = payload[k]?.trim();
      if (v) return v;
    }
  }
  return null;
}

export async function convertApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("membership_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return;
  const app = data as MembershipApplication;
  const p = app.payload;

  const name = pick(p, ["name", "company", "firma", "firmenname"]) || "Neue Firma";
  const description = pick(p, ["description", "beschreibung", "about"]) || "";
  const address = pick(p, ["address", "adresse"]);

  const [descResult, geo] = await Promise.all([
    translateToAllAuto(description, "de"),
    address ? geocodeAddress(address) : Promise.resolve(null),
  ]);

  const { data: member, error } = await supabase
    .from("members")
    .insert({
      name,
      description: descResult.ml,
      address,
      phone: pick(p, ["phone", "telefon", "tel"]),
      email: pick(p, ["email", "e-mail", "mail"]),
      website_url: pick(p, ["website", "url", "web"]),
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      canton: geo?.canton ?? null,
      source_lang: descResult.sourceLang,
      status: "published",
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("membership_applications")
    .update({ status: "converted" })
    .eq("id", id);

  revalidatePath("/admin/applications");
  redirect(`/admin/members/${member.id}`);
}

export async function archiveApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase
    .from("membership_applications")
    .update({ status: "archived" })
    .eq("id", id);
  revalidatePath("/admin/applications");
}

export async function deleteApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("membership_applications").delete().eq("id", id);
  revalidatePath("/admin/applications");
}
