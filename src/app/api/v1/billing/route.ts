import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { stripeConfigured, effectiveSub, type IntegrationSub } from "@/lib/server/billing";
import { INTEGRATIONS, type IntegrationsRecord } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/billing → platform plan + active paid-integration subscriptions */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const [sub, dealer] = await Promise.all([
    prisma.subscription.findUnique({ where: { dealershipId } }),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { integrations: true } }),
  ]);

  const rec = (dealer?.integrations ?? {}) as IntegrationsRecord;
  const addons = INTEGRATIONS.filter((i) => i.priceCents != null).map((i) => {
    const s = effectiveSub((rec[i.id]?.subscription as IntegrationSub | undefined) ?? null);
    return s && s.status !== "expired" ? { id: i.id, name: i.name, priceCents: s.priceCents, status: s.status, periodEnd: s.periodEnd, beta: s.beta } : null;
  }).filter(Boolean);

  return json({
    stripeConfigured: stripeConfigured(),
    plan: {
      name: "Krakd Platform + AI",
      priceCents: sub?.priceCents ?? 14900,
      status: sub?.status ?? "INACTIVE",
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    },
    addons,
  });
});
