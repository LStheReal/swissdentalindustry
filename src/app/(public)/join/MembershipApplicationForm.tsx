"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/sdi/Button";
import { getPublicCopy } from "@/lib/public-copy";
import { type Locale } from "@/lib/types";
import { addressFieldLabel } from "@/lib/address";

type FormState =
  | { status: "idle"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const input =
  "mt-2 w-full rounded-[4px] border border-[color:var(--border-default)] bg-white px-4 py-3 text-[15px] outline-none transition focus:border-[color:var(--accent)]";

// Muss mit der serverseitigen Prüfung in /api/forms/join übereinstimmen.
const MAX_LOGO_BYTES = 4 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function MembershipApplicationForm({ locale }: { locale: Locale }) {
  const [state, setState] = useState<FormState>({ status: "idle", message: "" });
  const [pending, setPending] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  // "Entspricht der Firmenadresse": füllt die Felder der Kontaktperson und
  // deaktiviert sie. Deaktivierte Felder werden nicht mitgeschickt — der
  // Server übernimmt die Firmenadresse deshalb anhand des Flags.
  const [sameAddress, setSameAddress] = useState(true);
  const [companyAddress, setCompanyAddress] = useState({
    street_name: "",
    street_number: "",
    postal_code: "",
    city: "",
  });
  const [contactAddress, setContactAddress] = useState({
    street_name: "",
    street_number: "",
    postal_code: "",
    city: "",
  });
  // Angezeigt wird bei gesetztem Haken die Firmenadresse; die eigene Eingabe
  // der Kontaktperson bleibt dahinter erhalten, falls der Haken wieder weggeht.
  const shownContactAddress = sameAddress ? companyAddress : contactAddress;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const copy = getPublicCopy(locale).membershipForm;

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  function onLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setLogoPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file ? URL.createObjectURL(file) : null;
    });
    setLogoName(file?.name ?? null);

    // Sofort zurückmelden statt erst nach dem Absenden.
    if (file && file.size > MAX_LOGO_BYTES) {
      setState({ status: "error", message: copy.logoTooLarge });
    } else if (file && !LOGO_TYPES.includes(file.type)) {
      setState({ status: "error", message: copy.logoWrongType });
    } else {
      setState({ status: "idle", message: "" });
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    const logoFile = logoInputRef.current?.files?.[0] ?? null;
    if (logoFile && logoFile.size > MAX_LOGO_BYTES) {
      setState({ status: "error", message: copy.logoTooLarge });
      return;
    }
    if (logoFile && !LOGO_TYPES.includes(logoFile.type)) {
      setState({ status: "error", message: copy.logoWrongType });
      return;
    }

    setPending(true);
    setState({ status: "idle", message: "" });

    try {
      // Multipart statt JSON — das Logo geht als Datei mit.
      const response = await fetch("/api/forms/join", {
        method: "POST",
        body: new FormData(form),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error || copy.error);

      form.reset();
      setLogoPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      setLogoName(null);
      setState({ status: "success", message: copy.success });
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

      <p className="text-[13px] text-[color:var(--text-muted)]">{copy.requiredNote}</p>

      <SectionHeading>{copy.companySection}</SectionHeading>

      <label className="block">
        <span className="text-[14px] font-semibold">{copy.company}</span>
        <input name="company" required className={input} autoComplete="organization" />
      </label>

      <fieldset className="block">
        <legend className="text-[14px] font-semibold">{copy.address}</legend>
        <div className="mt-2 grid gap-5 sm:grid-cols-[1fr_8rem]">
          <label className="block">
            <span className="text-[13px] font-semibold">{copy.street}</span>
            <input
              name="street_name"
              required
              className={input}
              autoComplete="address-line1"
              onChange={(e) => setCompanyAddress((a) => ({ ...a, street_name: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold">{copy.streetNumber}</span>
            <input
              name="street_number"
              className={input}
              onChange={(e) => setCompanyAddress((a) => ({ ...a, street_number: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-[8rem_1fr]">
          <label className="block">
            <span className="text-[13px] font-semibold">{copy.postalCode}</span>
            <input
              name="postal_code"
              required
              inputMode="numeric"
              className={input}
              autoComplete="postal-code"
              onChange={(e) => setCompanyAddress((a) => ({ ...a, postal_code: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold">{copy.city}</span>
            <input
              name="city"
              required
              className={input}
              autoComplete="address-level2"
              onChange={(e) => setCompanyAddress((a) => ({ ...a, city: e.target.value }))}
            />
          </label>
        </div>
      </fieldset>

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

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.website}</span>
          <input name="website_url" className={input} placeholder="https://..." autoComplete="url" />
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.employees}</span>
          <input name="employee_count" type="number" min="0" step="1" className={input} />
        </label>
      </div>

      <label className="block">
        <span className="text-[14px] font-semibold">{copy.description}</span>
        <textarea
          name="description"
          rows={5}
          required
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

      {/* Logo — erscheint direkt auf der Mitglieder-Karte, deshalb hier schon. */}
      <div className="block">
        <span className="text-[14px] font-semibold">{copy.logo}</span>
        <div className="mt-2 flex flex-wrap items-center gap-4 rounded-[4px] border border-[color:var(--border-default)] bg-white p-4">
          <div className="flex h-[84px] w-[140px] shrink-0 items-center justify-center rounded-[3px] border border-[color:var(--border-default)] bg-[color:var(--surface-2,#fafaf8)]">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="max-h-[72px] max-w-[128px] object-contain" />
            ) : (
              <span className="font-sdi-mono text-[13px] font-bold tracking-[0.04em] text-[#c4c4cc]">
                SDI
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <input
              ref={logoInputRef}
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={onLogoChange}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="rounded-[3px] border border-[color:var(--border-default)] bg-white px-3 py-2 text-[13px] font-semibold hover:bg-[#f2f2f0]"
            >
              {logoName ? copy.logoChange : copy.logoSelect}
            </button>
            <p className="mt-2 truncate text-[12px] text-[color:var(--text-muted)]">
              {logoName ?? copy.logoNone}
            </p>
            <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">{copy.logoHint}</p>
          </div>
        </div>
      </div>

      <SectionHeading>{copy.contactSection}</SectionHeading>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.contactLastName}</span>
          <input name="contact_last_name" required className={input} autoComplete="family-name" />
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.contactFirstName}</span>
          <input name="contact_first_name" required className={input} autoComplete="given-name" />
        </label>
      </div>

      <label className="block">
        <span className="text-[14px] font-semibold">{copy.contactJobTitle}</span>
        <input name="contact_job_title" className={input} autoComplete="organization-title" />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.contactEmail}</span>
          <input name="contact_email" type="email" required className={input} />
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold">{copy.contactPhone}</span>
          <input name="contact_phone" className={input} />
        </label>
      </div>

      <fieldset className="block">
        <legend className="text-[14px] font-semibold">{copy.contactAddress}</legend>

        <label className="mt-3 flex items-center gap-2.5 text-[14px]">
          <input
            type="checkbox"
            name="contact_address_same"
            value="1"
            checked={sameAddress}
            onChange={(e) => setSameAddress(e.target.checked)}
            className="h-4 w-4 shrink-0 accent-[color:var(--accent,#e1000f)]"
          />
          <span>{copy.sameAsCompany}</span>
        </label>

        <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_8rem]">
          <label className="block">
            <span className="text-[13px] font-semibold">{addressFieldLabel("street_name", locale)}</span>
            <input
              name="contact_street_name"
              disabled={sameAddress}
              value={shownContactAddress.street_name}
              onChange={(e) =>
                setContactAddress((a) => ({ ...a, street_name: e.target.value }))
              }
              className={`${input} disabled:bg-[#f2f2f0] disabled:text-[color:var(--text-muted)]`}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold">{addressFieldLabel("street_number", locale)}</span>
            <input
              name="contact_street_number"
              disabled={sameAddress}
              value={shownContactAddress.street_number}
              onChange={(e) =>
                setContactAddress((a) => ({ ...a, street_number: e.target.value }))
              }
              className={`${input} disabled:bg-[#f2f2f0] disabled:text-[color:var(--text-muted)]`}
            />
          </label>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-[8rem_1fr]">
          <label className="block">
            <span className="text-[13px] font-semibold">{addressFieldLabel("postal_code", locale)}</span>
            <input
              name="contact_postal_code"
              inputMode="numeric"
              disabled={sameAddress}
              value={shownContactAddress.postal_code}
              onChange={(e) =>
                setContactAddress((a) => ({ ...a, postal_code: e.target.value }))
              }
              className={`${input} disabled:bg-[#f2f2f0] disabled:text-[color:var(--text-muted)]`}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold">{addressFieldLabel("city", locale)}</span>
            <input
              name="contact_city"
              disabled={sameAddress}
              value={shownContactAddress.city}
              onChange={(e) =>
                setContactAddress((a) => ({ ...a, city: e.target.value }))
              }
              className={`${input} disabled:bg-[#f2f2f0] disabled:text-[color:var(--text-muted)]`}
            />
          </label>
        </div>
      </fieldset>

      <input type="hidden" name="source" value="public_join" />
      {/* Sprache mitschicken: die Zusage bzw. Ablehnung geht später in genau
          der Sprache raus, in der der Antrag gestellt wurde. */}
      <input type="hidden" name="locale" value={locale} />

      <p className="text-[13px] text-[color:var(--text-muted)]">{copy.reviewNote}</p>

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

/** Trennt Firma und Kontaktperson sichtbar voneinander. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-[color:var(--border-default)] pb-2 pt-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
      {children}
    </h3>
  );
}
