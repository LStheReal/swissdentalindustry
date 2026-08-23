import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  LOGO_CID,
  adminInviteMailSubject,
  applicationApprovedSubject,
  applicationRejectedSubject,
  changeApprovedMailSubject,
  renderAdminChangeMail,
  renderAdminContactInquiry,
  renderAdminInviteMail,
  renderAdminMembershipApplication,
  renderApplicationApprovedMail,
  renderApplicationRejectedMail,
  renderChangeApprovedMail,
  renderWelcomeMail,
  welcomeMailSubject,
} from "./email-templates";
import type { Locale } from "./types";

// Pfad zum Logo, das als CID-Inline-Attachment in alle Member-Mails
// eingebettet wird (siehe LOGO_CID in email-templates.ts).
const LOGO_PATH = path.join(process.cwd(), "public/sdi/logo.png");

function logoAttachment() {
  return {
    filename: "swiss-dental-industry.png",
    path: LOGO_PATH,
    cid: LOGO_CID,
  };
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; path: string; cid?: string }>;
}

function parseRecipients(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

/**
 * Lädt den Test-Modus aus app_settings. Im Test-Modus werden ausgehende
 * Mails nur an die explizit freigegebenen Adressen zugestellt.
 */
async function loadTestModeFilter(): Promise<{ enabled: boolean; allow: Set<string> }> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("app_settings")
      .select("email_test_mode, email_test_recipients")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return { enabled: false, allow: new Set() };
    return {
      enabled: data.email_test_mode !== false,
      allow: new Set(parseRecipients(data.email_test_recipients)),
    };
  } catch (err) {
    // Im Zweifel sperren: nichts versenden, statt Kunden anzuschreiben.
    console.error("email test-mode lookup failed, blocking send:", err);
    return { enabled: true, allow: new Set() };
  }
}

/**
 * Versendet eine E-Mail über das konfigurierte SMTP-Postfach.
 * Wirft bei Fehler — der Aufrufer entscheidet, ob das den Flow abbricht.
 *
 * Test-Modus: ist in app_settings `email_test_mode` aktiv, werden nur die
 * unter `email_test_recipients` aufgeführten Adressen tatsächlich angeschrieben.
 */
/**
 * Hält jeden Sendeversuch fest — auch die erfolgreichen und die im Test-Modus
 * verworfenen.
 *
 * Vorher landete jeder Mailfehler nur auf der Server-Konsole. Auf Vercel ist
 * die nach kurzer Zeit weg, und im Admin-Portal war sie nie sichtbar; genau
 * deshalb liess sich "die Mail kommt nicht an" nicht beantworten. Das
 * Protokoll selbst darf dabei nie den Versand umwerfen.
 */
async function logMail(entry: {
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "dropped_test_mode";
  error?: string | null;
  providerResponse?: string | null;
  context?: string | null;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("mail_log").insert({
      recipient: entry.recipient.slice(0, 500),
      subject: entry.subject.slice(0, 500),
      status: entry.status,
      error: entry.error?.slice(0, 2000) ?? null,
      provider_response: entry.providerResponse?.slice(0, 1000) ?? null,
      context: entry.context ?? null,
    });
  } catch (err) {
    console.error("mail_log insert failed (send itself is unaffected):", err);
  }
}

