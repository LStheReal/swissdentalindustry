/**
 * Einmalige Reparatur: entfernt die doppelte Firmennennung am Anfang
 * bestehender Beschreibungen — in allen vier Sprachen.
 *
 * Benutzt denselben Filter wie die Anwendung (src/lib/description.ts), damit
 * Reparatur und Schutz nicht auseinanderlaufen.
 *
 *   npx tsx scripts/fix-duplicated-descriptions.ts
 *   npx tsx scripts/fix-duplicated-descriptions.ts --apply
 */

import { createClient } from "@supabase/supabase-js";
import { cleanDescription } from "../src/lib/description";
import { LOCALES, type Multilingual } from "../src/lib/types";

const APPLY = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY werden gebraucht.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase
    .from("members")
    .select("id, name, description")
    .order("name");
  if (error) throw new Error(error.message);

  // Unabhängiger Detektor: meldet JEDE führende Wortwiederholung, auch wenn
  // der Filter sie nicht anfasst. So bleibt nichts unbemerkt, das der Filter
  // (noch) nicht erkennt.
  const suspicious: string[] = [];
  const words = (t: string) => t.trim().split(/\s+/).filter(Boolean);

  let touched = 0;
  for (const row of (data ?? []) as { id: string; name: string; description: Multilingual }[]) {
    const cleaned = cleanDescription(row.name, row.description);
    const changed = LOCALES.filter((l) => cleaned[l] !== (row.description?.[l] ?? ""));

    for (const l of LOCALES) {
      const w = words(cleaned[l]);
      for (let k = 1; k <= 4 && k * 2 <= w.length; k++) {
        const a = w.slice(0, k).join(" ").toLowerCase();
        const b = w.slice(k, k * 2).join(" ").toLowerCase();
        if (a === b) {
          suspicious.push(`${row.name} [${l}] ${w.slice(0, 8).join(" ")}…`);
          break;
        }
      }
    }

    if (!changed.length) continue;

    touched++;
    console.log(`\n${row.name}  (${changed.join(", ")})`);
    for (const l of changed) {
      console.log(`   ${l} vorher: ${(row.description[l] || "").slice(0, 70)}…`);
      console.log(`   ${l} nachher: ${cleaned[l].slice(0, 70)}…`);
    }

    if (APPLY) {
      const { error: updErr } = await supabase
        .from("members")
        .update({ description: cleaned })
        .eq("id", row.id);
      if (updErr) throw new Error(`${row.name}: ${updErr.message}`);
    }
  }

  if (suspicious.length) {
    console.log("\nNach dem Filter noch verdächtig (bitte ansehen):");
    for (const l of suspicious) console.log("  ", l);
  } else {
    console.log("\nNach dem Filter keine führende Wortwiederholung mehr gefunden.");
  }

  console.log(`\nBetroffene Firmen: ${touched}`);
  console.log(APPLY ? "Geschrieben." : "Probelauf — nichts geschrieben. Mit --apply ausführen.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
