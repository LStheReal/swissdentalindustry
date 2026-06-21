import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase-Client für Server-Komponenten / Server-Actions. An die Cookies des
// Requests gebunden, damit die eingeloggte Superadmin-Session erkannt wird.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // In Server-Komponenten kann setAll fehlschlagen — wird von der
            // Middleware/Route-Handlern übernommen. Bewusst ignoriert.
          }
        },
      },
    },
  );
}
