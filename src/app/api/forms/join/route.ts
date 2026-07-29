import { NextResponse } from "next/server";
import { sendAdminMembershipApplication } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecipient, isHoneypotTripped, parseFormPayload } from "@/lib/forms";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { uploadImage } from "@/lib/storage";
import { sanitizeExternalUrl } from "@/lib/url";
import { APPLICATION_REQUIRED_FIELDS } from "@/lib/types";

// Muss mit der Prüfung im Formular übereinstimmen.
const MAX_LOGO_BYTES = 4 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Mitgliedsantrag. Erhebt alle Angaben, die später öffentlich erscheinen —
 * inklusive Logo —, damit der Admin beim Prüfen genau das sieht, was live
 * gehen würde.
 *
 * Der Endpunkt ist öffentlich und ungeschützt: Rate-Limit, Honeypot,
 * Feldlängen (parseFormPayload) und harte Grenzen für den Datei-Upload sind
 * die einzige Verteidigung.
 */
export async function POST(request: Request) {
  try {
    if (!rateLimit(`join:${clientIp(request)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
    }

    // Die Datei separat greifen: parseFormPayload macht aus allen Werten
    // Strings, ein File würde zu "[object File]".
    let logoFile: File | null = null;
    let parsed: Record<string, string>;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const candidate = form.get("logo");
      if (candidate instanceof File && candidate.size > 0) logoFile = candidate;
      form.delete("logo");
      parsed = await parseFormPayload(
        new Request(request.url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(Object.fromEntries(form.entries())),
        }),
      );
    } else {
      parsed = await parseFormPayload(request);
    }

    if (isHoneypotTripped(parsed)) return NextResponse.json({ ok: true });

    // Pflichtfelder serverseitig prüfen — die Client-Validierung ist Komfort,
    // keine Absicherung.
    const missing = APPLICATION_REQUIRED_FIELDS.filter((f) => !parsed[f]?.trim());
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Pflichtfelder fehlen: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    if (logoFile) {
      if (logoFile.size > MAX_LOGO_BYTES) {
        return NextResponse.json({ error: "Das Logo ist zu gross (max. 4 MB)." }, { status: 413 });
      }
      if (!LOGO_TYPES.includes(logoFile.type)) {
        return NextResponse.json(
          { error: "Bitte ein Bild hochladen (PNG, JPG, SVG oder WebP)." },
          { status: 415 },
        );
      }
    }

    const payload: Record<string, string> = {
      ...parsed,
      website_url: sanitizeExternalUrl(parsed.website_url) ?? "",
      source: "public_join",
    };

    // Logo hochladen, bevor gespeichert wird. Schlägt der Upload fehl, bricht
    // der Antrag NICHT ab — die Angaben sind wichtiger als das Bild, und der
    // Admin sieht beim Prüfen, dass das Logo fehlt.
    let logoUrl: string | null = null;
    if (logoFile) {
      try {
        logoUrl = await uploadImage("logos", logoFile);
      } catch (err) {
        console.error("application logo upload failed:", err);
      }
    }

    const supabase = createAdminClient();
    const { error: dbErr } = await supabase.from("membership_applications").insert({
      payload,
      kind: "membership",
      status: "new",
      logo_url: logoUrl,
    });
    if (dbErr) {
      console.error("save application failed:", dbErr);
      return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
    }

    const to = await getRecipient("membership_email");
    if (to) {
      try {
        await sendAdminMembershipApplication({
          to,
          payload,
          replyTo: payload.email || undefined,
        });
      } catch (err) {
        console.error("membership email failed (application still saved):", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("join form failed:", err);
    return NextResponse.json({ error: "Antrag fehlgeschlagen." }, { status: 500 });
  }
}
