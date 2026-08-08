import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { stripeConfigured } from "@/lib/server/billing";
import { getStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/billing/portal → Stripe Billing Portal session (update card, view
 * invoices, cancel/resume). Returns { url }. Requires an existing Stripe customer. */
export const POST = route(async (req: NextRequest) => {
  if (!stripeConfigured()) throw new HttpError(400, "Billing is not enabled yet.");
  const { dealershipId } = await requireAuth(req);

  const sub = await prisma.subscription.findUnique({ where: { dealershipId }, select: { stripeCustomerId: true } });
  if (!sub?.stripeCustomerId) throw new HttpError(400, "No billing account yet — subscribe first.");

  const stripe = getStripe();
  const base = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${base}/dashboard/billing`,
  });

  return json({ url: session.url });
});
