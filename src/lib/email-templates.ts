// ════════════════════════════════════════════════════════════════════════════
// Swiss Dental Industry — E-Mail-Templates
//
// Tabellen-basiertes HTML (kompatibel zu Outlook/Gmail), Inline-Styles,
// 640px Container, Archivo + Space Mono Webfonts mit System-Fallback.
// Visuelles System: rote Signaturlinie (#e1000f) für Mitglieder-Mails,
// schwarze (#0a0a0b) für Admin-Mails.
//
// Mitglieder-Mails (welcome, change-approved) werden in der Sprache des
// Mitglieds (members.source_lang) gerendert. Admin-Mails bleiben auf Deutsch.
// ════════════════════════════════════════════════════════════════════════════

import {
  MEMBER_INTERNAL_PROFILE_KEYS,
  MEMBER_INTERNAL_PROFILE_LABELS,
  normalizeMemberInternalProfile,
  type Locale,
} from "./types";

const COLORS = {
  ink: "#0a0a0b",
  ink2: "#2e2e33",
  ink3: "#4a4a51",
  mute: "#6b6b73",
  mute2: "#9595a0",
  line: "#ececf0",
  line2: "#e2e2e7",
  surface: "#fafafa",
  surface2: "#f9f9fa",
  red: "#e1000f",
  redSoft: "#fdecec",
  redInk: "#7a0007",
  green: "#0a6d2f",
  greenSoft: "#eaf7ee",
  page: "#e7e5df",
} as const;

const ARCHIVO =
  "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO =
  "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Logo wird als Inline-Attachment via CID eingebettet (siehe LOGO_CID).
// So funktioniert es in jedem Mail-Client, ohne Abhängigkeit von einer
// öffentlich erreichbaren Bild-URL.
export const LOGO_CID = "sdi-logo";

function brandRow(): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 28px;">
    <tr>
      <td>
        <img src="cid:${LOGO_CID}" alt="Swiss Dental Industry" width="200" style="display:block;height:auto;max-width:200px;border:0;outline:none;text-decoration:none;">
      </td>
    </tr>
  </table>`;
}

function metaLabel(text: string, dotColor: string = COLORS.red): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 14px;">
    <tr>
      <td valign="middle" style="padding-right:10px;">
        <div style="width:7px;height:7px;background:${dotColor};font-size:0;line-height:0;">&nbsp;</div>
      </td>
      <td valign="middle" style="font-family:${MONO};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;">${esc(text)}</td>
    </tr>
  </table>`;
}

function h2(text: string): string {
  return `<h2 style="font-family:${ARCHIVO};font-size:30px;line-height:1.06;letter-spacing:-0.025em;font-weight:800;margin:0 0 18px;color:${COLORS.ink};">${esc(text)}</h2>`;
}

function paragraph(text: string, color: string = COLORS.ink2, margin: string = "0 0 16px"): string {
  return `<p style="font-family:${ARCHIVO};font-size:15.5px;line-height:1.65;color:${color};margin:${margin};">${esc(text)}</p>`;
}

/**
 * Wie `paragraph`, escapet den Inhalt aber NICHT — für Absätze, die bewusst
 * Markup enthalten (z.B. ein hervorgehobener Firmenname). Alles Dynamische
 * muss der Aufrufer selbst durch `esc()` schicken.
 *
 * Gibt es, weil der umgekehrte Fall in der Zusage-Mail stand: dort ging ein
 * `<strong>` durch `paragraph()` und der Empfänger las das Tag als Text.
 */
function paragraphHtml(
  html: string,
  color: string = COLORS.ink2,
  margin: string = "0 0 16px",
): string {
  return `<p style="font-family:${ARCHIVO};font-size:15.5px;line-height:1.65;color:${color};margin:${margin};">${html}</p>`;
}

function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:6px 0 0;">
    <tr>
      <td bgcolor="${COLORS.red}" style="background:${COLORS.red};border-radius:4px;">
        <a href="${esc(href)}" style="display:inline-block;font-family:${ARCHIVO};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:4px;">
          ${esc(label)} &nbsp;→
        </a>
      </td>
    </tr>
  </table>`;
}

function signOff(): string {
  return `<p style="font-family:${ARCHIVO};font-size:14.5px;line-height:1.6;color:${COLORS.ink3};margin:32px 0 0;">Freundliche Grüsse<br><span style="font-weight:600;color:${COLORS.ink};">Swiss Dental Industry · SVDI</span></p>`;
}

function freshnowLine(dark: boolean): string {
  const color = dark ? "rgba(255,255,255,0.55)" : COLORS.mute;
  return `<div style="font-family:${MONO};font-size:10px;letter-spacing:0.08em;color:${color};line-height:1.5;margin-top:6px;">Versendet durch <a href="https://freshnow.ch" style="color:${dark ? "#ffffff" : COLORS.ink};font-weight:700;text-decoration:none;">FreshNow</a> · in Zusammenarbeit mit Swiss Dental Industry</div>`;
}

