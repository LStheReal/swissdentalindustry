import "@/styles/sdi/index.css";
import { SiteHeader } from "@/components/sdi/SiteHeader";
import { SiteFooter } from "@/components/sdi/SiteFooter";
import { GsapAnimations } from "@/components/sdi/GsapAnimations";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        background: "var(--surface-page)",
        color: "var(--text-primary)",
      }}
    >
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <GsapAnimations />
    </div>
  );
}
