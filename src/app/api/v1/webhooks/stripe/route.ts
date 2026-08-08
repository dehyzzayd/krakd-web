import { NextRequest } from "next/server";
import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStripe, toPlatformStatus, periodStart, periodEnd } from "@/lib/server/stripe";
import type { IntegrationSub } from "@/lib/server/billing";
import type { IntegrationsRecord } from "@/lib/integrations";
import { isPlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/webhooks/stripe → Stripe event sink.
 *
 * Verifies the signature, then funnels every subscription-affecting event through
 * reconcileSubscription() so DB state always reflects Stripe. Handles:
 *   checkout.session.completed                       → activate on first payment
 *   customer.subscription.created/updated/deleted    → sync status/period/cancel
 *   invoice.paid / invoice.payment_failed            → advance period / mark PAST_DUE
 * Targets are carried in subscription metadata: "platform" or a paid integration id. */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ received: false, message: "Stripe not configured" }, { status: 200 });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return Response.json({ message: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch (e) {
    console.error("Stripe signature verification failed:", (e as Error).message);
    return Response.json({ message: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.kind === "domain") await handleDomainPurchase(session);
        else if (session.subscription) await reconcileById(session.subscription as string);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await reconcileSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (invoice.subscription) await reconcileById(invoice.subscription);
        break;
      }
      default:
        break; // ignore everything else
    }
  } catch (e) {
    console.error(`Stripe webhook handler error (${event.type}):`, e);
    return Response.json({ received: false }, { status: 500 }); // 5xx → Stripe retries
  }

  return Response.json({ received: true }, { status: 200 });
}

async function reconcileById(subscriptionId: string) {
  await reconcileSubscription(await getStripe().subscriptions.retrieve(subscriptionId));
}

/** A one-time domain purchase was paid → record it and mark the domain awaiting
 *  registration (Krakd fulfills it manually from the admin panel). */
async function handleDomainPurchase(session: Stripe.Checkout.Session) {
  const dealershipId = session.metadata?.dealershipId;
  const domain = session.metadata?.domain;
  if (!dealershipId || !domain) { console.warn("Domain session missing metadata", session.id); return; }
  const amountCents = session.amount_total ?? 0;

  await prisma.payment.create({
    data: { dealershipId, type: "DOMAIN", status: "SUCCEEDED", amountCents, stripePaymentIntentId: (session.payment_intent as string) ?? null, description: `Domain registration: ${domain}` },
  });
  await prisma.website.update({
    where: { dealershipId },
    data: { domain, domainProvider: "krakd", domainStatus: "PENDING_PURCHASE", domainPriceCents: amountCents },
  }).catch((e) => console.error("Domain website update failed:", e));
}

/** Apply a Stripe subscription's state to our DB, routed by metadata.target.
 *  A plan id (starter/growth) or legacy "platform" → the platform Subscription row;
 *  anything else → a paid integration. */
async function reconcileSubscription(sub: Stripe.Subscription) {
  const target = (sub.metadata?.target as string) || "platform";
  const dealershipId = (sub.metadata?.dealershipId as string) || null;
  if (target === "platform" || isPlanId(target)) await reconcilePlatform(sub, dealershipId);
  else await reconcileIntegration(sub, target, dealershipId);
}

async function reconcilePlatform(sub: Stripe.Subscription, dealershipId: string | null) {
  // Prefer metadata; fall back to matching by the stored subscription/customer id.
  const existing = dealershipId
    ? await prisma.subscription.findUnique({ where: { dealershipId } })
    : (await prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } }))
      ?? (await prisma.subscription.findFirst({ where: { stripeCustomerId: sub.customer as string } }));
  if (!existing) { console.warn("No Subscription row for Stripe sub", sub.id); return; }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: toPlatformStatus(sub.status),
      stripeSubscriptionId: sub.id,
      stripeCustomerId: sub.customer as string,
      currentPeriodStart: periodStart(sub),
      currentPeriodEnd: periodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      priceCents: sub.items.data[0]?.price.unit_amount ?? existing.priceCents,
    },
  });
}

async function reconcileIntegration(sub: Stripe.Subscription, target: string, dealershipId: string | null) {
  if (!dealershipId) { console.warn("Integration sub without dealershipId", sub.id); return; }
  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { integrations: true } });
  if (!dealer) return;

  const rec = (dealer.integrations ?? {}) as IntegrationsRecord;
  const cur = { ...(rec[target] ?? {}) };
  const canceled = sub.status === "canceled" || sub.status === "incomplete_expired";
  const mapped: IntegrationSub = {
    status: canceled ? "expired" : sub.cancel_at_period_end ? "scheduled_cancel" : "active",
    priceCents: sub.items.data[0]?.price.unit_amount ?? (cur.subscription as IntegrationSub | undefined)?.priceCents ?? 0,
    periodStart: (periodStart(sub) ?? new Date(0)).toISOString(),
    periodEnd: (periodEnd(sub) ?? new Date(0)).toISOString(),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    beta: false,
    stripeSubscriptionId: sub.id,
  };
  cur.subscription = mapped;
  if (!canceled) cur.enabled = true;

  const saved: IntegrationsRecord = { ...rec, [target]: cur };
  await prisma.dealership.update({ where: { id: dealershipId }, data: { integrations: saved as unknown as Prisma.InputJsonValue } });
}
