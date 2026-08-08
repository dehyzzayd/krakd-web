import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { stripeConfigured } from "@/lib/server/billing";
import { createSubscriptionCheckout, priceIdForTarget, getStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ plan: z.enum(["starter", "growth"]) });

/* POST /api/v1/billing/checkout → subscribe to a platform plan, or switch plans.
 * If the dealer has no live Stripe subscription yet → returns { url } for Checkout.
 * If they already have one → switches the price in place (prorated) and returns
 * { updated: true }. Either way the webhook reconciles the final state. */
export const POST = route(async (req: NextRequest) => {
  if (!stripeConfigured()) throw new HttpError(400, "Billing is not enabled yet.");
  const { dealershipId } = await requireAuth(req);
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, "Choose a valid plan (starter or growth).");
  const plan = parsed.data.plan;

  const priceId = priceIdForTarget(plan);
  if (!priceId) throw new HttpError(500, `No Stripe price configured for "${plan}".`);

  const sub = await prisma.subscription.findUnique({ where: { dealershipId }, select: { stripeSubscriptionId: true, status: true } });
  const hasLiveSub = !!sub?.stripeSubscriptionId && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(sub.status);

  // Already subscribed → switch the plan in place (proration), no new Checkout.
  if (hasLiveSub && sub!.stripeSubscriptionId) {
    const stripe = getStripe();
    const current = await stripe.subscriptions.retrieve(sub!.stripeSubscriptionId);
    const itemId = current.items.data[0]?.id;
    if (current.items.data[0]?.price.id === priceId) return json({ updated: true, unchanged: true });
    await stripe.subscriptions.update(sub!.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: { dealershipId, target: plan },
    });
    return json({ updated: true });
  }

  // No live subscription → send them to Checkout.
  const url = await createSubscriptionCheckout(dealershipId, plan);
  return json({ url });
});
