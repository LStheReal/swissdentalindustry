"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirect") || "/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "E-Mail oder Passwort ist falsch." };
  }

  // Prüfen, ob der User auch wirklich Superadmin ist.
  // is_admin() ist SECURITY DEFINER → läuft mit erhöhten Rechten, umgeht RLS.
  // Die Session ist nach signInWithPassword im Client-Objekt aktiv, daher
  // funktioniert auth.uid() innerhalb der Funktion korrekt.
  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "Dieses Konto hat keine Superadmin-Berechtigung." };
  }

  redirect(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
