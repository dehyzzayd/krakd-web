import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, requireAdmin } from "@/lib/server/website";
import { normalizeDomain, isValidDomain, quote } from "@/lib/server/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const purchaseSchema = z.object({
  domain: z.string().min(3),
  confirmPriceCents: z.number().int().positive(), // client must echo the shown price
});

/* POST /api/v1/website/domain/purchase → buy + connect a domain through Krakd. Admin only.
 * Domain registration is billed separately from the $149/mo subscription and the price
 * must match what was shown to the dealer. MVP simulates registration; renewal stored. */
export const POST = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  requireAdmin(principal);
  const { dealershipId } = principal;
  await ensureWebsite(dealershipId);

  const parsed = purchaseSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const domain = normalizeDomain(parsed.data.domain);
  if (!isValidDomain(domain)) throw new HttpError(400, "Enter a valid domain.");

  const q = quote(domain);
  if (!q.available) throw new HttpError(409, "That domain is no longer available.");
  if (q.priceCents !== parsed.data.confirmPriceCents) {
    throw new HttpError(409, "The price changed — review the new price before confirming.");
  }

  // record the billing event (separate from the subscription) + register the domain
  await prisma.payment.create({
    data: { dealershipId, type: "MANAGEMENT_FEE", status: "SUCCEEDED", amountCents: q.priceCents, description: `Domain registration: ${domain}` },
  });

  const renewsAt = new Date();
  renewsAt.setFullYear(renewsAt.getFullYear() + 1);

  // Krakd controls the registrar → skip manual DNS, go straight to SSL provisioning
  const w = await prisma.website.update({
    where: { dealershipId },
    data: { domain, domainProvider: "krakd", domainStatus: "PROVISIONING", domainPriceCents: q.priceCents, domainRenewsAt: renewsAt },
  });
  return json(w);
});
