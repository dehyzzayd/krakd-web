import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { byId, type IntegrationsRecord } from "@/lib/integrations";
import { effectiveSub, isSubActive, startSub, cancelSub, reactivateSub, stripeConfigured, type IntegrationSub } from "@/lib/server/billing";
import { getStripe, priceIdForTarget, createSubscriptionCheckout } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string(), action: z.enum(["start", "cancel", "reactivate"]) });

/* PUT /api/v1/integrations/subscribe → paid-integration subscription lifecycle.
   Beta (no Stripe key): activates free, no charge. With Stripe configured AND a
   price mapped for this integration, `start` returns a Checkout { url } and the
   webhook does the activation; cancel/reactivate defer to Stripe when the sub is a
   real Stripe subscription. The state model is identical either way. */
export const PUT = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const def = byId(parsed.data.id);
  if (!def || def.priceCents == null) throw new HttpError(400, "Not a paid integration");

  const rec = ((await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { integrations: true } }))?.integrations ?? {}) as IntegrationsRecord;
  const cur = { ...(rec[def.id] ?? {}) };
  const sub = effectiveSub((cur.subscription as IntegrationSub | undefined) ?? null);

  // Real-money path: only when Stripe is on AND this integration has a mapped price.
  const priceId = stripeConfigured() ? priceIdForTarget(def.id) : null;

  if (parsed.data.action === "start") {
    if (isSubActive(sub)) return json({ subscription: sub }); // already active — no-op
    if (priceId) {
      return json({ url: await createSubscriptionCheckout(dealershipId, def.id) });
    }
    cur.subscription = startSub(def.priceCents); cur.enabled = true; // beta / unpriced → free
  } else if (parsed.data.action === "cancel") {
    if (!sub || sub.status === "expired") throw new HttpError(400, "No active subscription to cancel.");
    if (priceId && sub.stripeSubscriptionId) {
      await getStripe().subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
      return json({ subscription: cancelSub(sub) }); // webhook confirms; optimistic response
    }
    cur.subscription = cancelSub(sub);
  } else {
    // reactivate
    if (!sub) throw new HttpError(400, "Nothing to reactivate.");
    if (priceId && sub.stripeSubscriptionId && sub.status !== "expired") {
      await getStripe().subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: false });
      return json({ subscription: reactivateSub(sub) });
    }
    if (priceId && sub.status === "expired") {
      return json({ url: await createSubscriptionCheckout(dealershipId, def.id) });
    }
    cur.subscription = sub.status === "expired" ? startSub(def.priceCents) : reactivateSub(sub);
    cur.enabled = true;
  }

  const saved: IntegrationsRecord = { ...rec, [def.id]: cur };
  await prisma.dealership.update({ where: { id: dealershipId }, data: { integrations: saved as unknown as Prisma.InputJsonValue } });
  return json({ subscription: effectiveSub(cur.subscription as IntegrationSub) });
});
