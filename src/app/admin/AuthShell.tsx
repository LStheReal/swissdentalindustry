import Image from "next/image";

/** Gemeinsamer Rahmen für Login, Passwort-Reset und Einladung. */
export function AuthShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e7e5df] p-4 text-[#0a0a0b]">
      <div className="w-full max-w-sm overflow-hidden rounded-[2px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="h-[3px] bg-[#e1000f]" />
        <div className="space-y-5 p-8">
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/sdi/logo.png"
              alt="Swiss Dental Industry"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
            <p className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
