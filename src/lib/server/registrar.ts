import "server-only";
import { normalizeDomain, quote as simQuote, isValidDomain } from "@/lib/server/domain";

/* Domain registrar + custom-domain wiring via the Vercel Domains + Project Domains APIs.
 * Gated on VERCEL_TOKEN + VERCEL_PROJECT_ID; when unset every function falls back to the
 * deterministic simulation in domain.ts so dev/beta keeps working. Buying a domain
 * registers it under the Vercel account and attaching it to the project provisions DNS
 * + SSL automatically. Customer prices carry a fixed markup that is never surfaced. */

const API = "https://api.vercel.com";
export const MARKUP_CENTS = 500; // added to the registrar cost; never shown to the customer

export const registrarConfigured = () => !!process.env.VERCEL_TOKEN && !!process.env.VERCEL_PROJECT_ID;

function teamQuery(extra = ""): string {
  const team = process.env.VERCEL_TEAM_ID;
  const q = new URLSearchParams(extra);
  if (team) q.set("teamId", team);
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function vercel<T = unknown>(path: string, init: RequestInit = {}, query = ""): Promise<T> {
  const res = await fetch(`${API}${path}${teamQuery(query)}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: { message?: string } })?.error?.message ?? `Vercel API ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export type DomainQuote = { domain: string; available: boolean; costCents: number; priceCents: number };

/** Availability + customer price (registrar cost + markup) for one candidate. */
export async function quoteDomain(input: string): Promise<DomainQuote> {
  const domain = normalizeDomain(input);
  if (!registrarConfigured()) {
    const q = simQuote(domain);
    return { domain, available: q.available, costCents: q.priceCents, priceCents: q.priceCents + MARKUP_CENTS };
  }
  const [status, price] = await Promise.all([
    vercel<{ available: boolean }>(`/v4/domains/status`, {}, `name=${encodeURIComponent(domain)}`).catch(() => ({ available: false })),
    vercel<{ price: number; period: number }>(`/v4/domains/price`, {}, `name=${encodeURIComponent(domain)}`).catch(() => null),
  ]);
  const costCents = price ? Math.round(price.price * 100) : 0;
  return { domain, available: !!status.available && costCents > 0, costCents, priceCents: costCents + MARKUP_CENTS };
}

/** Register a domain under the Vercel account. `costCents` is the registrar price
 *  (customer price minus markup); passed as expectedPrice in dollars. */
export async function registerDomain(domain: string, costCents: number): Promise<void> {
  await vercel(`/v4/domains/buy`, { method: "POST", body: JSON.stringify({ name: domain, expectedPrice: costCents / 100 }) });
}

/** Attach a domain to the Vercel project → provisions routing + SSL. Returns any DNS /
 *  verification records the dealer must set (empty for domains bought through us). */
export async function attachToProject(domain: string): Promise<{ verified: boolean; records: DnsRecord[] }> {
  const project = process.env.VERCEL_PROJECT_ID!;
  type AttachRes = { verified: boolean; verification?: { type: string; domain: string; value: string }[] };
  const res = await vercel<AttachRes>(
    `/v10/projects/${project}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) },
  ).catch((e: Error): AttachRes => { if (/already in use|exists/i.test(e.message)) return { verified: false }; throw e; });
  return { verified: !!res.verified, records: dnsRecordsFor(domain, res.verification) };
}

/** Whether the attached domain is verified and correctly configured. */
export async function domainConfig(domain: string): Promise<{ verified: boolean; misconfigured: boolean; records: DnsRecord[] }> {
  const project = process.env.VERCEL_PROJECT_ID!;
  const [proj, cfg] = await Promise.all([
    vercel<{ verified: boolean; verification?: { type: string; domain: string; value: string }[] }>(`/v9/projects/${project}/domains/${domain}`),
    vercel<{ misconfigured: boolean }>(`/v6/domains/${domain}/config`).catch(() => ({ misconfigured: true })),
  ]);
  return { verified: !!proj.verified, misconfigured: !!cfg.misconfigured, records: dnsRecordsFor(domain, proj.verification) };
}

export async function detachFromProject(domain: string): Promise<void> {
  const project = process.env.VERCEL_PROJECT_ID!;
  await vercel(`/v9/projects/${project}/domains/${domain}`, { method: "DELETE" }).catch(() => {});
}

export type DnsRecord = { type: string; host: string; value: string; note: string };

/** The DNS records a dealer sets at their own registrar to point a domain at us
 *  (Vercel's standard apex A + www CNAME), plus any ownership-verification TXT. */
export function dnsRecordsFor(domain: string, verification?: { type: string; domain: string; value: string }[]): DnsRecord[] {
  const records: DnsRecord[] = [
    { type: "A", host: "@", value: "76.76.21.21", note: "Points the root domain to Krakd" },
    { type: "CNAME", host: "www", value: "cname.vercel-dns.com", note: "Points www to Krakd" },
  ];
  for (const v of verification ?? []) {
    if (v.type?.toUpperCase() === "TXT") records.push({ type: "TXT", host: v.domain, value: v.value, note: "Proves you own this domain" });
  }
  return records;
}

export { normalizeDomain, isValidDomain };
