"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateToAll } from "@/lib/translate";
import { cleanDescription, stripDuplicatedName } from "@/lib/description";
import { geocodeAddress } from "@/lib/geocode";
import { sanitizeExternalUrl } from "@/lib/url";
import { formatAddress, formatAddressOneLine, normalizeAddress } from "@/lib/address";
import { applyMemberPatch } from "@/lib/member-write";
import { saveInternalProfile } from "@/lib/member-internal-profiles";
import {
  sendApplicationApprovedMail,
  sendApplicationRejectedMail,
} from "@/lib/email";
import {
  LOCALES,
  normalizeMemberInternalProfile,
  type ApplicationPayload,
  type Locale,
  type MembershipApplication,
  type Multilingual,
} from "@/lib/types";

/**
 * Sprache, in der der Antrag gestellt wurde. Das Formular schickt sie mit;
 * bei Anträgen von vor dieser Änderung fehlt sie — dann Deutsch.
 */
function applicantLocale(payload: ApplicationPayload): Locale {
  const value = (payload.locale || "").trim() as Locale;
  return LOCALES.includes(value) ? value : "de";
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

async function loadApplication(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<MembershipApplication | null> {
  const { data } = await supabase
    .from("membership_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as MembershipApplication) ?? null;
}

/**
 * Antrag annehmen: legt die Firma als ENTWURF an, erzeugt den
 * Self-Service-Link und schickt die Zusage.
 *
 * Annehmen und Veröffentlichen sind bewusst zwei Schritte. Der Antrag ist
 * damit entschieden und die Firma aufgenommen, aber im Verzeichnis steht sie
 * erst, wenn jemand sie ausdrücklich online schaltet.
 */
export async function approveApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const app = await loadApplication(supabase, id);
  if (!app) return;

  // Doppelklick-Schutz. Den Antrag SOFORT beanspruchen — mit einem
  // bedingten Update, das nur greift, solange der Status noch 'new' ist.
  // Die Datenbank entscheidet damit, welcher Klick gewinnt; ein "erst lesen,
  // dann schreiben" reicht nicht, weil zwei parallele Klicks beide 'new'
  // lesen, bevor einer schreibt — genau so entstanden doppelte Mitglieder.
  const { data: claimed } = await supabase
    .from("membership_applications")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "new")
    .select("id")
    .maybeSingle();

  if (!claimed) {
    // Ein anderer Klick war schneller (oder der Antrag ist längst entschieden).
    const current = await loadApplication(supabase, id);
    redirect(
      current?.member_id ? `/admin/members/${current.member_id}` : "/admin/applications",
    );
  }

  const p = app.payload;
  const name = (p.company || "").trim() || "Neue Firma";
  // Antragsteller tippen den Firmennamen gerne noch einmal vor die
  // Beschreibung — hier fliegt die Doppelnennung raus, bevor sie gespeichert
  // und in vier Sprachen übersetzt wird (siehe lib/description.ts).
  const description = stripDuplicatedName(name, (p.description || "").trim());
  const address = normalizeAddress(p);
  const email = (p.email || "").trim() || null;

  // Die Sprache steht im Antrag — die Spracherkennung via Claude (~4s) entfällt.
  const sourceLang = applicantLocale(p);

  // Erst mit dem Originaltext in allen vier Slots anlegen, damit sofort etwas
  // Lesbares dasteht. Die echten Übersetzungen kommen unten in `after()` nach.
  const provisionalDescription = Object.fromEntries(
    LOCALES.map((l) => [l, description]),
  ) as Multilingual;

  const { data: member, error } = await supabase
    .from("members")
    .insert({
      name,
      logo_url: app.logo_url,
      description: provisionalDescription,
      ...address,
      // `address` ist seit Migration 0013 nur noch Archiv des Freitexts.
      address: formatAddress(address) || null,
      address_needs_review: false,
      phone: (p.phone || "").trim() || null,
      email,
      website_url: sanitizeExternalUrl(p.website_url ?? null),
      lat: null,
      lng: null,
      canton: null,
      source_lang: sourceLang,
      // Annehmen heisst aufgenommen, nicht veröffentlicht. Die Firma erscheint
      // erst, wenn ein Admin sie im Mitglieder-Detail online schaltet.
      status: "draft",
      is_active: true,
      // Mitglied seit = Tag der Aufnahme. Wird hier gesetzt, damit der Admin
      // es nicht nachtragen muss; im Mitglieder-Formular bleibt es änderbar.
      member_since: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (error) {
    // Anspruch zurückgeben, sonst hängt der Antrag als "angenommen" ohne
    // Mitglied fest und lässt sich nicht erneut annehmen.
    await supabase
      .from("membership_applications")
      .update({ status: "new", reviewed_at: null })
      .eq("id", id);
    throw new Error(error.message);
  }

  // Die Kontaktperson aus dem Antrag wird das erste Mitglied dieses Partners.
  // Weitere Personen legt der Admin im Mitglieder-Detail an ("Mitglied
  // hinzufügen"), fortlaufend nummeriert. Die Adresse bleibt bewusst aussen vor
  // — sie gehört zur Firma, nicht zur Person.
  const contact = (p.contact_person || "").trim();
  const spaceIdx = contact.lastIndexOf(" ");
  await saveInternalProfile(
    supabase,
    member.id,
    normalizeMemberInternalProfile({
      member_number: "1",
      contact_first_name: spaceIdx > 0 ? contact.slice(0, spaceIdx) : contact || null,
      contact_last_name: spaceIdx > 0 ? contact.slice(spaceIdx + 1) : null,
      direct_email: email,
      direct_phone: (p.phone || "").trim() || null,
    }),
  );

  // Self-Service-Token erzeugen (ein aktiver pro Firma).
  const token = randomBytes(32).toString("base64url");
  const { error: tokenErr } = await supabase.from("member_edit_tokens").insert({
    member_id: member.id,
    token,
    is_active: true,
  });
  if (tokenErr) throw new Error(tokenErr.message);

  // Status steht schon (siehe Anspruch oben) — hier fehlt nur die Verknüpfung.
  await supabase
    .from("membership_applications")
    .update({ member_id: member.id })
    .eq("id", id);

  // Die Zusage ist die wichtigste Mail des Systems — sie enthält den einzigen
  // Link, über den die Firma je an ihr Profil kommt. Sie geht deshalb NOCH VOR
  // der Antwort raus (~2s SMTP), statt in `after()`.
  //
  // Vorher stand sie am Ende eines `after()`-Blocks, hinter Übersetzung und
  // Geocoding. Die Anreicherung lief dort nachweislich durch (members.updated_at
  // ~7s nach dem Anlegen), die Mail danach kam trotzdem nie an — während die
  // Absage-Mail und der manuelle Link-Versand, die synchron verschicken,
  // zuverlässig ankamen. Kritischer Versand hängt jetzt nicht mehr davon ab,
  // dass nach der Antwort noch Arbeit ausgeführt wird.
  //
  // Ein Mail-Fehler darf die Aufnahme nicht rückgängig machen — der Admin kann
  // den Link im Mitglieder-Detail erneut senden.
  if (email) {
    try {
      await sendApplicationApprovedMail({
        to: email,
        memberName: name,
        editUrl: `${appBaseUrl()}/edit/${token}`,
        locale: sourceLang,
      });
    } catch (err) {
      console.error("application approved mail failed:", err);
    }
  }

  // Übersetzung und Geocoding sind reine Anreicherung: schlagen sie fehl, steht
  // trotzdem überall der Originaltext. Die dürfen nach der Antwort laufen.
  after(async () => {
    try {
      const [ml, geo] = await Promise.all([
        description ? translateToAll(description, sourceLang) : Promise.resolve(null),
        formatAddressOneLine(address)
          ? geocodeAddress(formatAddressOneLine(address))
          : Promise.resolve(null),
      ]);
      const patch: Record<string, unknown> = {};
      if (ml) patch.description = cleanDescription(name, ml);
      if (geo) {
        patch.lat = geo.lat;
        patch.lng = geo.lng;
        patch.canton = geo.canton;
      }
      if (Object.keys(patch).length > 0) {
        // Über den einen Schreibpfad: die Firma ist gerade als Entwurf
        // angelegt worden, die Anreicherung darf daran nichts ändern.
        await applyMemberPatch(supabase, member.id, patch);
        revalidatePath(`/admin/members/${member.id}`);
      }
    } catch (err) {
      console.error("post-approval enrichment failed:", err);
    }
  });

  revalidatePath("/admin/applications");
  revalidatePath("/admin/members");
  redirect(`/admin/members/${member.id}`);
}

/**
 * Antrag ablehnen. Die Begründung ist optional, geht aber — falls angegeben —
 * unverändert an die Firma.
 */
export async function rejectApplication(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const app = await loadApplication(supabase, id);
  if (!app) return;

  const reason = String(formData.get("reason") || "").trim().slice(0, 2000) || null;

  // Wie beim Annehmen: nur ablehnen, solange der Antrag offen ist. Sonst
  // schickt ein Doppelklick zwei Absagen an dieselbe Firma.
  const { data: claimed } = await supabase
    .from("membership_applications")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "new")
    .select("id")
    .maybeSingle();
  if (!claimed) {
    revalidatePath("/admin/applications");
    return;
  }

  // Die Absage nach der Antwort verschicken — der SMTP-Versand darf den Admin
  // nicht warten lassen (die Ablehnung selbst ist oben schon gespeichert).
  const email = (app.payload.email || "").trim();
  if (email) {
    after(async () => {
      try {
        await sendApplicationRejectedMail({
          to: email,
          memberName: (app.payload.company || "").trim() || email,
          reason,
          locale: applicantLocale(app.payload),
        });
      } catch (err) {
        console.error("application rejected mail failed:", err);
      }
    });
  }

  revalidatePath("/admin/applications");
}

export async function archiveApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase
    .from("membership_applications")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("status", "new");
  revalidatePath("/admin/applications");
}

export async function deleteApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("membership_applications").delete().eq("id", id);
  revalidatePath("/admin/applications");
}
