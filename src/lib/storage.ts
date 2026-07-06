import { createAdminClient } from "./supabase/admin";
import sharp from "sharp";

export type BucketName = "logos" | "news";

type PreparedUpload = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

async function prepareLogoUpload(file: File): Promise<PreparedUpload> {
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
