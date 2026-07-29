import { cookies } from "next/headers";
import { LOCALES, type Locale } from "./types";

export const ADMIN_LOCALE_COOKIE = "admin_locale";

// Das Portal bleibt standardmässig Deutsch — unabhängig von der
// Default-Sprache der öffentlichen Website (DEFAULT_LOCALE = en).
const ADMIN_DEFAULT_LOCALE: Locale = "de";

// Übersetzungen der Admin-Portal-Oberfläche. Bewusst flach gehalten.
const DICT = {
  "nav.members": { de: "Mitglieder", fr: "Membres", it: "Membri", en: "Members" },
  "nav.news": { de: "News", fr: "Actualités", it: "Notizie", en: "News" },
  "nav.feed": {
    de: "Änderungs-Feed",
    fr: "Modifications",
    it: "Modifiche",
    en: "Change feed",
  },
  "nav.applications": {
    de: "Anträge",
    fr: "Demandes",
    it: "Richieste",
    en: "Applications",
  },
  "nav.settings": {
    de: "Einstellungen",
    fr: "Paramètres",
    it: "Impostazioni",
    en: "Settings",
  },
  "nav.logout": { de: "Abmelden", fr: "Déconnexion", it: "Esci", en: "Log out" },
  "dashboard.overview": { de: "Übersicht", fr: "Aperçu", it: "Panoramica", en: "Overview" },
  "dashboard.greetingMorning": {
    de: "Guten Morgen.",
    fr: "Bonjour.",
    it: "Buongiorno.",
    en: "Good morning.",
  },
  "dashboard.greetingDay": {
    de: "Guten Tag.",
    fr: "Bonjour.",
    it: "Buongiorno.",
    en: "Good afternoon.",
  },
  "dashboard.greetingEvening": {
    de: "Guten Abend.",
    fr: "Bonsoir.",
    it: "Buonasera.",
    en: "Good evening.",
  },
  "dashboard.status": {
    de: "Stand",
    fr: "État",
    it: "Stato",
    en: "Status",
  },
  "dashboard.pendingChanges": {
    de: "offene Änderungsvorschläge",
    fr: "modifications en attente",
    it: "modifiche in sospeso",
    en: "pending change requests",
  },
  "dashboard.newApplications": {
    de: "neue Anträge",
    fr: "nouvelles demandes",
    it: "nuove richieste",
    en: "new applications",
  },
  "dashboard.youHave": {
    de: "Sie haben",
    fr: "Vous avez",
    it: "Ha",
    en: "You have",
  },
  "dashboard.and": { de: "und", fr: "et", it: "e", en: "and" },
  "dashboard.memberApplications": {
    de: "neue Mitgliederanträge",
    fr: "nouvelles demandes d'adhésion",
    it: "nuove richieste di adesione",
    en: "new membership applications",
  },
  "dashboard.export": {
    de: "Daten exportieren",
    fr: "Exporter les données",
    it: "Esporta dati",
    en: "Export data",
  },
  "dashboard.newMemberCompany": {
    de: "+ Neue Mitglieder-Firma",
    fr: "+ Nouvelle entreprise membre",
    it: "+ Nuova azienda membro",
    en: "+ New member company",
  },
  "dashboard.members": { de: "Mitglieder", fr: "Membres", it: "Membri", en: "Members" },
  "dashboard.memberProfiles": {
    de: "Publizierte Firmenprofile",
    fr: "Profils d'entreprise publiés",
    it: "Profili aziendali pubblicati",
    en: "Published company profiles",
  },
  "dashboard.pendingApprovals": {
    de: "Warten auf Freigabe",
    fr: "En attente d'approbation",
    it: "In attesa di approvazione",
    en: "Awaiting approval",
  },
  "dashboard.newsEntries": {
    de: "Einträge im Verbandsteil",
    fr: "Entrées dans la rubrique de l'association",
    it: "Voci nella sezione dell'associazione",
    en: "Entries in the association section",
  },
  "dashboard.applicationRequests": {
    de: "Mitgliedschaftsanfragen",
    fr: "Demandes d'adhésion",
    it: "Richieste di adesione",
    en: "Membership requests",
  },
  "dashboard.review": { de: "PRÜFEN", fr: "VÉRIFIER", it: "VERIFICA", en: "REVIEW" },
  "dashboard.new": { de: "NEU", fr: "NOUVEAU", it: "NUOVO", en: "NEW" },
  "dashboard.latestActivity": {
    de: "Letzte Aktivität",
    fr: "Dernière activité",
    it: "Ultima attività",
    en: "Latest activity",
  },
  "dashboard.viewAll": {
    de: "Alles ansehen",
    fr: "Tout afficher",
    it: "Vedi tutto",
    en: "View all",
  },
  "dashboard.changeSubmitted": {
    de: "hat Änderungen eingereicht",
    fr: "a soumis des modifications",
    it: "ha inviato modifiche",
    en: "submitted changes",
  },
  "dashboard.wantsMembership": {
    de: "möchte Mitglied werden",
    fr: "souhaite devenir membre",
    it: "desidera diventare membro",
    en: "wants to become a member",
  },
  "dashboard.sentInquiry": {
    de: "hat eine Kontaktanfrage geschickt",
    fr: "a envoyé une demande de contact",
    it: "ha inviato una richiesta di contatto",
    en: "sent a contact inquiry",
  },
  "dashboard.inquiries": {
    de: "Kontaktanfragen",
    fr: "Demandes de contact",
    it: "Richieste di contatto",
    en: "Contact inquiries",
  },
  "dashboard.openInquiries": {
    de: "Unbeantwortete Anfragen",
    fr: "Demandes sans réponse",
    it: "Richieste senza risposta",
    en: "Unanswered inquiries",
  },
  "dashboard.noActivity": {
    de: "Gerade keine neuen Anfragen oder offenen Änderungsvorschläge.",
    fr: "Aucune nouvelle demande ni modification en attente pour le moment.",
    it: "Al momento non ci sono nuove richieste o modifiche in sospeso.",
    en: "There are no new requests or pending changes right now.",
  },
  "dashboard.systemStatus": {
    de: "System-Status",
    fr: "Statut du système",
    it: "Stato del sistema",
    en: "System status",
  },
  "dashboard.lastCheckOk": {
    de: "Letzter Check erfolgreich",
    fr: "Dernier contrôle réussi",
    it: "Ultimo controllo riuscito",
    en: "Last check successful",
  },
  "dashboard.db": {
    de: "Supabase Datenbank",
    fr: "Base de données Supabase",
    it: "Database Supabase",
    en: "Supabase database",
  },
  "dashboard.translations": {
    de: "Übersetzungen",
    fr: "Traductions",
    it: "Traduzioni",
    en: "Translations",
  },
  "dashboard.mail": {
    de: "E-Mail Versand",
    fr: "Envoi d'e-mails",
    it: "Invio e-mail",
    en: "Email delivery",
  },
  "dashboard.geocoding": {
    de: "Geocoding",
    fr: "Géocodage",
    it: "Geocodifica",
    en: "Geocoding",
  },
  "common.save": { de: "Speichern", fr: "Enregistrer", it: "Salva", en: "Save" },
  "common.cancel": { de: "Abbrechen", fr: "Annuler", it: "Annulla", en: "Cancel" },
  "common.delete": { de: "Löschen", fr: "Supprimer", it: "Elimina", en: "Delete" },
  "common.edit": { de: "Bearbeiten", fr: "Modifier", it: "Modifica", en: "Edit" },
  "common.create": { de: "Neu erstellen", fr: "Créer", it: "Crea", en: "Create" },
  "common.approve": { de: "Freigeben", fr: "Approuver", it: "Approva", en: "Approve" },
  "common.reject": { de: "Ablehnen", fr: "Rejeter", it: "Rifiuta", en: "Reject" },
  "common.current": { de: "Aktuell", fr: "Actuel", it: "Attuale", en: "Current" },
  "common.proposed": {
    de: "Vorgeschlagen",
    fr: "Proposé",
    it: "Proposto",
    en: "Proposed",
  },
  "login.title": {
    de: "Superadmin-Anmeldung",
    fr: "Connexion superadmin",
    it: "Accesso superadmin",
    en: "Superadmin login",
  },
  "login.email": { de: "E-Mail", fr: "E-mail", it: "E-mail", en: "Email" },
  "login.password": {
    de: "Passwort",
    fr: "Mot de passe",
    it: "Password",
    en: "Password",
  },
  "login.submit": {
    de: "Anmelden",
    fr: "Se connecter",
    it: "Accedi",
    en: "Sign in",
  },
} as const satisfies Record<string, Record<Locale, string>>;

export type AdminI18nKey = keyof typeof DICT;

/** Liest die gewählte Portal-Sprache aus dem Cookie (Default: DE). */
export async function getAdminLocale(): Promise<Locale> {
  const value = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return LOCALES.includes(value as Locale) ? (value as Locale) : ADMIN_DEFAULT_LOCALE;
}

/** Übersetzungsfunktion für eine bestimmte Sprache. */
export function makeT(locale: Locale) {
  return (key: AdminI18nKey): string => DICT[key]?.[locale] ?? key;
}

/** Bequemer Server-Helper: liefert Locale + t() in einem. */
export async function getAdminT() {
  const locale = await getAdminLocale();
  return { locale, t: makeT(locale) };
}
