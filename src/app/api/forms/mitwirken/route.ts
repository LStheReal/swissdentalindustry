import { NextResponse } from "next/server";
import { sendAdminContactInquiry } from "@/lib/email";
import { getRecipient, isHoneypotTripped, parseFormPayload } from "@/lib/forms";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// "Mitwirken"-Formular: leitet die Eingaben per E-Mail weiter.
export async function POST(request: Request) {
  try {
    if (!rateLimit(`mitwirken:${clientIp(request)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
    }

    const payload = await parseFormPayload(request);
    if (isHoneypotTripped(payload)) return NextResponse.json({ ok: true });
    const to = await getRecipient("mitwirken_email");
    if (!to) {
      return NextResponse.json(
        { error: "Keine Empfänger-Adresse konfiguriert." },
        { status: 500 },
      );
    }

    await sendAdminContactInquiry({
      to,
      payload,
      kind: "mitwirken",
      replyTo: payload.email || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mitwirken form failed:", err);
    return NextResponse.json({ error: "Versand fehlgeschlagen." }, { status: 500 });
  }
}
