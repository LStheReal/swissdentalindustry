import { askForJson } from "./ai";
import { LOCALES, type Locale, type Multilingual, emptyMultilingual } from "./types";

const LANGUAGE_NAMES: Record<Locale, string> = {
  de: "German",
  fr: "French",
  it: "Italian",
  en: "English",
};

/**
 * Übersetzt einen Text in alle vier Sprachen (DE/FR/IT/EN).
 * Der Originaltext bleibt in der `sourceLang`-Slot unverändert; die übrigen
 * drei Sprachen werden via Claude übersetzt.
 *
 * Schlägt eine Übersetzung fehl, wird der Originaltext als Fallback verwendet,
 * damit nie ein leeres Feld entsteht.
 */
export async function translateToAll(
  text: string,
  sourceLang: Locale,
): Promise<Multilingual> {
  const result = emptyMultilingual();
  const trimmed = (text ?? "").trim();
  if (!trimmed) return result;

  result[sourceLang] = text;
  const targets = LOCALES.filter((l) => l !== sourceLang);

  try {
    const parsed = await askForJson<Partial<Record<Locale, string>>>({
      system:
        "You are a professional translator for a Swiss dental-industry " +
        "association website. Translate accurately and keep the tone " +
        "professional. Preserve line breaks and any formatting. " +
        "The JSON keys are the requested language codes and the values are " +
        "the translations.",
      user:
        `Source language: ${LANGUAGE_NAMES[sourceLang]} (${sourceLang}).\n` +
        `Translate the text below into: ` +
        targets.map((l) => `${LANGUAGE_NAMES[l]} (${l})`).join(", ") +
        `.\nReturn JSON with keys ${targets.map((l) => `"${l}"`).join(", ")}.\n\n` +
        `Text:\n${text}`,
    });
    for (const l of targets) {
      result[l] = (parsed[l] && String(parsed[l]).trim()) || text;
    }
  } catch (err) {
    console.error("translateToAll failed, falling back to source text:", err);
    for (const l of targets) result[l] = text;
  }

  return result;
}

/**
 * Erkennt die Sprache eines Textes automatisch via Claude und liefert einen
 * der vier unterstützten Locales zurück. Bei zu kurzem Text, einem API-Fehler
 * oder einer nicht unterstützten Sprache wird `fallback` verwendet.
 */
export async function detectLanguage(
  text: string,
  fallback: Locale = "de",
): Promise<Locale> {
  const trimmed = (text ?? "").trim();
  if (trimmed.length < 8) return fallback;

  try {
    const parsed = await askForJson<{ lang?: string }>({
      system:
        "You are a language detector. Identify the dominant language of " +
        "the user's text. Respond with a JSON object of the form " +
        `{"lang":"de"} where the value is one of "de", "fr", "it", "en". ` +
        "If the text mixes languages, pick the one most of the prose is " +
        "written in. If unsure, pick the closest of the four.",
      user:
        `Return JSON {"lang":"<de|fr|it|en>"} for this text:\n\n` +
        trimmed.slice(0, 2000),
      maxTokens: 2000,
    });
    const lang = (parsed.lang || "").toLowerCase().trim();
    if ((LOCALES as readonly string[]).includes(lang)) return lang as Locale;
  } catch (err) {
    console.error("detectLanguage failed, using fallback:", err);
  }
  return fallback;
}

/**
 * Erkennt die Sprache des Textes automatisch und übersetzt anschliessend in
 * alle vier Sprachen. So landet der Originaltext immer in dem Slot, dem er
 * sprachlich entspricht — auch wenn die Firma z.B. "Deutsch" gewählt, aber
 * englischen Text eingegeben hat.
 */
export async function translateToAllAuto(
  text: string,
  fallback: Locale = "de",
): Promise<{ ml: Multilingual; sourceLang: Locale }> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return { ml: emptyMultilingual(), sourceLang: fallback };
  }
  const sourceLang = await detectLanguage(trimmed, fallback);
  const ml = await translateToAll(text, sourceLang);
  return { ml, sourceLang };
}

/**
 * Übersetzt mehrere Felder gleichzeitig (z.B. Titel + Body einer News) und
 * gibt ein Objekt gleicher Form mit Multilingual-Werten zurück.
 */
export async function translateFields<K extends string>(
  fields: Record<K, string>,
  sourceLang: Locale,
): Promise<Record<K, Multilingual>> {
  const entries = await Promise.all(
    (Object.entries(fields) as [K, string][]).map(
      async ([key, value]) => [key, await translateToAll(value, sourceLang)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<K, Multilingual>;
}
