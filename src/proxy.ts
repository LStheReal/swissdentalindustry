import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { PUBLIC_LOCALE_HEADER, isLocale } from "@/lib/public-i18n";

// Next.js 16: "proxy" ersetzt die frühere "middleware"-Konvention.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [maybeLocale, ...rest] = pathname.split("/").filter(Boolean);

  if (isLocale(maybeLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${rest.join("/")}` || "/";

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(PUBLIC_LOCALE_HEADER, maybeLocale);

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.cookies.set("sdi_locale", maybeLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  return updateSession(request);
}

export const config = {
  // Admin schützen und Public-Locale-Prefixes (/de, /fr, /it, /en) auswerten.
  matcher: ["/admin/:path*", "/de/:path*", "/fr/:path*", "/it/:path*", "/en/:path*"],
};
