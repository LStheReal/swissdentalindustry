import { describe, it, expect } from "vitest";
import {
  renderWelcomeMail,
  renderApplicationApprovedMail,
  renderApplicationRejectedMail,
  renderChangeApprovedMail,
  renderAdminInviteMail,
} from "@/lib/email-templates";
import { LOCALES } from "@/lib/types";

/**
 * In der Zusage-Mail ging ein <strong> durch den escapenden Absatz-Helfer, und
 * der Empfänger las das Tag wörtlich im Fliesstext. Diese Tests decken beide
 * Richtungen ab: kein sichtbares Markup, aber Namen aus Nutzereingaben bleiben
 * escaped.
 */

const ARGS = {
  memberName: "Dentaltechnik Muster AG",
  editUrl: "https://example.ch/edit/token",
};

const renderers = LOCALES.flatMap((locale) => [
  { name: `welcome/${locale}`, html: renderWelcomeMail({ ...ARGS, locale }).html },
  {
    name: `approved/${locale}`,
    html: renderApplicationApprovedMail({ ...ARGS, locale }).html,
  },
  {
    name: `rejected/${locale}`,
    html: renderApplicationRejectedMail({
      memberName: ARGS.memberName,
      reason: "Beispielbegründung",
      locale,
    }).html,
  },
  {
    name: `changeApproved/${locale}`,
    html: renderChangeApprovedMail({
      ...ARGS,
      changes: [{ label: "Telefon", value: "+41 31 123 45 67" }],
      locale,
    }).html,
  },
]);

describe("Mail-Templates zeigen kein rohes Markup im Text", () => {
  for (const { name, html } of renderers) {
    it(`${name} enthält keine escapten Tags`, () => {
      expect(html).not.toContain("&lt;strong");
      expect(html).not.toContain("&lt;p");
      expect(html).not.toContain("&lt;br");
      expect(html).not.toContain("&lt;a ");
    });
  }

  it("die Admin-Einladung ebenfalls nicht", () => {
    const { html } = renderAdminInviteMail({
      email: "neu@example.ch",
      inviteUrl: "https://example.ch/invite/token",
    });
    expect(html).not.toContain("&lt;strong");
  });
});

describe("Nutzereingaben bleiben escaped", () => {
  it("escapet spitze Klammern im Firmennamen", () => {
    const { html } = renderApplicationApprovedMail({
      memberName: '<script>alert("x")</script>',
      editUrl: ARGS.editUrl,
      locale: "de",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapet auch in der Absage-Begründung", () => {
    const { html } = renderApplicationRejectedMail({
      memberName: "Muster AG",
      reason: "<img src=x onerror=alert(1)>",
      locale: "de",
    });
    expect(html).not.toContain("<img src=x");
  });
});
