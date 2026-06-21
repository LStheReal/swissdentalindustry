import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import {
  LOGO_CID,
  adminInviteMailSubject,
  changeApprovedMailSubject,
  renderAdminChangeMail,
  renderAdminContactInquiry,
  renderAdminInviteMail,
  renderAdminMembershipApplication,
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

/**
 * Versendet eine E-Mail über das konfigurierte SMTP-Postfach.
 * Wirft bei Fehler — der Aufrufer entscheidet, ob das den Flow abbricht.
 */
export async function sendMail({ to, subject, text, html, replyTo, attachments }: MailInput) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({ from, to, subject, text, html, replyTo, attachments });
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
