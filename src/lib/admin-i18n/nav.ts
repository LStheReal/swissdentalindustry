import { m, type Msg } from "./msg";

export const NAV = {
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
  "nav.mail": {
    de: "Serienmail",
    fr: "Publipostage",
    it: "Mailing",
    en: "Mass mail",
  },
  "nav.export": {
    de: "Export",
    fr: "Export",
    it: "Esportazione",
    en: "Export",
  },
  "nav.settings": {
    de: "Einstellungen",
    fr: "Paramètres",
    it: "Impostazioni",
    en: "Settings",
  },
  "nav.language": { de: "Sprache", fr: "Langue", it: "Lingua", en: "Language" },
  "nav.logout": { de: "Abmelden", fr: "Déconnexion", it: "Esci", en: "Log out" },
  "nav.navigation": m("Navigation", "Navigation", "Navigazione", "Navigation"),
  "nav.openMenu": m("Menü öffnen", "Ouvrir le menu", "Apri menu", "Open menu"),
  "nav.closeMenu": m("Menü schliessen", "Fermer le menu", "Chiudi menu", "Close menu"),
  "nav.portalLanguage": m("Portal-Sprache", "Langue du portail", "Lingua del portale", "Portal language"),
} satisfies Record<string, Msg>;
