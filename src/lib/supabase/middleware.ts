import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Aktualisiert die Supabase-Session-Cookies bei jedem Request und schützt die
// /admin-Routen: Nicht eingeloggte Besucher werden auf /admin/login geleitet.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  // Seiten, die es ohne Session geben MUSS: Einladung annehmen und der
  // Passwort-Reset (Anfordern + Einlösen des Links aus der Mail). Ohne diese
  // Ausnahme landet der Link aus der Reset-Mail auf dem Login — und niemand
  // kommt je wieder rein, wenn das Passwort weg ist.
  const isPreSessionPage =
    pathname === "/admin/accept-invite" ||
    pathname === "/admin/forgot" ||
    pathname === "/admin/reset-password";

  if (isAdminArea && !isLoginPage && !isPreSessionPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