export async function sendMail({ to, subject, text, html, replyTo, attachments }: MailInput) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  // Ohne konfigurierten Host würde nodemailer erst in einen Verbindungs-Timeout
  // laufen — das hat Server-Actions sekundenlang blockiert. Lieber sofort und
  // deutlich scheitern; die Aufrufer behandeln Mailfehler bereits als unkritisch.
  if (!process.env.SMTP_HOST) {
    const message = "SMTP_HOST ist nicht gesetzt — es wird keine Mail verschickt.";
    await logMail({ recipient: to, subject, status: "failed", error: message });
    throw new Error(message);
  }

  const filter = await loadTestModeFilter();
  if (filter.enabled) {
    const requested = parseRecipients(to);
    const allowed = requested.filter((addr) => filter.allow.has(addr));
    if (allowed.length === 0) {
      console.info(
        `[email test-mode] dropped mail to "${to}" (subject: "${subject}") — no recipient on allow-list`,
      );
      await logMail({
        recipient: to,
        subject,
        status: "dropped_test_mode",
        error: "Test-Modus aktiv und kein Empfänger auf der Freigabeliste.",
      });
      return;
    }
    to = allowed.join(", ");
    subject = `[TEST] ${subject}`;
  }

  try {
    const info = await getTransporter().sendMail({
      from,
      to,
      subject,
      text,
      html,
      replyTo,
      attachments,
    });
    // Die Antwort des Servers mitschreiben. "250 Ok: queued as …" heisst
    // angenommen — NICHT zugestellt; genau diese Unterscheidung hat hier
    // einmal Tage gekostet.
    await logMail({
      recipient: to,
      subject,
      status: "sent",
      providerResponse:
        typeof info?.response === "string" ? info.response : null,
    });
  } catch (err) {
    await logMail({
      recipient: to,
      subject,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/** Prüft die SMTP-Verbindung (für Test/Diagnose). */
export async function verifyMailConnection(): Promise<boolean> {
  try {
    await getTransporter().verify();
    return true;
  } catch (err) {
    console.error("SMTP verify failed:", err);
    return false;
  }
}

// ─── Helper: Basis-URL für Links in Mails ─────────────────────────────────────
function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://swissdentalindustry.ch"
  );
}

// ─── Member-bezogene Mails ────────────────────────────────────────────────────

export async function sendMemberWelcomeMail(args: {
  to: string;
  memberName: string;
  editUrl: string;
  locale?: Locale;
}) {
  const { html, text } = renderWelcomeMail({
    memberName: args.memberName,
    editUrl: args.editUrl,
    locale: args.locale,
  });
  await sendMail({
    to: args.to,
    subject: welcomeMailSubject(args.locale ?? "de"),
    text,
    html,
    attachments: [logoAttachment()],
  });
}

/** Zusage auf einen Mitgliedsantrag — enthält den Self-Service-Link. */
export async function sendApplicationApprovedMail(args: {
  to: string;
  memberName: string;
  editUrl: string;
  locale?: Locale;
}) {
  const { html, text } = renderApplicationApprovedMail({
    memberName: args.memberName,
    editUrl: args.editUrl,
    locale: args.locale,
  });
  await sendMail({
    to: args.to,
    subject: applicationApprovedSubject(args.locale ?? "de"),
    text,
    html,
    attachments: [logoAttachment()],
  });
}

/** Absage auf einen Mitgliedsantrag, optional mit Begründung. */
export async function sendApplicationRejectedMail(args: {
  to: string;
  memberName: string;
  reason?: string | null;
  locale?: Locale;
}) {
  const { html, text } = renderApplicationRejectedMail({
    memberName: args.memberName,
    reason: args.reason,
    locale: args.locale,
  });
  await sendMail({
    to: args.to,
    subject: applicationRejectedSubject(args.locale ?? "de"),
    text,
    html,
    attachments: [logoAttachment()],
  });
}

export async function sendChangeApprovedMail(args: {
  to: string;
  memberName: string;
  changes: { label: string; value: string }[];
  profileUrl?: string;
  editUrl?: string;
  locale?: Locale;
}) {
  const { html, text } = renderChangeApprovedMail({
    memberName: args.memberName,
    changes: args.changes,
    profileUrl: args.profileUrl,
    editUrl: args.editUrl,
    locale: args.locale,
  });
  await sendMail({
    to: args.to,
    subject: changeApprovedMailSubject(args.locale ?? "de"),
    text,
    html,
    attachments: [logoAttachment()],
  });
}

export async function sendAdminChangeNotification(args: {
  to: string;
  memberName: string;
  contactEmail: string | null;
  submittedAt: Date;
  changedCount: number;
  totalFields: number;
  diff: { label: string; before: string; after: string }[];
}) {
  const feedUrl = `${baseUrl()}/admin/feed`;
  const { html, text } = renderAdminChangeMail({
    memberName: args.memberName,
    contactEmail: args.contactEmail,
    submittedAt: args.submittedAt,
    feedUrl,
    changedCount: args.changedCount,
    totalFields: args.totalFields,
    diff: args.diff,
  });
  await sendMail({
    to: args.to,
    subject: `Neue Änderung im Review-Feed: ${args.memberName}`,
    text,
    html,
  });
}

export async function sendAdminMembershipApplication(args: {
  to: string;
  payload: Record<string, string>;
  replyTo?: string;
}) {
  const applicationsUrl = `${baseUrl()}/admin/applications`;
  const company = args.payload.company || args.payload.name || "Unbekannt";
  const { html, text } = renderAdminMembershipApplication({
    payload: args.payload,
    applicationsUrl,
  });
  await sendMail({
    to: args.to,
    subject: `Neue Mitgliedschafts-Anfrage: ${company}`,
    text,
    html,
    replyTo: args.replyTo,
  });
}

export async function sendAdminContactInquiry(args: {
  to: string;
  payload: Record<string, string>;
  kind: "kontakt" | "mitwirken";
  replyTo?: string;
}) {
  const { html, text } = renderAdminContactInquiry({
    payload: args.payload,
    kind: args.kind,
  });
  const name = args.payload.name || "Unbekannt";
  const subject =
    args.kind === "kontakt"
      ? `Neue Kontakt-Anfrage von ${name}`
      : `Neue Mitwirken-Anfrage von ${name}`;
  await sendMail({
    to: args.to,
    subject,
    text,
    html,
    replyTo: args.replyTo,
  });
}

export async function sendAdminInviteMail(args: {
  to: string;
  inviteUrl: string;
}) {
  const { html, text } = renderAdminInviteMail({
    email: args.to,
    inviteUrl: args.inviteUrl,
  });
  await sendMail({
    to: args.to,
    subject: adminInviteMailSubject(),
    text,
    html,
    attachments: [logoAttachment()],
  });
}
