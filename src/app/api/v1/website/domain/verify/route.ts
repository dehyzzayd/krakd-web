import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, requireAdmin } from "@/lib/server/website";
import { dnsRecords as simDnsRecords } from "@/lib/server/domain";
import { registrarConfigured, domainConfig } from "@/lib/server/registrar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/website/domain/verify → check DNS/SSL and advance the state.
 * Real mode: query Vercel — verified + configured → LIVE, else still PENDING_DNS
 * (or ACTION_REQUIRED if records are wrong). Falls back to a simulated state machine. */
export const POST = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  requireAdmin(principal);
  const { dealershipId } = principal;
  const w = await ensureWebsite(dealershipId);

  if (!w.domain) throw new HttpError(400, "Connect a domain first.");

  if (registrarConfigured()) {
    const cfg = await domainConfig(w.domain);
    const next = cfg.verified && !cfg.misconfigured ? "LIVE" : cfg.verified ? "ACTION_REQUIRED" : "PENDING_DNS";
    const updated = await prisma.website.update({ where: { dealershipId }, data: { domainStatus: next } });
    return json({ ...updated, dnsRecords: cfg.records });
  }

  // Simulated progression: PENDING_DNS → PROVISIONING → LIVE
  let next: "PENDING_DNS" | "PROVISIONING" | "LIVE" = w.domainStatus as never;
  if (w.domainStatus === "PENDING_DNS") next = "PROVISIONING";
  else if (w.domainStatus === "PROVISIONING") next = "LIVE";
  const updated = await prisma.website.update({ where: { dealershipId }, data: { domainStatus: next } });
  return json({ ...updated, dnsRecords: simDnsRecords(w.domain) });
});
