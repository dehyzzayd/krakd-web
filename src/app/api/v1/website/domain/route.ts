import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, requireAdmin } from "@/lib/server/website";
import { normalizeDomain, isValidDomain, dnsRecords } from "@/lib/server/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const connectSchema = z.object({ domain: z.string().min(3) });

/* POST /api/v1/website/domain → connect a domain the dealer already owns. Admin only. */
export const POST = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  requireAdmin(principal);
  const { dealershipId } = principal;
  await ensureWebsite(dealershipId);

  const parsed = connectSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const domain = normalizeDomain(parsed.data.domain);
  if (!isValidDomain(domain)) throw new HttpError(400, "Enter a valid domain like downtownauto.com");

  const w = await prisma.website.update({
    where: { dealershipId },
    data: { domain, domainProvider: "existing", domainStatus: "PENDING_DNS", domainPriceCents: null, domainRenewsAt: null },
  });
  return json({ ...w, dnsRecords: dnsRecords(domain) });
});

/* DELETE /api/v1/website/domain → disconnect the current domain. Admin only. */
export const DELETE = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  requireAdmin(principal);
  const { dealershipId } = principal;
  await ensureWebsite(dealershipId);
  const w = await prisma.website.update({
    where: { dealershipId },
    data: { domain: null, domainProvider: null, domainStatus: "NOT_CONNECTED", domainPriceCents: null, domainRenewsAt: null },
  });
  return json(w);
});
