/**
 * Domain registrar + DNS/SSL provisioning.
 *
 * MVP note: the brief lists the registrar integration, price markup and renewal
 * policy as OPEN DECISIONS. This module simulates a registrar with deterministic
 * pricing and a state machine so the full guided flow works end-to-end. Swap the
 * body of `quote()` / `provision()` for a real registrar (Namecheap, Vercel
 * Domains, etc.) + Vercel custom-domain API without touching callers.
 */

const TLD_PRICE_CENTS: Record<string, number> = {
  com: 1499, net: 1799, org: 1699, co: 2999, io: 3999, dealer: 2499, auto: 74999, cars: 89999,
};

export function tldOf(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "com";
}

export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

export function isValidDomain(domain: string): boolean {
  return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(domain);
}

/** Deterministic availability + price for a candidate domain. */
export function quote(domain: string): { domain: string; available: boolean; priceCents: number; tld: string } {
  const tld = tldOf(domain);
  const price = TLD_PRICE_CENTS[tld] ?? 1999;
  // deterministic "taken" set so the demo shows both states without randomness
  const taken = ["google.com", "facebook.com", "toyota.com", "ford.com", "test.com"];
  const available = !taken.includes(domain);
  return { domain, available, priceCents: price, tld };
}

/** The DNS records a dealer must add to point an existing domain at Krakd. */
export function dnsRecords(domain: string) {
  return [
    { type: "A", host: "@", value: "76.76.21.21", note: "Points the root domain to Krakd" },
    { type: "CNAME", host: "www", value: "cname.krakd-sites.com", note: "Points www to Krakd" },
    { type: "TXT", host: `_krakd.${domain.split(".")[0]}`, value: "krakd-domain-verification", note: "Proves ownership" },
  ];
}
