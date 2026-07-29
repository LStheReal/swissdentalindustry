"use client";

import { useState } from "react";
import { Button } from "@/components/sdi/Button";
import { getPublicCopy } from "@/lib/public-copy";
import { type Locale } from "@/lib/types";

type FormState =
  | { status: "idle"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const input =
  "mt-2 w-full rounded-[4px] border border-[color:var(--border-default)] bg-white px-4 py-3 text-[15px] outline-none transition focus:border-[color:var(--accent)]";

export function MembershipApplicationForm({ locale }: { locale: Locale }) {
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });
  const [pending, setPending] = useState(false);
  const copy = getPublicCopy(locale).membershipForm;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({ status: "idle", message: "" });

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/forms/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error || copy.error);

      form.reset();
      setState({
        status: "success",
        message: copy.success,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : copy.error,
      });
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
          <span className="text-[14px] font-semibold">{copy.company}</span>
          <input name="company" required className={input} autoComplete="organization" />
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.contact}</span>
          <input name="name" required className={input} autoComplete="name" />
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
        <span className="text-[14px] font-semibold">{copy.website}</span>
        <input name="website_url" className={input} placeholder="https://..." autoComplete="url" />
      </label>

      <label className="block">
        <span className="text-[14px] font-semibold">{copy.address}</span>
        <textarea name="address" rows={3} className={input} />
      </label>

      <label className="block">
        <span className="text-[14px] font-semibold">{copy.description}</span>
        <textarea
          name="description"
          rows={5}
          className={input}
          placeholder={copy.descriptionPlaceholder}
        />
      </label>

      <label className="block">
        <span className="text-[14px] font-semibold">{copy.message}</span>
        <textarea
          name="message"
          rows={4}
          className={input}
          placeholder={copy.messagePlaceholder}
        />
      </label>

      <input type="hidden" name="source" value="public_mitglied_werden" />

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? copy.sending : copy.submit}
        </Button>
        {state.message ? (
          <p
            aria-live="polite"
            className={[
              "text-[14px] font-semibold",
              state.status === "success" ? "text-[color:var(--status-success)]" : "",
              state.status === "error" ? "text-[color:var(--status-error)]" : "",
            ].join(" ")}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
