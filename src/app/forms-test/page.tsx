"use client";

import { useState } from "react";

// Schlichtes Testformular zum Prüfen der Formular-Endpoints.
// Wird später durch die gestalteten Seiten der öffentlichen Website ersetzt.
function postJson(url: string, form: HTMLFormElement) {
  const data = Object.fromEntries(new FormData(form).entries());
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export default function FormsTestPage() {
  const [msg, setMsg] = useState("");

  async function handle(
    e: React.FormEvent<HTMLFormElement>,
    url: string,
    label: string,
  ) {
    e.preventDefault();
    setMsg("…");
    const res = await postJson(url, e.currentTarget);
    setMsg(`${label}: ${res.ok ? "OK ✓" : "Fehler"} (${res.status})`);
  }

  const input = "w-full rounded border border-slate-300 px-3 py-2 text-sm mb-2";

  return (
    <main className="mx-auto max-w-xl space-y-10 p-8">
      <p className="text-sm text-slate-500">
        Dev-Testseite für die Formular-Endpoints.
      </p>

      <form onSubmit={(e) => handle(e, "/api/forms/mitwirken", "Mitwirken")}>
        <h2 className="mb-2 font-semibold">Mitwirken</h2>
        <input name="name" placeholder="Name" className={input} />
        <input name="email" placeholder="E-Mail" className={input} />
        <textarea name="message" placeholder="Nachricht" className={input} />
        <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Senden
        </button>
      </form>

      <form
        onSubmit={(e) => handle(e, "/api/forms/mitglied-werden", "Mitglied werden")}
      >
        <h2 className="mb-2 font-semibold">Mitglied werden</h2>
        <input name="name" placeholder="Firmenname" className={input} />
        <input name="email" placeholder="E-Mail" className={input} />
        <input name="phone" placeholder="Telefon" className={input} />
        <input name="address" placeholder="Adresse" className={input} />
        <textarea name="description" placeholder="Beschreibung" className={input} />
        <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Antrag senden
        </button>
      </form>

      {msg && <p className="text-sm font-medium">{msg}</p>}
    </main>
  );
}
