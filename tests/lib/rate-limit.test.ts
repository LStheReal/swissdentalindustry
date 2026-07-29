// In-Memory-Sliding-Window vor den öffentlichen Formularen.

import { describe, it, expect, vi, afterEach } from "vitest";
import { clientIp, rateLimit } from "@/lib/rate-limit";

afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("lässt bis zum Limit durch und blockt danach", () => {
    const key = `t:${Math.random()}`;
    for (let i = 0; i < 5; i++) expect(rateLimit(key, 5, 60_000)).toBe(true);
    expect(rateLimit(key, 5, 60_000)).toBe(false);
  });

  it("zählt Schlüssel getrennt", () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    expect(rateLimit(a, 1, 60_000)).toBe(true);
    expect(rateLimit(a, 1, 60_000)).toBe(false);
    expect(rateLimit(b, 1, 60_000)).toBe(true);
  });

  it("gibt nach Ablauf des Fensters wieder frei", () => {
    vi.useFakeTimers();
    const key = `w:${Math.random()}`;
    expect(rateLimit(key, 1, 10_000)).toBe(true);
    expect(rateLimit(key, 1, 10_000)).toBe(false);
    vi.advanceTimersByTime(10_001);
    expect(rateLimit(key, 1, 10_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("nimmt die erste Adresse aus x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("fällt auf 'unknown' zurück", () => {
    expect(clientIp(new Request("http://localhost"))).toBe("unknown");
  });
});
