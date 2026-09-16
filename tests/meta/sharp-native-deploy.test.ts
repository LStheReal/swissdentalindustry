import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { prepareLogoUpload } from "../../src/lib/storage";

/**
 * 2026-09-16: Mitgliederliste, Mitglied bearbeiten, Sprachwechsel im Admin und
 * das öffentliche Antragsformular antworteten auf Vercel alle mit 500:
 *
 *   Could not load the "sharp" module using the linux-x64 runtime
 *   ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file
 *
 * Zwei Ursachen, beide hier festgehalten:
 *
 *  1. Im Baum lagen ZWEI sharp-Versionen — 0.35.3 (unsere) und 0.34.5 (die von
 *     Next.js). Das Datei-Tracing von Next nahm für 0.35 das native Addon mit,
 *     aber nicht die libvips-Bibliothek, die es zur Laufzeit nachlädt. Lokal
 *     fiel das nie auf, weil node_modules vollständig daliegt. Mit genau der
 *     Version, die Next.js selbst verwendet, gibt es nur eine Kopie, und die
 *     Bibliothek landet im Build.
 *
 *  2. sharp wurde statisch importiert. Damit riss der Ladefehler jede Seite mit,
 *     die storage.ts irgendwo im Modulgraph hat — auch Seiten, die nie ein Bild
 *     verarbeiten.
 */
const root = join(__dirname, "..", "..");
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8")) as {
  packages: Record<string, { version?: string }>;
};
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
};

describe("sharp: genau eine Kopie, passend zu Next.js", () => {
  it("es gibt im Lockfile nur ein sharp-Paket", () => {
    const copies = Object.keys(lock.packages).filter((k) => /(^|\/)node_modules\/sharp$/.test(k));
    expect(copies, `mehrere sharp-Kopien: ${copies.join(", ")}`).toEqual(["node_modules/sharp"]);
  });

  it("die Version erfüllt die Anforderung von Next.js", () => {
    const nextPkg = JSON.parse(
      readFileSync(join(root, "node_modules", "next", "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string>; optionalDependencies?: Record<string, string> };
    const wanted = nextPkg.optionalDependencies?.sharp ?? nextPkg.dependencies?.sharp;
    expect(wanted, "Next.js deklariert sharp nicht mehr — Test anpassen").toBeTruthy();

    const ours = lock.packages["node_modules/sharp"]?.version ?? "";
    // Next deklariert "^0.X.Y": gleiche Minor-Version wie Next, nicht darunter.
    const [, wMinor, wPatch] = wanted!.replace(/^[\^~]/, "").split(".").map(Number);
    const [oMajor, oMinor, oPatch] = ours.split(".").map(Number);
    expect(oMajor).toBe(0);
    expect(oMinor, `sharp ${ours} passt nicht zu Next (${wanted})`).toBe(wMinor);
    expect(oPatch).toBeGreaterThanOrEqual(wPatch);
  });

  it("ist exakt gepinnt, damit ein npm update nicht still auf eine neue Minor springt", () => {
    expect(pkg.dependencies.sharp).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("sharp wird nirgends statisch importiert", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(name)) files.push(p);
    }
  };
  walk(join(root, "src"));

  it("kein `import … from \"sharp\"` und kein `require(\"sharp\")`", () => {
    const offenders = files.filter((f) =>
      /^\s*import\s[^;]*from\s+["']sharp["']|require\(\s*["']sharp["']\s*\)/m.test(
        readFileSync(f, "utf8"),
      ),
    );
    expect(offenders.map((f) => f.replace(root + "/", ""))).toEqual([]);
  });
});

describe("Logo-Verarbeitung funktioniert mit der installierten sharp-Version", () => {
  const load = async () => (await import("sharp")).default;

  const asFile = (buf: Buffer, name: string, type: string) =>
    new File([new Uint8Array(buf)], name, { type });

  it("PNG mit Transparenz bleibt PNG", async () => {
    const sharp = await load();
    const png = await sharp({
      create: { width: 300, height: 120, channels: 4, background: { r: 225, g: 0, b: 15, alpha: 0.5 } },
    })
      .png()
      .toBuffer();
    const out = await prepareLogoUpload(asFile(png, "logo.png", "image/png"));
    expect(out.contentType).toBe("image/png");
    expect(out.buffer.subarray(0, 4).toString("hex")).toBe("89504e47");
  });

  it("JPEG wird zu WebP", async () => {
    const sharp = await load();
    const jpg = await sharp({
      create: { width: 900, height: 400, channels: 3, background: { r: 10, g: 10, b: 11 } },
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="400" height="100"><rect x="10" y="10" width="380" height="80" fill="white"/></svg>',
          ),
        },
      ])
      .jpeg()
      .toBuffer();
    const out = await prepareLogoUpload(asFile(jpg, "logo.jpg", "image/jpeg"));
    expect(out.contentType).toBe("image/webp");
    expect(out.buffer.subarray(0, 4).toString()).toBe("RIFF");
    expect(out.buffer.subarray(8, 12).toString()).toBe("WEBP");
  });

  it("SVG mit Script wird gerastert — das Script landet nicht im Bucket", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80">' +
        '<script>alert(document.cookie)</script>' +
        '<rect width="200" height="80" fill="#e1000f"/></svg>',
    );
    const out = await prepareLogoUpload(asFile(svg, "logo.svg", "image/svg+xml"));
    expect(["image/png", "image/webp"]).toContain(out.contentType);
    expect(out.buffer.toString("latin1")).not.toContain("script");
    expect(out.buffer.toString("latin1")).not.toContain("<svg");
  });

  it("Datei, die kein Bild ist, wird abgelehnt statt hochgeladen", async () => {
    const html = Buffer.from("<html><script>alert(1)</script></html>");
    await expect(prepareLogoUpload(asFile(html, "logo.png", "image/png"))).rejects.toThrow();
  });
});
