// Die Formular-Endpunkte sind öffentlich und ungeschützt (kein Login).
// parseFormPayload ist die Grenze: Feldanzahl, Längen, Prototype-Pollution.

import { describe, it, expect } from "vitest";
import {
  HONEYPOT_FIELD,
  isHoneypotTripped,
  parseFormPayload,
  payloadToText,
} from "@/lib/forms";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/forms/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("parseFormPayload", () => {
  it("liest JSON als flaches String-Objekt", async () => {
    const out = await parseFormPayload(jsonRequest({ name: "Anna", n: 42 }));
    expect(out).toEqual({ name: "Anna", n: "42" });
  });

  it("liest urlencoded/multipart Formulare", async () => {
    const body = new URLSearchParams({ name: "Anna", email: "a@b.ch" });
    const req = new Request("http://localhost/api/forms/contact", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    expect(await parseFormPayload(req)).toEqual({ name: "Anna", email: "a@b.ch" });
  });

  it("verwirft Prototype-Pollution-Schlüssel", async () => {
    const out = await parseFormPayload(
      jsonRequest({ __proto__: { admin: true }, constructor: "x", prototype: "y", ok: "1" }),
    );
    expect(out).toEqual({ ok: "1" });
    expect(({} as Record<string, unknown>).admin).toBeUndefined();
  });

  it("begrenzt die Feldanzahl auf 40", async () => {
    const many = Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [`f${i}`, "x"]),
    );
    const out = await parseFormPayload(jsonRequest(many));
    expect(Object.keys(out).length).toBeLessThanOrEqual(40);
  });

  it("kappt einzelne Werte bei 5000 Zeichen", async () => {
    const out = await parseFormPayload(jsonRequest({ text: "a".repeat(9000) }));
    expect(out.text.length).toBe(5000);
  });

  it("stoppt bei 20000 Zeichen Gesamtlänge", async () => {
    const payload = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`f${i}`, "a".repeat(5000)]),
    );
    const out = await parseFormPayload(jsonRequest(payload));
    const total = Object.values(out).join("").length;
    expect(total).toBeLessThanOrEqual(20000 + 5000);
    expect(Object.keys(out).length).toBeLessThan(20);
  });

  it("kappt überlange Schlüssel bei 64 Zeichen", async () => {
    const out = await parseFormPayload(jsonRequest({ ["k".repeat(200)]: "v" }));
    expect(Object.keys(out)[0].length).toBe(64);
  });
});

describe("isHoneypotTripped", () => {
  it("erkennt ausgefülltes Honeypot-Feld und entfernt es", () => {
    const payload = { name: "Bot", [HONEYPOT_FIELD]: "gefüllt" };
    expect(isHoneypotTripped(payload)).toBe(true);
    expect(payload[HONEYPOT_FIELD]).toBeUndefined();
  });

  it("lässt echte Einsendungen durch", () => {
    const payload = { name: "Anna", [HONEYPOT_FIELD]: "  " };
    expect(isHoneypotTripped(payload)).toBe(false);
    expect(payload.name).toBe("Anna");
  });
});

describe("payloadToText", () => {
  it("schreibt jedes Feld auf eine Zeile", () => {
    expect(payloadToText({ name: "Anna", email: "a@b.ch" })).toBe(
      "name: Anna\nemail: a@b.ch",
    );
  });
});
