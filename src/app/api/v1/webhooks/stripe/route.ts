import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/webhooks/stripe → Stripe event sink.
 *
 * Scaffold: acknowledges pings so Stripe's endpoint test passes. At launch, set
 * STRIPE_WEBHOOK_SECRET and wire signature verification (stripe.webhooks
 * constructEvent) here, then handle:
 *   - checkout.session.completed        → mark the Subscription / integration sub ACTIVE
 *   - customer.subscription.updated     → sync status + currentPeriodEnd + cancelAtPeriodEnd
 *   - customer.subscription.deleted     → mark CANCELED / expired
 *   - invoice.paid / invoice.payment_failed → advance period / mark PAST_DUE
 * The subscription state model (Subscription row + Dealership.integrations) is
 * already shaped for these; this handler is the only missing wiring. */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ received: false, message: "Stripe not configured" }, { status: 200 });

  // launch: const event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature")!, secret)
  void req;
  return Response.json({ received: true }, { status: 200 });
}
