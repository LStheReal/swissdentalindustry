import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { PUBLIC_LOCALE_HEADER, isLocale } from "@/lib/public-i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/types";

const LOCALE_COOKIE = "sdi_locale";

function setLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** Beste unterstützte Sprache aus dem Accept-Language-Header, sonst null. */
function matchBrowserLocale(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? parseFloat(q.slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return null;
}

// Next.js 16: "proxy" ersetzt die frühere "middleware"-Konvention.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin")) return updateSession(request);

  const [maybeLocale, ...rest] = pathname.split("/").filter(Boolean);

  if (isLocale(maybeLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${rest.join("/")}` || "/";

    // Die Default-Sprache lebt ohne Präfix — "/en/…" existiert nur als
    // Umschalt-Alias aus dem Sprachwähler: Wahl merken, kanonisch umleiten.
    if (maybeLocale === DEFAULT_LOCALE) {
      const response = NextResponse.redirect(url, 307);
      setLocaleCookie(response, maybeLocale);
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(PUBLIC_LOCALE_HEADER, maybeLocale);
    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    setLocaleCookie(response, maybeLocale);
    return response;
  }

  // Präfixloser Aufruf = Default-Sprache (Englisch). Hat der Besucher eine
  // gespeicherte Wahl oder eine andere unterstützte Browser-Sprache, leiten
  // wir dorthin um. Crawler senden i. d. R. kein de/fr/it und bleiben auf
  // der englischen Version; die hreflang-Links zeigen auf die Übersetzungen.
  const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferred = isLocale(cookieValue)
    ? cookieValue
    : matchBrowserLocale(request.headers.get("accept-language"));
  if (preferred && preferred !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  // Admin schützen; alle öffentlichen Seiten für Locale-Handling erfassen
  // (ausser Dateien mit Endung, _next, api und die Self-Service-Edit-Links).
  matcher: ["/admin/:path*", "/((?!_next|api|admin|edit|.*\\..*).*)"],
};
