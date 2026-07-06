import type { Metadata } from "next";
import "@/styles/v2/index.css";
import { V2Header } from "@/components/v2/Header";
import { V2Footer } from "@/components/v2/Footer";
import { V2Fx } from "@/components/v2/Fx";

// Design-Preview: darf nicht neben der Live-Site indexiert werden
// (Duplicate Content). Fällt weg, sobald v2 die Hauptseite ersetzt.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v2-root" id="top">
      <V2Header />
      <main>{children}</main>
      <V2Footer />
      <V2Fx />
    </div>
  );
}
