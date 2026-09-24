import { m, type Msg } from "./msg";

export const EXPORT = {
  "export.eyebrow": m("Export", "Export", "Esportazione", "Export"),
  "export.metaTitle": m("Export – Admin", "Export – Admin", "Esportazione – Admin", "Export – Admin"),
  "export.title": m("Mitglieder und Kontakte als Excel", "Membres et contacts en Excel", "Membri e contatti in Excel", "Members and contacts as Excel"),
  "export.intro": m(
    "Eine Zeile je Kontakt, die Firmenangaben wiederholen sich — so lässt sich die Tabelle direkt für Serienbriefe, Rechnungen oder Auswertungen verwenden. Firmen ohne passenden Kontakt erscheinen mit leeren Kontaktspalten, damit keine Firma stillschweigend fehlt.",
    "Une ligne par contact, les données de l'entreprise se répètent — le tableau peut ainsi servir directement pour des publipostages, des factures ou des analyses. Les entreprises sans contact correspondant apparaissent avec des colonnes de contact vides, afin qu'aucune ne manque.",
    "Una riga per contatto, i dati dell'azienda si ripetono — così la tabella si usa direttamente per lettere in serie, fatture o analisi. Le aziende senza contatto corrispondente compaiono con colonne di contatto vuote, così nessuna manca.",
    "One row per contact, with the company details repeated — so the sheet can be used directly for mail merges, invoices or analysis. Companies without a matching contact appear with empty contact columns, so none go missing silently.",
  ),
  "export.filter.main": m("Nur Hauptkontakte", "Contacts principaux uniquement", "Solo contatti principali", "Main contacts only"),
  "export.filter.billing": m("Nur Rechnungskontakte", "Contacts de facturation uniquement", "Solo contatti di fatturazione", "Billing contacts only"),
  "export.filter.all": m("Alle Kontakte", "Tous les contacts", "Tutti i contatti", "All contacts"),
  "export.counts": m("{rows} Zeile(n) · {companies} Firma/Firmen", "{rows} ligne(s) · {companies} entreprise(s)", "{rows} righe · {companies} aziende", "{rows} row(s) · {companies} company/companies"),
  "export.download": m(".xlsx herunterladen", "Télécharger .xlsx", "Scarica .xlsx", "Download .xlsx"),
  "export.columns": m("Enthaltene Spalten ({count})", "Colonnes incluses ({count})", "Colonne incluse ({count})", "Included columns ({count})"),
  "export.columnsNote": m(
    "Die Spaltenüberschriften in der Datei bleiben unabhängig von der Portal-Sprache deutsch, damit Serienbrief-Vorlagen weiter passen.",
    "Les en-têtes de colonnes du fichier restent en allemand quelle que soit la langue du portail, afin que les modèles de publipostage restent compatibles.",
    "Le intestazioni delle colonne nel file restano in tedesco indipendentemente dalla lingua del portale, così i modelli di lettere in serie continuano a funzionare.",
    "The column headers in the file stay German regardless of the portal language, so mail-merge templates keep working.",
  ),
} satisfies Record<string, Msg>;
