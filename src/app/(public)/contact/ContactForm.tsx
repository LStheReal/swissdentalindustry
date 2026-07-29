"use client";

import { useState } from "react";
import { Button } from "@/components/sdi/Button";
import { getPublicCopy } from "@/lib/public-copy";
import { type Locale } from "@/lib/types";

const input =
  "mt-2 w-full rounded-[4px] border border-[color:var(--border-default)] bg-white px-4 py-3 text-[15px] outline-none transition focus:border-[color:var(--accent)]";

export function ContactForm({ locale }: { locale: Locale }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const copy = getPublicCopy(locale).contactForm;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError(false);

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/forms/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error || copy.error);
      form.reset();
      setMessage(copy.success);
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : copy.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Honeypot: unsichtbar fuer Menschen, Bots fuellen es aus */}
      <input
        type="text"
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.name}</span>
          <input name="name" required className={input} autoComplete="name" />
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.company}</span>
          <input name="company" className={input} autoComplete="organization" />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.email}</span>
          <input name="email" type="email" required className={input} autoComplete="email" />
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.phone}</span>
          <input name="phone" className={input} autoComplete="tel" />
        </label>
      </div>

      <label className="block">
        <span className="text-[14px] font-semibold">{copy.subject}</span>
        <input name="subject" className={input} />
      </label>

      <label className="block">
        <span className="text-[14px] font-semibold">{copy.message}</span>
        <textarea name="message" rows={6} required className={input} />
      </label>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? copy.sending : copy.submit}
        </Button>
        {message ? (
          <p
            aria-live="polite"
            className={[
              "text-[14px] font-semibold",
              error ? "text-[color:var(--status-error)]" : "text-[color:var(--status-success)]",
            ].join(" ")}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
