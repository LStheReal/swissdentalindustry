import { createClient } from "@/lib/supabase/server";
import { formatAdminDateTime, getAdminT, type AdminI18nKey } from "@/lib/i18n-admin";

interface MailLogRow {
  id: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "dropped_test_mode";
  error: string | null;
  provider_response: string | null;
  created_at: string;
}

const STATUS_CLASS: Record<MailLogRow["status"], string> = {
  sent: "text-[#1f8a5b]",
  failed: "text-[#e1000f]",
  dropped_test_mode: "text-[#a66a00]",
};

export default async function MailLogPage() {
  const supabase = await createClient();
  const { t, locale } = await getAdminT();
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
        <h2 className="text-[17px] font-bold">{t("mailLog.title")}</h2>
        <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-[#6b6b73]">
          {t("mailLog.intro")}
        </p>
      </div>

      {failed > 0 && (
        <p className="rounded-[2px] border-l-2 border-[#e1000f] bg-[#fdecec] px-4 py-3 text-[13px] text-[#b3000c]">
          {t("mailLog.failedCount", { count: failed })}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-[13.5px] text-[#6b6b73]">{t("mailLog.empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e2e7] text-left">
                <Th>{t("mailLog.colTime")}</Th>
                <Th>{t("mailLog.colRecipient")}</Th>
                <Th>{t("field.subject")}</Th>
                <Th>{t("field.status")}</Th>
                <Th>{t("mailLog.colResponse")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f0f0f2] align-top">
                  <Td>
                    <span className="font-sdi-mono whitespace-nowrap text-[11.5px] text-[#6b6b73]">
                      {formatAdminDateTime(row.created_at, locale)}
                    </span>
                  </Td>
                  <Td>
                    <span className="break-all">{row.recipient}</span>
                  </Td>
                  <Td>{row.subject}</Td>
                  <Td>
                    <span className={`font-semibold ${STATUS_CLASS[row.status]}`}>
                      {t(`mailLog.status.${row.status}` as AdminI18nKey)}
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
