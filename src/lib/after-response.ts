import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { translateFields } from "./translate";
import { geocodeAddress } from "./geocode";
import { createAdminClient } from "./supabase/admin";
import { LOCALES, type Locale, type Multilingual } from "./types";

/**
 * Übersetzungen blockieren keine Server-Action mehr.
 *
 * Ein Claude-Aufruf dauert gemessen ~7 Sekunden. Vorher wartete der Admin
 * genau so lange auf die Antwort — der Button sah kaputt aus. Stattdessen:
 * sofort mit dem Originaltext in allen vier Sprachen speichern, antworten, und
 * die echten Übersetzungen danach nachtragen.
 *
 * Der Preis: für ein paar Sekunden steht auf /fr der deutsche Text. Das ist
 * unauffälliger als eine Seite, die nicht reagiert.
 */

/** Derselbe Text in allen vier Sprach-Slots — der Platzhalter bis zur Übersetzung. */
export function provisionalMultilingual(text: string): Multilingual {
  return Object.fromEntries(LOCALES.map((l) => [l, text])) as Multilingual;
}

/**
 * Übersetzt die angegebenen Felder nach der Antwort und schreibt sie in die
 * Zeile nach. Fehler werden nur geloggt: der Originaltext steht schon in der
 * Datenbank, es geht also nie Inhalt verloren.
 *
 * @param table    Tabelle, z.B. "news" oder "members"
 * @param id       Zeilen-ID
 * @param fields   Spalte → Originaltext (leere Texte werden übersprungen)
 * @param paths    Pfade, die nach dem Nachtragen neu gebaut werden
 */
export function translateAfterResponse({
  table,
  id,
  fields,
  sourceLang,
  paths = [],
}: {
  table: string;
  id: string;
  fields: Record<string, string>;
  sourceLang: Locale;
  paths?: string[];
}): void {
  const pending = Object.fromEntries(
    Object.entries(fields).filter(([, text]) => text.trim().length > 0),
  );
  if (Object.keys(pending).length === 0) return;

  after(async () => {
    try {
      const translated = await translateFields(pending, sourceLang);
      const supabase = createAdminClient();
      const { error } = await supabase.from(table).update(translated).eq("id", id);
      if (error) throw new Error(error.message);
      for (const path of paths) revalidatePath(path);
    } catch (err) {
      console.error(`deferred translation for ${table}/${id} failed:`, err);
    }
  });
}

/**
 * Geokodiert die Adresse nach der Antwort und trägt Koordinaten + Kanton nach.
 * Bis dahin fehlt der Punkt auf der Karte — die Firma selbst ist aber schon da.
 */
export function geocodeAfterResponse({
  memberId,
  address,
}: {
  memberId: string;
  address: string | null;
}): void {
  if (!address?.trim()) return;

  after(async () => {
    try {
      const geo = await geocodeAddress(address);
      if (!geo) return;
      const supabase = createAdminClient();
      await supabase
        .from("members")
        .update({ lat: geo.lat, lng: geo.lng, canton: geo.canton })
        .eq("id", memberId);
      revalidatePath("/members");
      revalidatePath(`/members/${memberId}`);
    } catch (err) {
      console.error(`deferred geocoding for member ${memberId} failed:`, err);
    }
  });
}
