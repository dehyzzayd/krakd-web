import "server-only";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

/* Stripe boundary. Everything is lazy + gated on STRIPE_SECRET_KEY so the app runs
 * in free "beta mode" with no Stripe account (see billing.ts). When the key is set,
 * these helpers create real customers, Checkout sessions and portal sessions, and the
 * webhook (webhooks/stripe/route.ts) reconciles subscription state back into the DB. */

let _stripe: Stripe | null = null;

/** The Stripe client, or throw if not configured. Callers should gate on
 *  `stripeConfigured()` (billing.ts) before reaching this. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!_stripe) _stripe = new Stripe(key, { typescript: true });
  return _stripe;
}

/** A checkout/subscription target: the platform plan, or a paid integration id. */
export type BillingTarget = "platform" | (string & {});

/** Resolve a target to its Stripe Price id via env:
 *   platform          → STRIPE_PRICE_PLATFORM
 *   <integration id>  → STRIPE_PRICE_<ID>   (e.g. routeone → STRIPE_PRICE_ROUTEONE)
 *  Returns null when no price is configured for that target. */
export function priceIdForTarget(target: BillingTarget): string | null {
  const key = target === "platform" ? "STRIPE_PRICE_PLATFORM" : `STRIPE_PRICE_${target.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
  return process.env[key] || null;
}

/** Get (or lazily create) the dealership's Stripe customer id, persisted on its
 *  Subscription row. One customer per dealership covers the platform plan and every
 *  paid add-on. */
export async function ensureCustomer(dealershipId: string): Promise<string> {
  const stripe = getStripe();
  const dealer = await prisma.dealership.findUnique({
    where: { id: dealershipId },
    select: { name: true, email: true, subscription: { select: { stripeCustomerId: true } } },
  });
  if (!dealer) throw new Error("Dealership not found");
  const existing = dealer.subscription?.stripeCustomerId;
  if (existing) return existing;

  const customer = await stripe.customers.create({
    name: dealer.name,
    email: dealer.email ?? undefined,
    metadata: { dealershipId },
  });
  // The Subscription row always exists (created at register); keep the customer id there.
  await prisma.subscription.update({ where: { dealershipId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

/** Create a subscription-mode Checkout session for a target and return its URL.
 *  Carries { dealershipId, target } in both session and subscription metadata so the
 *  webhook can reconcile the right record. Throws if no price is mapped. */
export async function createSubscriptionCheckout(dealershipId: string, target: BillingTarget): Promise<string> {
  const priceId = priceIdForTarget(target);
  if (!priceId) throw new Error(`No Stripe price configured for "${target}".`);
  const stripe = getStripe();
  const customer = await ensureCustomer(dealershipId);
  const base = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const metadata = { dealershipId, target };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: dealershipId,
    metadata,
    subscription_data: { metadata },
    allow_promotion_codes: true,
    success_url: `${base}/dashboard/billing?checkout=success`,
    cancel_url: `${base}/dashboard/billing?checkout=cancelled`,
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL");
  return session.url;
}

/** Stripe subscription status → our platform SubscriptionStatus enum. */
export function toPlatformStatus(s: Stripe.Subscription.Status): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INACTIVE" {
  switch (s) {
    case "active": return "ACTIVE";
    case "trialing": return "TRIALING";
    case "past_due":
    case "unpaid": return "PAST_DUE";
    case "canceled":
    case "incomplete_expired": return "CANCELED";
    default: return "INACTIVE"; // incomplete, paused
  }
}

/** The current period end for a subscription. Stripe moved this onto the line item
 *  in recent API versions, so read the item first and fall back to the legacy field. */
export function periodEnd(sub: Stripe.Subscription): Date | null {
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  const unix = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  return unix ? new Date(unix * 1000) : null;
}

export function periodStart(sub: Stripe.Subscription): Date | null {
  const item = sub.items?.data?.[0] as unknown as { current_period_start?: number } | undefined;
  const unix = item?.current_period_start ?? (sub as unknown as { current_period_start?: number }).current_period_start;
  return unix ? new Date(unix * 1000) : null;
}
