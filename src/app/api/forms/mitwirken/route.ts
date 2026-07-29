import { NextResponse } from "next/server";
import { sendAdminContactInquiry } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecipient, isHoneypotTripped, parseFormPayload } from "@/lib/forms";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// "Mitwirken"-Formular: speichert die Eingaben UND benachrichtigt per Mail.
// Speichern zuerst — sonst geht die Einsendung verloren, sobald SMTP fehlt
// oder klemmt (der Absender sah nur "Versand fehlgeschlagen").
export async function POST(request: Request) {
  try {
    if (!rateLimit(`mitwirken:${clientIp(request)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
    }

    const parsed = await parseFormPayload(request);
    if (isHoneypotTripped(parsed)) return NextResponse.json({ ok: true });

    const payload: Record<string, string> = { ...parsed, source: "public_mitwirken" };

    const supabase = createAdminClient();
    const { error: dbErr } = await supabase
      .from("membership_applications")
      .insert({ payload, status: "new" });
    if (dbErr) {
      console.error("save mitwirken failed:", dbErr);
      return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
    }

    const to = await getRecipient("mitwirken_email");
    if (to) {
      try {
        await sendAdminContactInquiry({
          to,
          payload,
          kind: "mitwirken",
          replyTo: payload.email || undefined,
        });
      } catch (err) {
        console.error("mitwirken email failed (message still saved):", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mitwirken form failed:", err);
    return NextResponse.json({ error: "Versand fehlgeschlagen." }, { status: 500 });
  }
}
