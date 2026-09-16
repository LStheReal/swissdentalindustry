import { createAdminClient } from "./supabase/admin";

export type BucketName = "logos" | "news";

type PreparedUpload = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

/**
 * sharp wird erst geladen, wenn tatsächlich ein Logo verarbeitet wird — nicht
 * beim Import dieser Datei.
 *
 * sharp ist ein natives Modul (libvips). Mit einem statischen Import lädt jede
 * Seite, deren Modulgraph irgendwo storage.ts enthält, beim Start die native
 * Bibliothek mit. Genau das hat am 2026-09-16 das halbe Admin-Portal und das
 * öffentliche Antragsformular lahmgelegt: auf Vercel fehlte die libvips-Datei
 * (siehe package.json — sharp ist deshalb exakt auf die Version gepinnt, die
 * Next.js selbst mitbringt), und schon das Öffnen der Mitgliederliste oder das
 * Umschalten der Sprache endete in einem 500 — obwohl dabei nie ein Bild
 * verarbeitet wird.
 *
 * Jetzt trifft ein solcher Fehler nur noch den Upload selbst, und dort fangen
 * die Aufrufer ihn ab (Antrag wird trotzdem gespeichert, der Grund steht beim
 * Antrag).
 *
 * Bewusst KEIN Rückfall auf "Originaldatei hochladen": das Neu-Kodieren ist
 * zugleich die Bereinigung. Ein SVG mit eingebettetem Script würde sonst
 * unverändert im öffentlichen Bucket liegen.
 */
let sharpModule: Promise<typeof import("sharp")> | null = null;
async function loadSharp() {
  sharpModule ??= import("sharp").then((m) => m.default ?? m).catch((err) => {
    // Nicht dauerhaft zwischenspeichern — ein vorübergehender Fehler soll den
    // nächsten Versuch nicht auch scheitern lassen.
    sharpModule = null;
    throw new Error(
      `Bildverarbeitung nicht verfügbar: ${err instanceof Error ? err.message : String(err)}`,
    );
  });
  return sharpModule;
}

/** Exportiert für tests/meta/sharp-native-deploy.test.ts. */
export async function prepareLogoUpload(file: File): Promise<PreparedUpload> {
  const sharp = await loadSharp();
  const input = Buffer.from(await file.arrayBuffer());
  const baseImage = sharp(input, { failOn: "none" }).rotate();
  const metadata = await baseImage.metadata();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const longestEdge = Math.max(width, height, 1);
  let targetLongestEdge = longestEdge;

  if (longestEdge < 480) {
    targetLongestEdge = Math.min(480, Math.round(longestEdge * 3));
  } else if (longestEdge > 1400) {
    targetLongestEdge = 1400;
  }

  const resizeOptions =
    width > 0 && height > 0
      ? width >= height
        ? { width: targetLongestEdge }
        : { height: targetLongestEdge }
      : {};

  const processed = baseImage
    .trim()
    .resize({
      ...resizeOptions,
      fit: "inside",
      withoutEnlargement: targetLongestEdge <= longestEdge,
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 1.1, m1: 0.7, m2: 1.6 });

  if (metadata.hasAlpha) {
    return {
      buffer: await processed.png({ compressionLevel: 9, palette: true }).toBuffer(),
      contentType: "image/png",
      ext: "png",
    };
  }

  return {
    buffer: await processed.webp({ quality: 92, effort: 4 }).toBuffer(),
    contentType: "image/webp",
    ext: "webp",
  };
}

/**
 * Lädt eine Bilddatei in einen öffentlichen Storage-Bucket und gibt die
 * öffentliche URL zurück. Upload läuft über den Service-Role-Client.
 * Gibt `null` zurück, wenn keine Datei übergeben wurde.
 */
export async function uploadImage(
  bucket: BucketName,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const supabase = createAdminClient();
  const prepared =
    bucket === "logos"
      ? await prepareLogoUpload(file)
      : {
          buffer: Buffer.from(await file.arrayBuffer()),
          contentType: file.type || "application/octet-stream",
          ext: file.name.split(".").pop()?.toLowerCase() || "bin",
        };
  const path = `${crypto.randomUUID()}.${prepared.ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, prepared.buffer, {
    contentType: prepared.contentType,
    upsert: false,
  });
  if (error) throw new Error(`Upload fehlgeschlagen: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
