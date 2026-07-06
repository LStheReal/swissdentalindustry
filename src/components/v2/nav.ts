import { withLocalePath } from "@/lib/public-i18n";
import type { Locale } from "@/lib/types";

/**
 * Map a v1 public path (as stored in the shared copy, e.g. "/mitglieder",
 * "/#about") onto the /v2 preview tree, keeping locale prefixes intact.
 * External URLs and the admin portal stay untouched.
 */
export function v2Path(href: string, locale: Locale): string {
  if (/^(https?:|mailto:|tel:)/.test(href)) return href;
  if (href.startsWith("/admin")) return href;

  const [pathWithQuery, hash = ""] = href.split("#");
  const path = pathWithQuery || "/";
  const base = path === "/" ? "/v2" : `/v2${path}`;
  return withLocalePath(`${base}${hash ? `#${hash}` : ""}`, locale);
}
