import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, requireAdmin } from "@/lib/server/website";
import { dnsRecords } from "@/lib/server/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/website/domain/verify → advance the DNS/SSL provisioning state machine.
 * MVP: PENDING_DNS → PROVISIONING → LIVE. Swap for a real DNS lookup + Vercel SSL check. */
export const POST = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  requireAdmin(principal);
  const { dealershipId } = principal;
  const w = await ensureWebsite(dealershipId);

  if (!w.domain) throw new HttpError(400, "Connect a domain first.");

  let next: "PENDING_DNS" | "PROVISIONING" | "LIVE" | "ACTION_REQUIRED" = w.domainStatus as never;
  if (w.domainStatus === "PENDING_DNS") next = "PROVISIONING"; // records found → provisioning SSL
  else if (w.domainStatus === "PROVISIONING") next = "LIVE"; // SSL issued → live
  else if (w.domainStatus === "ACTION_REQUIRED") next = "PENDING_DNS"; // retry

  const updated = await prisma.website.update({ where: { dealershipId }, data: { domainStatus: next } });
  return json({ ...updated, dnsRecords: dnsRecords(w.domain) });
});
