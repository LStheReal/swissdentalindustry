import type { Metadata } from "next";

// Dev-Testseite: nie indexieren.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function FormsTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
