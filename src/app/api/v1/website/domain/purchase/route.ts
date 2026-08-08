import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, requireAdmin } from "@/lib/server/website";
import { stripeConfigured } from "@/lib/server/billing";
import { getStripe, ensureCustomer } from "@/lib/server/stripe";
import { normalizeDomain, isValidDomain } from "@/lib/server/domain";
import { quoteDomain } from "@/lib/server/registrar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const purchaseSchema = z.object({
  domain: z.string().min(3),
  confirmPriceCents: z.number().int().positive(), // client echoes the price it was shown
});

/* POST /api/v1/website/domain/purchase → start a one-time Stripe payment to buy a
 * domain through Krakd. Billed separately from the subscription. On payment the domain
 * moves to PENDING_PURCHASE and Krakd registers it (manual fulfillment); the webhook
 * writes the record. Returns { url } for Stripe Checkout — or, with no Stripe (dev),
 * marks it pending immediately so the flow is testable. */
export const POST = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  requireAdmin(principal);
  const { dealershipId } = principal;
  await ensureWebsite(dealershipId);

  const parsed = purchaseSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const domain = normalizeDomain(parsed.data.domain);
  if (!isValidDomain(domain)) throw new HttpError(400, "Enter a valid domain.");

  const q = await quoteDomain(domain);
  if (!q.available) throw new HttpError(409, "That domain is no longer available.");
  if (q.priceCents !== parsed.data.confirmPriceCents) {
    throw new HttpError(409, "The price changed — review the new price before confirming.");
  }

  // Dev / beta (no Stripe): simulate a paid purchase so the admin fulfillment flow works.
  if (!stripeConfigured()) {
    await prisma.payment.create({ data: { dealershipId, type: "DOMAIN", status: "SUCCEEDED", amountCents: q.priceCents, description: `Domain registration: ${domain}` } });
    const w = await prisma.website.update({ where: { dealershipId }, data: { domain, domainProvider: "krakd", domainStatus: "PENDING_PURCHASE", domainPriceCents: q.priceCents } });
    return json({ pending: true, website: w });
  }

  const stripe = getStripe();
  const customer = await ensureCustomer(dealershipId);
  const base = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: q.priceCents, product_data: { name: `Domain registration — ${domain}`, description: "One year, auto-renewing" } } }],
    metadata: { kind: "domain", dealershipId, domain },
    payment_intent_data: { metadata: { kind: "domain", dealershipId, domain } },
    success_url: `${base}/dashboard/website?tab=domain&domain=purchased`,
    cancel_url: `${base}/dashboard/website?tab=domain&domain=cancelled`,
  });
  return json({ url: session.url });
});
