import { createClient } from "@/lib/supabase/server";

interface MailLogRow {
  id: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "dropped_test_mode";
  error: string | null;
  provider_response: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<MailLogRow["status"], string> = {
  sent: "Angenommen",
  failed: "Fehlgeschlagen",
  dropped_test_mode: "Test-Modus · verworfen",
};

const STATUS_CLASS: Record<MailLogRow["status"], string> = {
  sent: "text-[#1f8a5b]",
  failed: "text-[#e1000f]",
  dropped_test_mode: "text-[#a66a00]",
};

export default async function MailLogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mail_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as MailLogRow[];
  const failed = rows.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[17px] font-bold">Mail-Protokoll</h2>
        <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-[#6b6b73]">
          Die letzten 200 Sendeversuche. „Angenommen“ heisst, der SMTP-Server hat
          die Nachricht entgegengenommen — <strong>nicht</strong>, dass sie im
          Postfach des Empfängers angekommen ist. Genau diese Unterscheidung war
          hier lange das Problem: der Server quittierte mit „250 queued“ und
          stellte trotzdem nicht zu.
        </p>
      </div>

      {failed > 0 && (
        <p className="rounded-[2px] border-l-2 border-[#e1000f] bg-[#fdecec] px-4 py-3 text-[13px] text-[#b3000c]">
          {failed} fehlgeschlagene{failed === 1 ? "r" : ""} Versand
          {failed === 1 ? "" : "e"} in den letzten 200 Einträgen.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-[13.5px] text-[#6b6b73]">Noch keine Sendeversuche protokolliert.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e2e7] text-left">
                <Th>Zeitpunkt</Th>
                <Th>Empfänger</Th>
                <Th>Betreff</Th>
                <Th>Status</Th>
                <Th>Antwort / Fehler</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f0f0f2] align-top">
                  <Td>
                    <span className="font-sdi-mono whitespace-nowrap text-[11.5px] text-[#6b6b73]">
                      {new Date(row.created_at).toLocaleString("de-CH")}
                    </span>
                  </Td>
                  <Td>
                    <span className="break-all">{row.recipient}</span>
                  </Td>
                  <Td>{row.subject}</Td>
                  <Td>
                    <span className={`font-semibold ${STATUS_CLASS[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </Td>
                  <Td>
                    <span className="break-words text-[12px] text-[#6b6b73]">
                      {row.error || row.provider_response || "—"}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-sdi-mono px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b6b73]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-2.5">{children}</td>;
}
