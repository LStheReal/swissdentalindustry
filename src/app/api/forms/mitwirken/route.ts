import { NextResponse } from "next/server";
import { sendAdminContactInquiry } from "@/lib/email";
import { getRecipient, parseFormPayload } from "@/lib/forms";

// "Mitwirken"-Formular: leitet die Eingaben per E-Mail weiter.
export async function POST(request: Request) {
  try {
    const payload = await parseFormPayload(request);
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
