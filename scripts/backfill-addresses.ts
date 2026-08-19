/**
 * Einmaliger Backfill für Migration 0013: zerlegt die gewachsene
 * Freitext-Adresse in Strasse / Hausnummer / PLZ / Ort.
 *
 * Zwei Quellen, in dieser Reihenfolge:
 *
 *  1. `member_internal_profiles` (Position 1). Der ASDI-Spreadsheet-Import hat
 *     die Adresse dort bereits sauber zerlegt erfasst — das ist die
 *     verlässlichste Quelle und wird nicht neu geraten.
 *  2. Sonst: `members.address` durch denselben Parser, den die Anwendung
 *     benutzt (src/lib/address.ts). Nur wenn PLZ **und** Ort dabei
 *     herauskommen, gilt die Zerlegung als gelungen.
 *
 * Alles andere behält `address_needs_review = true` und wird im Admin-Portal
 * zur Handprüfung angezeigt — lieber unbearbeitet als falsch zerlegt.
 *
 *   npx tsx scripts/backfill-addresses.ts --dry-run
 *   npx tsx scripts/backfill-addresses.ts --apply
 */

import { createClient } from "@supabase/supabase-js";
import { formatAddress, parseAddress, type Address } from "../src/lib/address";

const APPLY = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY werden gebraucht.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

type MemberRow = { id: string; name: string; address: string | null };
type ProfileRow = { member_id: string } & Partial<Address>;

async function main() {
  const { data: members, error: mErr } = await supabase
    .from("members")
    .select("id, name, address")
    .order("name");
  if (mErr) throw new Error(mErr.message);

  const { data: profiles, error: pErr } = await supabase
    .from("member_internal_profiles")
    .select("member_id, street_name, street_number, postal_code, city")
    .eq("position", 1);
  if (pErr) throw new Error(pErr.message);

  const byMember = new Map((profiles as ProfileRow[]).map((p) => [p.member_id, p]));

  const fromProfile: string[] = [];
  const fromParser: string[] = [];
  const flagged: string[] = [];

  for (const member of (members ?? []) as MemberRow[]) {
    const profile = byMember.get(member.id);
    let address: Address | null = null;
    let source = "";

    if (profile?.postal_code && profile?.city) {
      address = {
        street_name: profile.street_name ?? null,
        street_number: profile.street_number ?? null,
        postal_code: profile.postal_code,
        city: profile.city,
      };
      source = "profile";
    } else {
      const parsed = parseAddress(member.address);
      if (parsed.parsed) {
        address = parsed.address;
        source = "parser";
      }
    }

    if (!address) {
      flagged.push(`${member.name} — ${JSON.stringify(member.address)}`);
      continue;
    }

    const line = `${member.name} → ${formatAddress(address).replace(/\n/g, " · ")}`;
    (source === "profile" ? fromProfile : fromParser).push(line);

    if (APPLY) {
      const { error } = await supabase
        .from("members")
        .update({ ...address, address_needs_review: false })
        .eq("id", member.id);
      if (error) throw new Error(`${member.name}: ${error.message}`);
    }
  }

  console.log(`\nAus dem internen Profil übernommen: ${fromProfile.length}`);
  for (const l of fromProfile) console.log("  ", l);
  console.log(`\nAus dem Freitext zerlegt: ${fromParser.length}`);
  for (const l of fromParser) console.log("  ", l);
  console.log(`\nZur Handprüfung markiert: ${flagged.length}`);
  for (const l of flagged) console.log("  ", l);
  console.log(APPLY ? "\nGeschrieben." : "\nProbelauf — nichts geschrieben. Mit --apply ausführen.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
