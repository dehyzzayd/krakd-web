/** The public URL of a dealer site. Default hosting is <slug>.krakd.io; a connected
 *  custom domain takes over once it's LIVE. Shared by the dashboard and public views. */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "krakd.io";

export function siteUrl(slug: string, opts?: { domain?: string | null; domainStatus?: string | null }): string {
  if (opts?.domain && opts.domainStatus === "LIVE") return `https://${opts.domain}`;
  return `https://${slug}.${ROOT_DOMAIN}`;
}

/** Display form without the scheme, e.g. "downtownauto.krakd.io". */
export function siteHost(slug: string, opts?: { domain?: string | null; domainStatus?: string | null }): string {
  return siteUrl(slug, opts).replace(/^https?:\/\//, "");
}
