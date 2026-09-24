"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAdminT } from "@/components/admin/AdminI18n";

type Status = "checking" | "working" | "invalid";

/**
 * Der Reset-Link liefert die Tokens im URL-Fragment (#access_token=…&type=
 * recovery), nicht als ?code=. Das Fragment wird nie an den Server geschickt
 * — deshalb läuft der komplette Check hier im Browser: Tokens auslesen,
 * Session damit aufbauen (schreibt den Auth-Cookie), dann sauber neu laden,
 * damit die Serverkomponente die Session sieht und das Formular rendert.
 */
export function RecoveryGate() {
  const { t } = useAdminT();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(raw);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (params.get("type") !== "recovery" || !accessToken || !refreshToken) {
      // window.location existiert erst nach dem Mount (kein SSR-Äquivalent) —
      // der Status kann hier nicht während des Renders berechnet werden.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("invalid");
      return;
    }

    setStatus("working");
    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setStatus("invalid");
          return;
        }
        // Sauberer Reload ohne Fragment (die Tokens sollen nicht in der
        // Adresszeile/History stehen bleiben). Die Serverkomponente sieht die
        // Session jetzt über den Cookie und rendert das Passwort-Formular.
        window.location.replace(window.location.pathname);
      });
  }, []);

  if (status === "checking" || status === "working") {
    return <p className="text-[13px] text-[#4a4a51]">{t("reset.checking")}</p>;
  }

  return (
    <>
      <p className="text-sm text-red-700">
        {t("reset.invalidLink")}
      </p>
      <Link
        href="/admin/forgot"
        className="inline-block text-[12px] font-semibold underline underline-offset-2"
      >
        {t("reset.requestAgain")}
      </Link>
    </>
  );
}
