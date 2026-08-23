"use server";

import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";
import { renderMassMail } from "@/lib/email-templates";
import {
  renderMassMailHtml,
  renderMassMailText,
  recipientsWithGaps,
  unknownPlaceholders,
  type MassMailRecipient,
} from "@/lib/mass-mail";
import { listContactPersons } from "@/lib/member-internal-profiles";
import type { Member } from "@/lib/types";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

export interface MassMailState {
  step?: "compose" | "preview" | "sent";
  error?: string;
  subject?: string;
  body?: string;
  recipients?: MassMailRecipient[];
  skipped?: { company: string; reason: string }[];
  unknownTokens?: string[];
  gaps?: { company: string; missing: string[] }[];
  samplePreview?: { to: string; subject: string; text: string };
  sentCount?: number;
  failedCount?: number;
  failures?: { company: string; email: string; error: string }[];
}

/**
 * Empfänger bestimmen: je Firma der Hauptkontakt.
 *
 * Ohne Hauptkontakt oder ohne Adresse wird die Firma übersprungen und in der
 * Vorschau namentlich aufgeführt — stillschweigend auszulassen wäre das
 * Schlimmste, was ein Serienbrief tun kann.
 */
async function collectRecipients(): Promise<{
  recipients: MassMailRecipient[];
  skipped: { company: string; reason: string }[];
}> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, name, email")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);

  const members = (data ?? []) as Pick<Member, "id" | "name" | "email">[];
  const recipients: MassMailRecipient[] = [];
  const skipped: { company: string; reason: string }[] = [];

  for (const member of members) {
    const contacts = await listContactPersons(supabase, member.id);
    const main = contacts.find((c) => c.roles.includes("main"));

    const email = (main?.direct_email || member.email || "").trim();
    if (!email) {
      skipped.push({
        company: member.name,
        reason: main
          ? "Hauptkontakt ohne E-Mail-Adresse"
          : "Kein Hauptkontakt hinterlegt und keine Firmen-Adresse",
      });
      continue;
    }

    recipients.push({
      memberId: member.id,
      company: member.name,
      email,
      firstName: main?.contact_first_name ?? "",
      lastName: main?.contact_last_name ?? "",
      editUrl: `${appBaseUrl()}/edit/${await activeEditToken(supabase, member.id)}`,
    });
  }

  return { recipients, skipped };
}

/**
 * Den bestehenden Bearbeitungs-Link verwenden, nicht rotieren. Ein neuer Token
 * würde die Links aus allen früheren Mails ungültig machen.
 */
async function activeEditToken(
  supabase: ReturnType<typeof createAdminClient>,
  memberId: string,
): Promise<string> {
  const { data } = await supabase
    .from("member_edit_tokens")
    .select("token")
    .eq("member_id", memberId)
    .eq("is_active", true)
    .maybeSingle();
  if (data?.token) return data.token as string;

  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase
    .from("member_edit_tokens")
    .insert({ member_id: memberId, token, is_active: true });
  if (error) throw new Error(error.message);
  return token;
}

export async function previewMassMail(
  _prev: MassMailState,
  formData: FormData,
): Promise<MassMailState> {
  await requireAdmin();

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!subject || !body) {
    return { step: "compose", subject, body, error: "Betreff und Text werden gebraucht." };
  }

  const { recipients, skipped } = await collectRecipients();
  if (recipients.length === 0) {
    return { step: "compose", subject, body, error: "Es gibt keine erreichbaren Empfänger." };
  }

  const sample = recipients[0];
  return {
    step: "preview",
    subject,
    body,
    recipients,
    skipped,
    unknownTokens: unknownPlaceholders(body),
    gaps: recipientsWithGaps(body, recipients).map((entry) => ({
      company: entry.recipient.company,
      missing: entry.missing,
    })),
    samplePreview: {
      to: sample.email,
      subject: renderMassMailText(subject, sample),
      text: renderMassMailText(body, sample),
    },
  };
}

export async function sendMassMail(
  _prev: MassMailState,
  formData: FormData,
): Promise<MassMailState> {
  await requireAdmin();

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  // Ausdrückliche Bestätigung — ohne sie wird nicht verschickt.
  if (formData.get("confirm") !== "1") {
    return { step: "preview", subject, body, error: "Bitte den Versand bestätigen." };
  }
  if (!subject || !body) {
    return { step: "compose", subject, body, error: "Betreff und Text werden gebraucht." };
  }

  const { recipients, skipped } = await collectRecipients();

  let sentCount = 0;
  const failures: { company: string; email: string; error: string }[] = [];

  // Bewusst nacheinander: ein Serienversand über den SMTP-Server der
  // Geschäftsstelle soll nicht wie ein Burst aussehen.
  for (const recipient of recipients) {
    try {
      const { html } = renderMassMail({
        subject: renderMassMailText(subject, recipient),
        bodyHtml: renderMassMailHtml(body, recipient),
      });
      await sendMail({
        to: recipient.email,
        subject: renderMassMailText(subject, recipient),
        text: renderMassMailText(body, recipient),
        html,
      });
      sentCount++;
    } catch (err) {
      failures.push({
        company: recipient.company,
        email: recipient.email,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    step: "sent",
    subject,
    body,
    sentCount,
    failedCount: failures.length,
    failures,
    skipped,
  };
}
