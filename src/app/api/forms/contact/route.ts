import { NextResponse } from "next/server";
import { sendAdminContactInquiry } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecipient, isHoneypotTripped, parseFormPayload } from "@/lib/forms";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
    }

    const parsed = await parseFormPayload(request);
    // Bots bekommen ein „ok", damit sie nichts lernen — gespeichert wird nichts.
    if (isHoneypotTripped(parsed)) return NextResponse.json({ ok: true });

    const payload: Record<string, string> = {
      ...parsed,
      source: "public_contact",
    };

    const supabase = createAdminClient();
    const { error: dbErr } = await supabase
      .from("membership_applications")
      .insert({ payload, kind: "inquiry", status: "new" });
    if (dbErr) {
      console.error("save contact failed:", dbErr);
      return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
    }

    const to = (await getRecipient("mitwirken_email")) || (await getRecipient("membership_email"));
    if (to) {
      try {
        await sendAdminContactInquiry({
          to,
          payload,
          kind: "kontakt",
          replyTo: payload.email || undefined,
        });
      } catch (err) {
        console.error("contact email failed (message still saved):", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact form failed:", err);
    return NextResponse.json({ error: "Kontaktanfrage fehlgeschlagen." }, { status: 500 });
  }
}
