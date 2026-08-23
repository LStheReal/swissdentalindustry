import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EXPORT_COLUMNS,
  EXPORT_FILTER_LABELS,
  buildExportRows,
  isExportFilter,
} from "@/lib/member-export";

/**
 * Lädt die Mitglieder- und Kontaktliste als .xlsx.
 *
 * Als Route und nicht als Server-Action, weil eine Server-Action keine Datei
 * zum Download zurückgeben kann. `requireAdmin()` steht wie überall am Anfang.
 */
export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const raw = url.searchParams.get("filter");
  const filter = isExportFilter(raw) ? raw : "all";

  const supabase = createAdminClient();
  const rows = await buildExportRows(supabase, filter);

  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: [...EXPORT_COLUMNS],
  });

  // Spaltenbreiten, sonst ist jede Spalte gleich schmal und die Tabelle
  // unbrauchbar, bevor man sie einmal von Hand gezogen hat.
  sheet["!cols"] = EXPORT_COLUMNS.map((column) => {
    const longest = rows.reduce((max, row) => {
      const value = row[column];
      return Math.max(max, value == null ? 0 : String(value).length);
    }, column.length);
    return { wch: Math.min(Math.max(longest + 2, 10), 45) };
  });

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Mitglieder");

  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = { main: "hauptkontakte", billing: "rechnungskontakte", all: "alle-kontakte" }[
    filter
  ];
  const filename = `sdi-mitglieder-${suffix}-${stamp}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Export-Filter": EXPORT_FILTER_LABELS[filter],
    },
  });
}
