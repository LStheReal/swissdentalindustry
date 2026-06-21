import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export interface AdminUser {
  id: string;
  email: string | null;
}

/**
 * Stellt sicher, dass ein eingeloggter Superadmin vorliegt. Nutzt die
 * Cookie-Session und prüft die Mitgliedschaft in der `admins`-Tabelle.
 * Leitet sonst auf die Login-Seite um. Für Server-Komponenten/Actions.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) redirect("/admin/login?error=not_admin");

  return { id: user.id, email: user.email ?? null };
}
