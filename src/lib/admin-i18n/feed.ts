import { m, type Msg } from "./msg";

export const FEED = {
  "feed.eyebrow": m("| Freigabe-Workflow", "| Validation", "| Approvazione", "| Approval workflow"),
  "feed.title": m("Änderungs-Feed", "Modifications", "Modifiche", "Change feed"),
  "feed.openCount": m(
    "{count} {requests} offen",
    "{count} {requests} en attente",
    "{count} {requests} in sospeso",
    "{count} {requests} open",
  ),
  "feed.openCountFiltered": m(
    "{shown} von {count} {requests} offen",
    "{shown} sur {count} {requests} en attente",
    "{shown} di {count} {requests} in sospeso",
    "{shown} of {count} {requests} open",
  ),
  "feed.requestOne": m("Anforderung", "demande", "richiesta", "request"),
  "feed.requestMany": m("Anforderungen", "demandes", "richieste", "requests"),
  "feed.explain": m(
    "Links der aktuelle Stand, rechts der Vorschlag der Firma. Freigeben übernimmt die Änderung in den Entwurf — online geht sie erst mit „Veröffentlichen“.",
    "À gauche l'état actuel, à droite la proposition de l'entreprise. Approuver reprend la modification dans le brouillon — elle n'est en ligne qu'après « Publier ».",
    "A sinistra lo stato attuale, a destra la proposta dell'azienda. Approvando, la modifica passa nella bozza — va online solo con «Pubblica».",
    "Current state on the left, the company's proposal on the right. Approving moves the change into the draft — it only goes online with “Publish”.",
  ),
  "feed.empty": m("Keine offenen Änderungen.", "Aucune modification en attente.", "Nessuna modifica in sospeso.", "No pending changes."),
  "feed.fieldsChanged": m("{count} Felder geändert", "{count} champ(s) modifié(s)", "{count} campi modificati", "{count} fields changed"),
  "feed.approve": m("Freigeben", "Approuver", "Approva", "Approve"),
  "feed.approving": m("Wird freigegeben …", "Approbation …", "Approvazione …", "Approving …"),
  "feed.rejecting": m("Wird abgelehnt …", "Refus en cours …", "Rifiuto in corso …", "Rejecting …"),
  "feed.colField": m("Feld", "Champ", "Campo", "Field"),
  "feed.allCompanies": m("Alle Firmen", "Toutes les entreprises", "Tutte le aziende", "All companies"),
  "feed.kind.text": m("Text", "Texte", "Testo", "Text"),
  "feed.kind.image": m("Bild", "Image", "Immagine", "Image"),
  "feed.kind.multilingual": m("Mehrsprachig", "Multilingue", "Multilingue", "Multilingual"),
  "feed.internalContactData": m("Interne Kontaktdaten", "Coordonnées internes", "Dati di contatto interni", "Internal contact data"),
} satisfies Record<string, Msg>;