function brandFooter(): string {
  return `
  <tr>
    <td style="border-top:1px solid ${COLORS.line};padding:22px 44px;font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${COLORS.mute};line-height:1.6;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td align="left" style="font-family:${MONO};font-size:11px;color:${COLORS.mute};line-height:1.6;">SVDI / ASDI · Moosstrasse 2<br>CH-3073 Gümligen — Bern</td>
          <td align="right" style="font-family:${MONO};font-size:11px;color:${COLORS.mute};line-height:1.6;">info@swissdentalindustry.ch<br>swissdentalindustry.ch</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="${COLORS.ink}" style="background:${COLORS.ink};padding:14px 44px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td align="left" valign="middle" style="font-family:${MONO};font-size:10.5px;letter-spacing:0.1em;color:rgba(255,255,255,0.55);">© ${new Date().getFullYear()} SWISS DENTAL INDUSTRY${freshnowLine(true)}</td>
          <td align="right" valign="middle" style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;color:#ef4448;font-weight:700;">SWISS MADE</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function adminFooter(scope: string): string {
  return `
  <tr>
    <td bgcolor="${COLORS.ink}" style="background:${COLORS.ink};padding:18px 44px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td align="left" valign="middle" style="font-family:${MONO};font-size:10.5px;letter-spacing:0.1em;color:rgba(255,255,255,0.55);">SDI · ${esc(scope)} · ${new Date().getFullYear()}${freshnowLine(true)}</td>
          <td align="right" valign="middle" style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;color:#ef4448;font-weight:700;">SWISS MADE</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

interface ShellOpts {
  preheader: string;
  accent: "red" | "ink";
  bodyHtml: string;
  footerHtml: string;
}

function shell({ preheader, accent, bodyHtml, footerHtml }: ShellOpts): string {
  const stripe = accent === "red" ? COLORS.red : COLORS.ink;
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Swiss Dental Industry</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:${COLORS.page}; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
  a { color:${COLORS.red}; }
  table { border-collapse:collapse; }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};font-family:${ARCHIVO};color:${COLORS.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${esc(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${COLORS.page}" style="background:${COLORS.page};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:640px;max-width:640px;background:#ffffff;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">
          <tr>
            <td bgcolor="${stripe}" height="3" style="background:${stripe};font-size:0;line-height:0;height:3px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 44px 16px;">
              ${bodyHtml}
            </td>
          </tr>
          ${footerHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Lokalisierte Strings für Mitglieder-Mails ──────────────────────────────

interface WelcomeStrings {
  eyebrow: string;
  greeting: (name: string) => string;
  intro: string;
  reviewNote: string;
  cta: string;
  fallback: string;
  validLabel: string;
  validValue: string;
  reviewLabel: string;
  reviewValue: string;
  signOff: string;
  preheader: (name: string) => string;
  subject: string;
}

const WELCOME: Record<Locale, WelcomeStrings> = {
  de: {
    eyebrow: "Mitgliederbereich · Self-Service",
    greeting: (name) => `Willkommen,<br>${esc(name)}.`,
    intro:
      "Ihre Firma ist im Verzeichnis von Swiss Dental Industry eingetragen. Über den folgenden permanenten Link können Sie Ihre Angaben — Adresse, Kontakt, Beschreibung und Logo — jederzeit selbst aktualisieren.",
    reviewNote: "Änderungen werden vom Sekretariat geprüft und anschliessend live geschaltet.",
    cta: "Firmenprofil bearbeiten",
    fallback: "Falls der Button nicht funktioniert",
    validLabel: "Link gültig",
    validValue: "Permanent — bis zur Rotation",
    reviewLabel: "Review",
    reviewValue: "Durch das Sekretariat",
    signOff: "Freundliche Grüsse",
    preheader: (name) => `Ihr permanenter Bearbeitungs-Link für ${name}.`,
    subject: "Ihr Bearbeitungs-Link – Swiss Dental Industry",
  },
  fr: {
    eyebrow: "Espace membres · Self-service",
    greeting: (name) => `Bienvenue,<br>${esc(name)}.`,
    intro:
      "Votre entreprise est inscrite dans le répertoire de Swiss Dental Industry. Le lien permanent ci-dessous vous permet de mettre à jour à tout moment vos coordonnées — adresse, contact, description et logo.",
    reviewNote: "Les modifications sont vérifiées par le secrétariat puis mises en ligne.",
    cta: "Modifier le profil de l'entreprise",
    fallback: "Si le bouton ne fonctionne pas",
    validLabel: "Lien valide",
    validValue: "Permanent — jusqu'à rotation",
    reviewLabel: "Vérification",
    reviewValue: "Par le secrétariat",
    signOff: "Cordiales salutations",
    preheader: (name) => `Votre lien permanent d'édition pour ${name}.`,
    subject: "Votre lien d'édition – Swiss Dental Industry",
  },
  it: {
    eyebrow: "Area membri · Self-service",
    greeting: (name) => `Benvenuti,<br>${esc(name)}.`,
    intro:
      "La vostra azienda è iscritta nell'elenco di Swiss Dental Industry. Tramite il seguente link permanente potete aggiornare in qualsiasi momento i vostri dati — indirizzo, contatti, descrizione e logo.",
    reviewNote: "Le modifiche vengono verificate dalla segreteria e poi pubblicate.",
    cta: "Modificare il profilo aziendale",
    fallback: "Se il pulsante non funziona",
    validLabel: "Link valido",
    validValue: "Permanente — fino alla rotazione",
    reviewLabel: "Verifica",
    reviewValue: "Da parte della segreteria",
    signOff: "Cordiali saluti",
    preheader: (name) => `Il vostro link permanente di modifica per ${name}.`,
    subject: "Il vostro link di modifica – Swiss Dental Industry",
  },
  en: {
    eyebrow: "Members area · Self-service",
    greeting: (name) => `Welcome,<br>${esc(name)}.`,
    intro:
      "Your company is listed in the Swiss Dental Industry directory. The permanent link below lets you update your details — address, contact, description, and logo — at any time.",
    reviewNote: "Changes are reviewed by the secretariat and then published live.",
    cta: "Edit company profile",
    fallback: "If the button doesn't work",
    validLabel: "Link valid",
    validValue: "Permanent — until rotation",
    reviewLabel: "Review",
    reviewValue: "By the secretariat",
    signOff: "Kind regards",
    preheader: (name) => `Your permanent edit link for ${name}.`,
    subject: "Your edit link – Swiss Dental Industry",
  },
};

interface ChangeApprovedStrings {
  eyebrow: string;
  headline: string;
  intro: (name: string) => string;
  fieldsHeader: string;
  changesCount: (n: number) => string;
  ctaProfile: string;
  ctaEdit: string;
  signOff: string;
  preheader: (name: string) => string;
  subject: string;
  textIntro: (name: string) => string;
  textFields: string;
}

const CHANGE_APPROVED: Record<Locale, ChangeApprovedStrings> = {
  de: {
    eyebrow: "Status · Geprüft & veröffentlicht",
    headline: "Ihre Änderungen<br>sind jetzt live.",
    intro: (name) =>
      `Ihre eingereichten Änderungen für <strong style="font-weight:700;">${esc(name)}</strong> wurden vom Sekretariat geprüft und sind nun auf swissdentalindustry.ch sichtbar.`,
    fieldsHeader: "Übernommene Felder",
    changesCount: (n) => `${n} ${n === 1 ? "ÄNDERUNG" : "ÄNDERUNGEN"}`,
    ctaProfile: "Profil ansehen",
    ctaEdit: "Erneut bearbeiten",
    signOff: "Freundliche Grüsse",
    preheader: (name) => `Ihre Änderungen für ${name} sind jetzt live.`,
    subject: "Ihre Änderungen sind jetzt live – Swiss Dental Industry",
    textIntro: (name) =>
      `Ihre Änderungen sind jetzt live.\n\nIhre eingereichten Änderungen für "${name}" wurden vom Sekretariat geprüft und sind nun auf swissdentalindustry.ch sichtbar.\n\n`,
    textFields: "Übernommene Felder:",
  },
  fr: {
    eyebrow: "Statut · Vérifié & publié",
    headline: "Vos modifications<br>sont en ligne.",
    intro: (name) =>
      `Vos modifications soumises pour <strong style="font-weight:700;">${esc(name)}</strong> ont été vérifiées par le secrétariat et sont désormais visibles sur swissdentalindustry.ch.`,
    fieldsHeader: "Champs repris",
    changesCount: (n) => `${n} ${n === 1 ? "MODIFICATION" : "MODIFICATIONS"}`,
    ctaProfile: "Voir le profil",
    ctaEdit: "Modifier à nouveau",
    signOff: "Cordiales salutations",
    preheader: (name) => `Vos modifications pour ${name} sont en ligne.`,
    subject: "Vos modifications sont en ligne – Swiss Dental Industry",
    textIntro: (name) =>
      `Vos modifications sont en ligne.\n\nVos modifications soumises pour "${name}" ont été vérifiées par le secrétariat et sont désormais visibles sur swissdentalindustry.ch.\n\n`,
    textFields: "Champs repris :",
  },
  it: {
    eyebrow: "Stato · Verificato & pubblicato",
    headline: "Le vostre modifiche<br>sono ora online.",
    intro: (name) =>
      `Le modifiche da voi inviate per <strong style="font-weight:700;">${esc(name)}</strong> sono state verificate dalla segreteria e sono ora visibili su swissdentalindustry.ch.`,
    fieldsHeader: "Campi acquisiti",
    changesCount: (n) => `${n} ${n === 1 ? "MODIFICA" : "MODIFICHE"}`,
    ctaProfile: "Vedere il profilo",
    ctaEdit: "Modificare di nuovo",
    signOff: "Cordiali saluti",
    preheader: (name) => `Le vostre modifiche per ${name} sono online.`,
    subject: "Le vostre modifiche sono online – Swiss Dental Industry",
    textIntro: (name) =>
      `Le vostre modifiche sono online.\n\nLe modifiche da voi inviate per "${name}" sono state verificate dalla segreteria e sono ora visibili su swissdentalindustry.ch.\n\n`,
    textFields: "Campi acquisiti:",
  },
  en: {
    eyebrow: "Status · Reviewed & published",
    headline: "Your changes<br>are now live.",
    intro: (name) =>
      `Your submitted changes for <strong style="font-weight:700;">${esc(name)}</strong> have been reviewed by the secretariat and are now visible on swissdentalindustry.ch.`,
    fieldsHeader: "Accepted fields",
    changesCount: (n) => `${n} ${n === 1 ? "CHANGE" : "CHANGES"}`,
    ctaProfile: "View profile",
    ctaEdit: "Edit again",
    signOff: "Kind regards",
    preheader: (name) => `Your changes for ${name} are now live.`,
    subject: "Your changes are now live – Swiss Dental Industry",
    textIntro: (name) =>
      `Your changes are now live.\n\nYour submitted changes for "${name}" have been reviewed by the secretariat and are now visible on swissdentalindustry.ch.\n\n`,
    textFields: "Accepted fields:",
  },
};

function localizedSignOff(label: string): string {
  return `<p style="font-family:${ARCHIVO};font-size:14.5px;line-height:1.6;color:${COLORS.ink3};margin:32px 0 0;">${esc(label)}<br><span style="font-weight:600;color:${COLORS.ink};">Swiss Dental Industry · SVDI</span></p>`;
}

// ─── Template 1: Willkommen / Bearbeitungs-Link ─────────────────────────────

export interface WelcomeMailInput {
  memberName: string;
  editUrl: string;
  locale?: Locale;
}

export function welcomeMailSubject(locale: Locale = "de"): string {
  return WELCOME[locale].subject;
}

export function renderWelcomeMail(input: WelcomeMailInput): { html: string; text: string } {
  const s = WELCOME[input.locale ?? "de"];
  const body = `
    ${brandRow()}
    ${metaLabel(s.eyebrow)}
    <h2 style="font-family:${ARCHIVO};font-size:34px;line-height:1.05;letter-spacing:-0.025em;font-weight:800;margin:0 0 22px;color:${COLORS.ink};">${s.greeting(input.memberName)}</h2>
    ${paragraph(s.intro, COLORS.ink2, "0 0 14px")}
    ${paragraph(s.reviewNote, COLORS.ink3, "0 0 28px")}
    ${ctaButton(input.editUrl, s.cta)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:26px 0 0;">
      <tr>
        <td style="background:${COLORS.surface2};border:1px solid ${COLORS.line2};border-radius:4px;padding:16px 18px;">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:6px;">${esc(s.fallback)}</div>
          <div style="font-family:${MONO};font-size:12.5px;color:${COLORS.ink};word-break:break-all;line-height:1.5;">${esc(input.editUrl)}</div>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:32px 0 0;border:1px solid ${COLORS.line2};">
      <tr>
        <td width="50%" style="background:#ffffff;padding:16px 18px;border-right:1px solid ${COLORS.line2};">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.red};font-weight:700;margin-bottom:6px;">${esc(s.validLabel)}</div>
          <div style="font-family:${ARCHIVO};font-size:14px;font-weight:600;color:${COLORS.ink};">${esc(s.validValue)}</div>
        </td>
        <td width="50%" style="background:#ffffff;padding:16px 18px;">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.red};font-weight:700;margin-bottom:6px;">${esc(s.reviewLabel)}</div>
          <div style="font-family:${ARCHIVO};font-size:14px;font-weight:600;color:${COLORS.ink};">${esc(s.reviewValue)}</div>
        </td>
      </tr>
    </table>
    ${localizedSignOff(s.signOff)}
  `;
  const html = shell({
    preheader: s.preheader(input.memberName),
    accent: "red",
    bodyHtml: body,
    footerHtml: brandFooter(),
  });
  const text =
    `${s.greeting(input.memberName).replace(/<br>/g, " ").replace(/<[^>]+>/g, "")}\n\n` +
    `${s.intro}\n\n${input.editUrl}\n\n${s.reviewNote}\n\n${s.signOff}\nSwiss Dental Industry · SVDI`;
  return { html, text };
}

// ─── Template 2: Änderungen sind live ───────────────────────────────────────

export interface ChangeApprovedMailInput {
  memberName: string;
  changes: { label: string; value: string }[];
  profileUrl?: string;
  editUrl?: string;
  locale?: Locale;
}

export function changeApprovedMailSubject(locale: Locale = "de"): string {
  return CHANGE_APPROVED[locale].subject;
}

export function renderChangeApprovedMail(input: ChangeApprovedMailInput): { html: string; text: string } {
  const s = CHANGE_APPROVED[input.locale ?? "de"];
  const rows = input.changes
    .map(
      (c, i) => `
      <tr>
        <td style="padding:14px 18px;${i < input.changes.length - 1 ? `border-bottom:1px solid ${COLORS.line};` : ""}">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td width="140" valign="top" style="font-family:${MONO};font-size:11.5px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.mute};">${esc(c.label)}</td>
              <td valign="top" style="font-family:${ARCHIVO};font-size:14px;font-weight:600;color:${COLORS.ink};">${esc(c.value)}</td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join("");

  const ctaRow: string[] = [];
  if (input.profileUrl) ctaRow.push(ctaButton(input.profileUrl, s.ctaProfile));
  if (input.editUrl) {
    ctaRow.push(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:6px 0 0;">
        <tr>
          <td style="background:#ffffff;border:1px solid #c4c4cc;border-radius:4px;">
            <a href="${esc(input.editUrl)}" style="display:inline-block;font-family:${ARCHIVO};font-size:15px;font-weight:600;color:${COLORS.ink};text-decoration:none;padding:14px 22px;">${esc(s.ctaEdit)}</a>
          </td>
        </tr>
      </table>`);
  }

  const body = `
    ${brandRow()}
    ${metaLabel(s.eyebrow)}
    <h2 style="font-family:${ARCHIVO};font-size:34px;line-height:1.05;letter-spacing:-0.025em;font-weight:800;margin:0 0 22px;color:${COLORS.ink};">${s.headline}</h2>
    <p style="font-family:${ARCHIVO};font-size:15.5px;line-height:1.65;color:${COLORS.ink2};margin:0 0 28px;">${s.intro(input.memberName)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${COLORS.line2};border-radius:4px;margin:0 0 30px;">
      <tr>
        <td style="background:${COLORS.surface2};padding:14px 18px;border-bottom:1px solid ${COLORS.line2};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td align="left" style="font-family:${MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.ink};font-weight:700;">${esc(s.fieldsHeader)}</td>
              <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${COLORS.red};font-weight:700;">${s.changesCount(input.changes.length)}</td>
            </tr>
          </table>
        </td>
      </tr>
      ${rows}
    </table>
    ${ctaRow.join("")}
    ${localizedSignOff(s.signOff)}
  `;
  const html = shell({
    preheader: s.preheader(input.memberName),
    accent: "red",
    bodyHtml: body,
    footerHtml: brandFooter(),
  });
  const text =
    s.textIntro(input.memberName) +
    `${s.textFields}\n` +
    input.changes.map((c) => `- ${c.label}: ${c.value}`).join("\n") +
    `\n\n${s.signOff}\nSwiss Dental Industry · SVDI`;
  return { html, text };
}

// ─── Template 3: Admin · Neuer Änderungsvorschlag ───────────────────────────

export interface AdminChangeMailInput {
  memberName: string;
  contactEmail: string | null;
  submittedAt: Date;
  feedUrl: string;
  changedCount: number;
  totalFields: number;
  diff: { label: string; before: string; after: string }[];
}

function adminBadge(label: string, code: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 22px;border:1px solid ${COLORS.line2};border-left:3px solid ${COLORS.red};background:${COLORS.surface2};">
      <tr>
        <td style="padding:10px 14px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td align="left" style="font-family:${MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.ink};font-weight:700;">
                <span style="display:inline-block;width:7px;height:7px;background:${COLORS.red};vertical-align:middle;margin-right:8px;">&nbsp;</span>${esc(label)}
              </td>
              <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:0.1em;color:${COLORS.mute};">${esc(code)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function fmtDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function renderAdminChangeMail(input: AdminChangeMailInput): { html: string; text: string } {
  const diffRows = input.diff
    .map(
      (d, i) => `
      <tr>
        <td style="padding:10px 16px;${i < input.diff.length - 1 ? `border-bottom:1px solid ${COLORS.line};` : ""}font-family:${MONO};font-size:12.5px;line-height:1.55;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td width="90" valign="top" style="color:${COLORS.mute2};font-family:${MONO};font-size:12.5px;">${esc(d.label)}</td>
              <td valign="top" style="font-family:${MONO};font-size:12.5px;color:${COLORS.ink};">
                <span style="background:${COLORS.redSoft};padding:1px 4px;color:${COLORS.redInk};text-decoration:line-through;">${esc(d.before || "—")}</span>
                &nbsp;→&nbsp;
                <span style="background:${COLORS.greenSoft};padding:1px 4px;color:${COLORS.green};">${esc(d.after || "—")}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join("");

  const body = `
    ${adminBadge("Admin-Benachrichtigung", "SDI-FEED")}
    <h2 style="font-family:${ARCHIVO};font-size:30px;line-height:1.06;letter-spacing:-0.025em;font-weight:800;margin:0 0 14px;color:${COLORS.ink};">Änderungsvorschlag im Review-Feed.</h2>
    ${paragraph("Eine Firma hat über den Self-Service einen Änderungsvorschlag eingereicht und wartet auf Prüfung durch das Sekretariat.", COLORS.ink3, "0 0 26px")}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${COLORS.line2};margin:0 0 26px;">
      <tr>
        <td width="50%" style="background:#ffffff;padding:18px 20px;border-right:1px solid ${COLORS.line2};border-bottom:1px solid ${COLORS.line2};">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:6px;">Firma</div>
          <div style="font-family:${ARCHIVO};font-size:16px;font-weight:700;letter-spacing:-0.01em;color:${COLORS.ink};">${esc(input.memberName)}</div>
        </td>
        <td width="50%" style="background:#ffffff;padding:18px 20px;border-bottom:1px solid ${COLORS.line2};">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:6px;">Eingereicht</div>
          <div style="font-family:${ARCHIVO};font-size:16px;font-weight:700;letter-spacing:-0.01em;color:${COLORS.ink};">${fmtDateTime(input.submittedAt)}</div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="background:#ffffff;padding:18px 20px;border-right:1px solid ${COLORS.line2};">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:6px;">Kontakt</div>
          <div style="font-family:${ARCHIVO};font-size:14px;font-weight:600;color:${COLORS.ink};">${esc(input.contactEmail || "—")}</div>
        </td>
        <td width="50%" style="background:#ffffff;padding:18px 20px;">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:6px;">Felder geändert</div>
          <div style="font-family:${ARCHIVO};font-size:16px;font-weight:700;letter-spacing:-0.01em;color:${COLORS.red};">${input.changedCount} von ${input.totalFields}</div>
        </td>
      </tr>
    </table>

    <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.ink};font-weight:700;margin:0 0 12px;">Diff · Vorschau</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${COLORS.line2};border-radius:4px;margin:0 0 30px;">
      ${diffRows}
    </table>

    ${ctaButton(input.feedUrl, "Im Admin-Feed öffnen")}

    <p style="font-family:${ARCHIVO};font-size:13px;line-height:1.6;color:${COLORS.mute};margin:26px 0 0;">Diese Nachricht wurde automatisch vom Swiss Dental Industry Admin-System erzeugt. Antworten Sie nicht direkt auf diese E-Mail.</p>
  `;
  const html = shell({
    preheader: `Neuer Vorschlag von ${input.memberName} im Review-Feed.`,
    accent: "ink",
    bodyHtml: body,
    footerHtml: adminFooter("ADMIN-SYSTEM"),
  });
  const text =
    `Neuer Änderungsvorschlag im Review-Feed\n\n` +
    `Firma: ${input.memberName}\n` +
    `Eingereicht: ${fmtDateTime(input.submittedAt)}\n` +
    `Kontakt: ${input.contactEmail || "—"}\n` +
    `Felder geändert: ${input.changedCount} von ${input.totalFields}\n\n` +
    `Diff:\n` +
    input.diff.map((d) => `- ${d.label}: ${d.before || "—"} → ${d.after || "—"}`).join("\n") +
    `\n\nZum Review: ${input.feedUrl}\n`;
  return { html, text };
}

// ─── Template 4: Admin · Neue „Mitglied werden"-Anfrage ─────────────────────

const FIELD_LABELS: Record<string, string> = {
  company: "Firma",
  name: "Ansprechperson",
  email: "E-Mail",
  phone: "Telefon",
  website_url: "Website",
  address: "Adresse",
  description: "Kurzbeschreibung",
  message: "Nachricht",
  subject: "Betreff",
  source: "Quelle",
  logo_url: "Logo",
};

// Mapt Member-Feld-Keys auf Labels (für Mitglieder- und Admin-Mails).
// Lokalisiert: Mitglieder-Mails nutzen die Sprache des Mitglieds, Admin-Mails
// bleiben auf Deutsch.
const MEMBER_FIELD_LABELS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  de: {
    address: "Adresse",
    phone: "Telefon",
    email: "E-Mail",
    website_url: "Website",
    description: "Beschreibung",
    logo_url: "Logo",
    internal_profile: "Interne Mitgliedsdaten",
  },
  fr: {
    address: "Adresse",
    phone: "Téléphone",
    email: "E-mail",
    website_url: "Site web",
    description: "Description",
    logo_url: "Logo",
    internal_profile: "Données membres internes",
  },
  it: {
    address: "Indirizzo",
    phone: "Telefono",
    email: "E-mail",
    website_url: "Sito web",
    description: "Descrizione",
    logo_url: "Logo",
    internal_profile: "Dati membro interni",
  },
  en: {
    address: "Address",
    phone: "Phone",
    email: "Email",
    website_url: "Website",
    description: "Description",
    logo_url: "Logo",
    internal_profile: "Internal member data",
  },
};

// Stellt einen Feldwert lesbar dar — komplexe Typen (Multilingual, URLs)
// werden zu Kurz-Strings reduziert, damit der Empfänger nicht eine
// JSON-Wolke sieht. Lange Texte werden gekürzt, damit Vorher/Nachher im
// Diff trotzdem unterscheidbar bleiben.
export function describeMemberValue(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (key === "description" && typeof value === "object" && value !== null) {
    const ml = value as Record<string, string>;
    const text = (ml.de || ml.fr || ml.it || ml.en || "").trim();
    if (!text) return "[Beschreibung]";
    return text.length > 60 ? `${text.slice(0, 60).trim()}… [${text.length} Zeichen]` : text;
  }
  if (key === "logo_url" && typeof value === "string") {
    const fname = value.split("/").pop() || value;
    return fname.length > 36 ? `…${fname.slice(-34)}` : `[Logo: ${fname}]`;
  }
  if (key === "internal_profile" && typeof value === "object" && value !== null) {
    const profile = normalizeMemberInternalProfile(value);
    const parts = MEMBER_INTERNAL_PROFILE_KEYS
      .filter((profileKey) => profile[profileKey])
      .slice(0, 3)
      .map((profileKey) => `${MEMBER_INTERNAL_PROFILE_LABELS[profileKey]}: ${profile[profileKey]}`);
    return parts.length ? `${parts.join(", ")}${parts.length === 3 ? " …" : ""}` : "—";
  }
  if (typeof value === "string") {
    return value.length > 60 ? `${value.slice(0, 60).trim()}… [${value.length} Zeichen]` : value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function memberFieldLabel(key: string, locale: Locale = "de"): string {
  return MEMBER_FIELD_LABELS_BY_LOCALE[locale][key] || key;
}

function extractPlainText(key: string, value: unknown): string | null {
  if (value == null) return null;
  if (key === "description" && typeof value === "object") {
    const ml = value as Record<string, string>;
    return (ml.de || ml.fr || ml.it || ml.en || "").trim();
  }
  if (key === "internal_profile" && typeof value === "object") {
    return describeMemberValue(key, value);
  }
  if (typeof value === "string") return value;
  return null;
}

// Stellt ein Vorher/Nachher-Paar so dar, dass bei langen Texten nur das
// tatsächlich geänderte Fenster (plus etwas Kontext) sichtbar ist — sonst
// wirkt jede Mini-Änderung wie ein Komplett-Rewrite.
export function describeMemberValuePair(
  key: string,
  before: unknown,
  after: unknown,
): { before: string; after: string } {
  const b = extractPlainText(key, before);
  const a = extractPlainText(key, after);
  if (b == null || a == null || (b.length <= 80 && a.length <= 80)) {
    return { before: describeMemberValue(key, before), after: describeMemberValue(key, after) };
  }

  let p = 0;
  const minLen = Math.min(b.length, a.length);
  while (p < minLen && b[p] === a[p]) p++;
  let s = 0;
  while (s < minLen - p && b[b.length - 1 - s] === a[a.length - 1 - s]) s++;

  const bChanged = b.slice(p, b.length - s);
  const aChanged = a.slice(p, a.length - s);
  if (!bChanged && !aChanged) {
    return { before: describeMemberValue(key, before), after: describeMemberValue(key, after) };
  }

  const CTX = 28;
  const prefixCtx = b.slice(Math.max(0, p - CTX), p);
  const suffixCtx = b.slice(b.length - s, Math.min(b.length, b.length - s + CTX));
  const leftEll = p > CTX ? "…" : "";
  const rightEll = s > CTX ? "…" : "";
  const cap = (t: string) => (t.length > 140 ? `${t.slice(0, 140)}…` : t);

  return {
    before: `${leftEll}${prefixCtx}${cap(bChanged) || "∅"}${suffixCtx}${rightEll}`,
    after: `${leftEll}${prefixCtx}${cap(aChanged) || "∅"}${suffixCtx}${rightEll}`,
  };
}

function payloadRows(payload: Record<string, string>): string {
  const keys = Object.keys(payload).filter((k) => payload[k] && payload[k].trim() !== "");
  return keys
    .map((k, i) => {
      const label = FIELD_LABELS[k] || k;
      const value = payload[k];
      const isLast = i === keys.length - 1;
      const isLong = value.length > 80 || value.includes("\n");
      return `
      <tr>
        <td style="padding:14px 20px;${isLast ? "" : `border-bottom:1px solid ${COLORS.line};`}">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td width="150" valign="top" style="font-family:${MONO};font-size:11.5px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.mute};">${esc(label)}</td>
              <td valign="top" style="font-family:${isLong ? ARCHIVO : ARCHIVO};font-size:${isLong ? "14px" : "14.5px"};font-weight:${isLong ? "400" : "600"};color:${isLong ? COLORS.ink2 : COLORS.ink};line-height:1.6;white-space:pre-wrap;">${esc(value)}</td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");
}

export interface AdminMembershipApplicationInput {
  payload: Record<string, string>;
  applicationsUrl?: string;
}

export function renderAdminMembershipApplication(input: AdminMembershipApplicationInput): {
  html: string;
  text: string;
} {
  const company = input.payload.company || input.payload.name || "Unbekannt";
  const replyEmail = input.payload.email;
  const body = `
    ${adminBadge("Mitglied-werden · Antrag", "APPL")}
    <h2 style="font-family:${ARCHIVO};font-size:30px;line-height:1.06;letter-spacing:-0.025em;font-weight:800;margin:0 0 14px;color:${COLORS.ink};">Neue Mitgliedschafts-<br>Anfrage eingegangen.</h2>
    ${paragraph("Ein Unternehmen hat den Mitglied-werden-Fragebogen ausgefüllt. Der Antrag ist im Admin-Backend gespeichert.", COLORS.ink3, "0 0 26px")}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${COLORS.line2};border-radius:4px;margin:0 0 26px;">
      <tr>
        <td bgcolor="${COLORS.ink}" style="background:${COLORS.ink};padding:14px 20px;">
          <span style="font-family:${MONO};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;font-weight:700;">Antragsdaten</span>
        </td>
      </tr>
      ${payloadRows(input.payload)}
    </table>

    ${
      input.applicationsUrl
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td>${ctaButton(input.applicationsUrl, "Antrag prüfen")}</td>
              ${
                replyEmail
                  ? `<td style="padding-left:12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:6px 0 0;">
                    <tr>
                      <td style="background:#ffffff;border:1px solid #c4c4cc;border-radius:4px;">
                        <a href="mailto:${esc(replyEmail)}" style="display:inline-block;font-family:${ARCHIVO};font-size:15px;font-weight:600;color:${COLORS.ink};text-decoration:none;padding:14px 22px;">Direkt antworten</a>
                      </td>
                    </tr>
                  </table>
                </td>`
                  : ""
              }
            </tr>
          </table>`
        : ""
    }

    <p style="font-family:${ARCHIVO};font-size:13px;line-height:1.6;color:${COLORS.mute};margin:26px 0 0;">Antworten an diese E-Mail gehen an den Antragsteller (Reply-To gesetzt).</p>
  `;
  const html = shell({
    preheader: `Neue Mitgliedschafts-Anfrage: ${company}`,
    accent: "ink",
    bodyHtml: body,
    footerHtml: adminFooter("ADMIN-SYSTEM"),
  });
  const text =
    `Neue Mitgliedschafts-Anfrage: ${company}\n\n` +
    Object.entries(input.payload)
      .filter(([, v]) => v && v.trim() !== "")
      .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`)
      .join("\n") +
    (input.applicationsUrl ? `\n\nZum Antrag: ${input.applicationsUrl}` : "");
  return { html, text };
}

// ─── Template 5: Admin · Kontakt / Mitwirken ────────────────────────────────

export interface AdminContactInquiryInput {
  payload: Record<string, string>;
  kind: "kontakt" | "mitwirken";
}

export function renderAdminContactInquiry(input: AdminContactInquiryInput): {
  html: string;
  text: string;
} {
  const isKontakt = input.kind === "kontakt";
  const badgeLabel = isKontakt ? "Kontaktformular · Eingang" : "Mitwirken · Anfrage";
  const badgeCode = isKontakt ? "MSG" : "MITW";
  const headline = isKontakt ? "Anfrage über das Kontaktformular." : "Neue Mitwirken-Anfrage.";
  const intro = isKontakt
    ? "Eine externe Person hat das Formular auf swissdentalindustry.ch ausgefüllt. Die Nachricht ist gespeichert und unten im Wortlaut angefügt."
    : "Eine Person möchte sich engagieren oder hat eine Anfrage über das Mitwirken-Formular gestellt.";

  const summaryFields: Array<{ key: string; label: string }> = [
    { key: "name", label: "Name" },
    { key: "email", label: "E-Mail" },
    { key: "phone", label: "Telefon" },
    { key: "subject", label: "Betreff" },
  ];
  const summaryCells = summaryFields
    .map(
      ({ key, label }, i) => `
      <td width="50%" valign="top" style="background:#ffffff;padding:16px 20px;${i % 2 === 0 ? `border-right:1px solid ${COLORS.line2};` : ""}${i < 2 ? `border-bottom:1px solid ${COLORS.line2};` : ""}">
        <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:6px;">${esc(label)}</div>
        <div style="font-family:${ARCHIVO};font-size:14.5px;font-weight:600;color:${COLORS.ink};word-break:break-word;">${esc(input.payload[key] || "—")}</div>
      </td>`,
    );

  const message = input.payload.message || "";
  const replyEmail = input.payload.email;

  const extraKeys = Object.keys(input.payload).filter(
    (k) => !["name", "email", "phone", "subject", "message", "source"].includes(k) && input.payload[k]?.trim(),
  );
  const extraRows = extraKeys.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${COLORS.line2};margin:0 0 24px;">
        ${payloadRows(Object.fromEntries(extraKeys.map((k) => [k, input.payload[k]])))}
      </table>`
    : "";

  const body = `
    ${adminBadge(badgeLabel, badgeCode)}
    <h2 style="font-family:${ARCHIVO};font-size:30px;line-height:1.06;letter-spacing:-0.025em;font-weight:800;margin:0 0 14px;color:${COLORS.ink};">${esc(headline)}</h2>
    ${paragraph(intro, COLORS.ink3, "0 0 26px")}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${COLORS.line2};margin:0 0 24px;">
      <tr>${summaryCells[0]}${summaryCells[1]}</tr>
      <tr>${summaryCells[2]}${summaryCells[3]}</tr>
    </table>

    ${extraRows}

    ${
      message
        ? `<div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.ink};font-weight:700;margin:0 0 10px;">Nachricht im Wortlaut</div>
           <div style="border-left:3px solid ${COLORS.red};background:${COLORS.surface2};padding:18px 22px;margin:0 0 30px;font-family:${ARCHIVO};font-size:14.5px;line-height:1.65;color:${COLORS.ink2};white-space:pre-wrap;">${esc(message)}</div>`
        : ""
    }

    ${
      replyEmail
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr><td>${ctaButton(`mailto:${replyEmail}`, "Antworten")}</td></tr>
          </table>`
        : ""
    }
  `;
  const html = shell({
    preheader: isKontakt
      ? `Neue Kontakt-Anfrage von ${input.payload.name || "Unbekannt"}`
      : `Neue Mitwirken-Anfrage von ${input.payload.name || "Unbekannt"}`,
    accent: "ink",
    bodyHtml: body,
    footerHtml: adminFooter("FORMULARE"),
  });
  const text =
    `${headline}\n\n` +
    Object.entries(input.payload)
      .filter(([, v]) => v && v.trim() !== "")
      .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`)
      .join("\n");
  return { html, text };
}

// ─── Template 6: Admin-Einladung ────────────────────────────────────────────

export interface AdminInviteMailInput {
  email: string;
  inviteUrl: string;
}

export function adminInviteMailSubject(): string {
  return "Einladung zum Admin-Portal – Swiss Dental Industry";
}

export function renderAdminInviteMail(input: AdminInviteMailInput): {
  html: string;
  text: string;
} {
  const body = `
    ${brandRow()}
    ${metaLabel("Admin-Portal · Einladung")}
    ${h2("Einladung zum Admin-Portal.")}
    ${paragraph("Sie wurden eingeladen, Swiss Dental Industry im Admin-Portal zu verwalten. Über den folgenden Link können Sie die Einladung annehmen und Ihr Passwort festlegen.", COLORS.ink2, "0 0 24px")}
    ${ctaButton(input.inviteUrl, "Einladung annehmen")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:26px 0 0;">
      <tr>
        <td style="background:${COLORS.surface2};border:1px solid ${COLORS.line2};border-radius:4px;padding:16px 18px;">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:6px;">Falls der Button nicht funktioniert</div>
          <div style="font-family:${MONO};font-size:12.5px;color:${COLORS.ink};word-break:break-all;line-height:1.5;">${esc(input.inviteUrl)}</div>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:32px 0 0;border:1px solid ${COLORS.line2};">
      <tr>
        <td width="50%" style="background:#ffffff;padding:16px 18px;border-right:1px solid ${COLORS.line2};">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.red};font-weight:700;margin-bottom:6px;">Zugang</div>
          <div style="font-family:${ARCHIVO};font-size:14px;font-weight:600;color:${COLORS.ink};">Superadmin</div>
        </td>
        <td width="50%" style="background:#ffffff;padding:16px 18px;">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.red};font-weight:700;margin-bottom:6px;">Konto</div>
          <div style="font-family:${ARCHIVO};font-size:14px;font-weight:600;color:${COLORS.ink};word-break:break-word;">${esc(input.email)}</div>
        </td>
      </tr>
    </table>
    ${signOff()}
  `;
  const html = shell({
    preheader: "Ihre Einladung zum Swiss Dental Industry Admin-Portal.",
    accent: "red",
    bodyHtml: body,
    footerHtml: brandFooter(),
  });
  const text =
    `Einladung zum Admin-Portal\n\n` +
    `Sie wurden eingeladen, Swiss Dental Industry im Admin-Portal zu verwalten. ` +
    `Über den folgenden Link können Sie die Einladung annehmen und Ihr Passwort festlegen.\n\n` +
    `${input.inviteUrl}\n\n` +
    `Konto: ${input.email}\n` +
    `Zugang: Superadmin\n\n` +
    `Freundliche Grüsse\nSwiss Dental Industry · SVDI`;
  return { html, text };
}

// ─── Template: Antrag angenommen ────────────────────────────────────────────

interface ApplicationApprovedStrings {
  eyebrow: string;
  greeting: (name: string) => string;
  intro: string;
  internalNote: string;
  cta: string;
  fallback: string;
  signOff: string;
  preheader: (name: string) => string;
  subject: string;
}

const APPLICATION_APPROVED: Record<Locale, ApplicationApprovedStrings> = {
  de: {
    eyebrow: "Mitgliedschaft · Zusage",
    // Bewusst ohne Firmennamen — die deutsche Zusage begrüsst allgemein.
    greeting: () => `Willkommen bei<br>Swiss Dental Industry.`,
    intro:
      "Ihr Antrag wurde geprüft und angenommen — Ihre Firma ist ab sofort im Mitgliederverzeichnis eingetragen.",
    internalNote:
      "Bitte ergänzen Sie über den folgenden Link noch Ihre internen Angaben (Kontaktperson, Anschrift, Direktkontakt). Über denselben Link können Sie Ihr Profil jederzeit aktualisieren — Änderungen werden vom Sekretariat geprüft und danach live geschaltet.",
    cta: "Angaben ergänzen",
    fallback: "Falls der Button nicht funktioniert",
    signOff: "Freundliche Grüsse",
    preheader: (name) => `Ihr Mitgliedsantrag für ${name} wurde angenommen.`,
    subject: "Willkommen – Ihr Mitgliedsantrag wurde angenommen",
  },
  fr: {
    eyebrow: "Adhésion · Acceptation",
    greeting: () => `Bienvenue chez<br>Swiss Dental Industry.`,
    intro:
      "Votre demande a été examinée et acceptée — votre entreprise figure désormais dans le répertoire des membres.",
    internalNote:
      "Merci de compléter vos données internes (personne de contact, adresse, contact direct) via le lien ci-dessous. Ce même lien vous permet de mettre à jour votre profil à tout moment — les modifications sont vérifiées par le secrétariat avant publication.",
    cta: "Compléter les données",
    fallback: "Si le bouton ne fonctionne pas",
    signOff: "Cordiales salutations",
    preheader: (name) => `Votre demande d'adhésion pour ${name} a été acceptée.`,
    subject: "Bienvenue – votre demande d'adhésion a été acceptée",
  },
  it: {
    eyebrow: "Adesione · Accettazione",
    greeting: () => `Benvenuti in<br>Swiss Dental Industry.`,
    intro:
      "La vostra richiesta è stata esaminata e accettata — la vostra azienda è ora iscritta nell'elenco dei membri.",
    internalNote:
      "Vi preghiamo di completare i vostri dati interni (persona di contatto, indirizzo, contatto diretto) tramite il link seguente. Lo stesso link vi permette di aggiornare il profilo in qualsiasi momento — le modifiche vengono verificate dalla segreteria prima della pubblicazione.",
    cta: "Completare i dati",
    fallback: "Se il pulsante non funziona",
    signOff: "Cordiali saluti",
    preheader: (name) => `La vostra richiesta di adesione per ${name} è stata accettata.`,
    subject: "Benvenuti – la vostra richiesta di adesione è stata accettata",
  },
  en: {
    eyebrow: "Membership · Accepted",
    greeting: () => `Welcome to<br>Swiss Dental Industry.`,
    intro:
      "Your application has been reviewed and accepted — your company is now listed in the member directory.",
    internalNote:
      "Please complete your internal details (contact person, address, direct contact) using the link below. The same link lets you update your profile at any time — changes are reviewed by the secretariat before going live.",
    cta: "Complete your details",
    fallback: "If the button doesn't work",
    signOff: "Kind regards",
    preheader: (name) => `Your membership application for ${name} has been accepted.`,
    subject: "Welcome – your membership application was accepted",
  },
};

export interface ApplicationApprovedMailInput {
  memberName: string;
  editUrl: string;
  locale?: Locale;
}

export function applicationApprovedSubject(locale: Locale = "de"): string {
  return APPLICATION_APPROVED[locale].subject;
}

export function renderApplicationApprovedMail(input: ApplicationApprovedMailInput): {
  html: string;
  text: string;
} {
  const s = APPLICATION_APPROVED[input.locale ?? "de"];
  const body = `
    ${brandRow()}
    ${metaLabel(s.eyebrow)}
    <h2 style="font-family:${ARCHIVO};font-size:34px;line-height:1.05;letter-spacing:-0.025em;font-weight:800;margin:0 0 22px;color:${COLORS.ink};">${s.greeting(input.memberName)}</h2>
    ${paragraphHtml(`<strong style="color:${COLORS.ink};">${esc(input.memberName)}</strong> — ${esc(s.intro)}`, COLORS.ink2, "0 0 14px")}
    ${paragraph(s.internalNote, COLORS.ink3, "0 0 28px")}
    ${ctaButton(input.editUrl, s.cta)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:26px 0 0;">
      <tr>
        <td style="background:${COLORS.surface2};border:1px solid ${COLORS.line2};border-radius:4px;padding:16px 18px;">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:6px;">${esc(s.fallback)}</div>
          <div style="font-family:${MONO};font-size:12.5px;color:${COLORS.ink};word-break:break-all;line-height:1.5;">${esc(input.editUrl)}</div>
        </td>
      </tr>
    </table>
    ${localizedSignOff(s.signOff)}
  `;
  const html = shell({
    preheader: s.preheader(input.memberName),
    accent: "red",
    bodyHtml: body,
    footerHtml: brandFooter(),
  });
  const text =
    `${s.greeting(input.memberName).replace(/<br>/g, " ").replace(/<[^>]+>/g, "")}\n\n` +
    `${input.memberName} — ${s.intro}\n\n${s.internalNote}\n\n${input.editUrl}\n\n` +
    `${s.signOff}\nSwiss Dental Industry · SVDI`;
  return { html, text };
}

// ─── Template: Antrag abgelehnt ─────────────────────────────────────────────

interface ApplicationRejectedStrings {
  eyebrow: string;
  heading: string;
  intro: (name: string) => string;
  reasonLabel: string;
  closing: string;
  signOff: string;
  preheader: string;
  subject: string;
}

const APPLICATION_REJECTED: Record<Locale, ApplicationRejectedStrings> = {
  de: {
    eyebrow: "Mitgliedschaft · Entscheid",
    heading: "Zu Ihrem Mitgliedsantrag.",
    intro: (name) =>
      `Vielen Dank für Ihr Interesse an einer Mitgliedschaft bei Swiss Dental Industry. Nach Prüfung des Antrags für ${name} können wir diesem derzeit leider nicht entsprechen.`,
    reasonLabel: "Begründung",
    closing:
      "Bei Rückfragen antworten Sie einfach auf diese E-Mail — die Geschäftsstelle meldet sich gerne bei Ihnen.",
    signOff: "Freundliche Grüsse",
    preheader: "Entscheid zu Ihrem Mitgliedsantrag.",
    subject: "Ihr Mitgliedsantrag – Swiss Dental Industry",
  },
  fr: {
    eyebrow: "Adhésion · Décision",
    heading: "Concernant votre demande d'adhésion.",
    intro: (name) =>
      `Merci de l'intérêt que vous portez à Swiss Dental Industry. Après examen de la demande pour ${name}, nous ne pouvons malheureusement pas y donner suite pour le moment.`,
    reasonLabel: "Motif",
    closing:
      "Pour toute question, répondez simplement à cet e-mail — le secrétariat se tient à votre disposition.",
    signOff: "Cordiales salutations",
    preheader: "Décision concernant votre demande d'adhésion.",
    subject: "Votre demande d'adhésion – Swiss Dental Industry",
  },
  it: {
    eyebrow: "Adesione · Decisione",
    heading: "In merito alla vostra richiesta.",
    intro: (name) =>
      `Grazie per l'interesse dimostrato verso Swiss Dental Industry. Dopo aver esaminato la richiesta per ${name}, purtroppo non possiamo accoglierla al momento.`,
    reasonLabel: "Motivazione",
    closing:
      "Per domande potete semplicemente rispondere a questa e-mail — la segreteria è a vostra disposizione.",
    signOff: "Cordiali saluti",
    preheader: "Decisione sulla vostra richiesta di adesione.",
    subject: "La vostra richiesta di adesione – Swiss Dental Industry",
  },
  en: {
    eyebrow: "Membership · Decision",
    heading: "About your membership application.",
    intro: (name) =>
      `Thank you for your interest in Swiss Dental Industry. After reviewing the application for ${name}, we are unfortunately unable to accept it at this time.`,
    reasonLabel: "Reason",
    closing:
      "If you have questions, simply reply to this email — the secretariat will be happy to help.",
    signOff: "Kind regards",
    preheader: "Decision on your membership application.",
    subject: "Your membership application – Swiss Dental Industry",
  },
};

export interface ApplicationRejectedMailInput {
  memberName: string;
  reason?: string | null;
  locale?: Locale;
}

export function applicationRejectedSubject(locale: Locale = "de"): string {
  return APPLICATION_REJECTED[locale].subject;
}

export function renderApplicationRejectedMail(input: ApplicationRejectedMailInput): {
  html: string;
  text: string;
} {
  const s = APPLICATION_REJECTED[input.locale ?? "de"];
  const reasonBlock = input.reason
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:22px 0 0;">
      <tr>
        <td style="background:${COLORS.surface2};border:1px solid ${COLORS.line2};border-radius:4px;padding:16px 18px;">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.mute};font-weight:700;margin-bottom:8px;">${esc(s.reasonLabel)}</div>
          <div style="font-family:${ARCHIVO};font-size:14.5px;line-height:1.6;color:${COLORS.ink};white-space:pre-wrap;">${esc(input.reason)}</div>
        </td>
      </tr>
    </table>`
    : "";

  const body = `
    ${brandRow()}
    ${metaLabel(s.eyebrow, COLORS.mute)}
    <h2 style="font-family:${ARCHIVO};font-size:30px;line-height:1.1;letter-spacing:-0.025em;font-weight:800;margin:0 0 22px;color:${COLORS.ink};">${esc(s.heading)}</h2>
    ${paragraph(s.intro(input.memberName), COLORS.ink2, "0 0 14px")}
    ${reasonBlock}
    ${paragraph(s.closing, COLORS.ink3, "22px 0 0")}
    ${localizedSignOff(s.signOff)}
  `;
  const html = shell({
    preheader: s.preheader,
    accent: "ink",
    bodyHtml: body,
    footerHtml: brandFooter(),
  });
  const text =
    `${s.heading}\n\n${s.intro(input.memberName)}\n\n` +
    (input.reason ? `${s.reasonLabel}: ${input.reason}\n\n` : "") +
    `${s.closing}\n\n${s.signOff}\nSwiss Dental Industry · SVDI`;
  return { html, text };
}
