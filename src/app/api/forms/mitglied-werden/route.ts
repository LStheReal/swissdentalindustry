import { NextResponse } from "next/server";
import { sendAdminMembershipApplication } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecipient, isHoneypotTripped, parseFormPayload } from "@/lib/forms";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// "Mitglied werden"-Fragebogen: speichert den Antrag UND benachrichtigt per Mail.
export async function POST(request: Request) {
  try {
    if (!rateLimit(`mitglied-werden:${clientIp(request)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
    }

    const payload = await parseFormPayload(request);
    if (isHoneypotTripped(payload)) return NextResponse.json({ ok: true });

    // Antrag speichern (auch wenn der Mailversand scheitern sollte).
    const supabase = createAdminClient();
    const { error: dbErr } = await supabase
      .from("membership_applications")
      .insert({ payload, status: "new" });
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
    console.error("mitglied-werden form failed:", err);
    return NextResponse.json({ error: "Antrag fehlgeschlagen." }, { status: 500 });
  }
}
