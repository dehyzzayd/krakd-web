import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { stripeConfigured, effectiveSub, type IntegrationSub } from "@/lib/server/billing";
import { syncPlatformFromStripe } from "@/lib/server/stripe";
import { INTEGRATIONS, type IntegrationsRecord } from "@/lib/integrations";
import { PLANS, planByPriceCents } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/billing → platform plan + active paid-integration subscriptions */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);

  // Reconcile from Stripe first so the page reflects the live subscription immediately
  // after a checkout/switch — independent of webhook timing. Best-effort.
  if (stripeConfigured()) {
    try { await syncPlatformFromStripe(dealershipId); } catch (e) { console.error("Stripe sync failed:", e); }
  }

  const [sub, dealer] = await Promise.all([
    prisma.subscription.findUnique({ where: { dealershipId } }),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { integrations: true } }),
  ]);

  const rec = (dealer?.integrations ?? {}) as IntegrationsRecord;
  const addons = INTEGRATIONS.filter((i) => i.priceCents != null).map((i) => {
    const s = effectiveSub((rec[i.id]?.subscription as IntegrationSub | undefined) ?? null);
    return s && s.status !== "expired" ? { id: i.id, name: i.name, priceCents: s.priceCents, status: s.status, periodEnd: s.periodEnd, beta: s.beta } : null;
  }).filter(Boolean);

  // The dealer's tier, derived from the stored price (tiers have distinct prices).
  // Only meaningful once they actually hold a Stripe subscription.
  const currentPlan = sub?.stripeSubscriptionId ? (planByPriceCents(sub.priceCents)?.id ?? null) : null;

  return json({
    stripeConfigured: stripeConfigured(),
    plan: {
      name: planByPriceCents(sub?.priceCents ?? 14900)?.name ?? "Krakd Platform + AI",
      currentPlan,
      priceCents: sub?.priceCents ?? 14900,
      status: sub?.status ?? "INACTIVE",
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    },
    plans: PLANS,
    addons,
  });
});
