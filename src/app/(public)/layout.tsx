import "@/styles/v2/index.css";
import { V2Header } from "@/components/v2/Header";
import { V2Footer } from "@/components/v2/Footer";
import { V2Fx } from "@/components/v2/Fx";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <div className="v2-root" id="top">
      <V2Header locale={locale} copy={copy.header} />
      <main>{children}</main>
      <V2Footer />
      <V2Fx />
    </div>
  );
}
