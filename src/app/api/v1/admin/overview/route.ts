import { NextRequest } from "next/server";
import { requirePlatformAdmin } from "@/lib/server/admin";
import { allClients } from "@/lib/server/admin";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/admin/overview → portfolio KPIs, work queues, attention list */
export const GET = route(async (req: NextRequest) => {
  await requirePlatformAdmin(req);
  const clients = await allClients();

  const activeClients = clients.filter((c) => c.subscription.status === "ACTIVE").length;
  const mrrCents = clients.filter((c) => c.subscription.status === "ACTIVE").reduce((s, c) => s + c.subscription.priceCents, 0);
  const adBudgetCents = clients.reduce((s, c) => s + c.adBudgetCents, 0);
  const needsAttention = clients.filter((c) => c.attention.length > 0);

  const queues = {
    billing: clients.filter((c) => ["PAST_DUE", "CANCELED"].includes(c.subscription.status) || c.status === "SUSPENDED").length,
    inventory: clients.filter((c) => c.inventory.count === 0 || c.inventory.stale).length,
    domains: clients.filter((c) => ["PENDING_DNS", "ACTION_REQUIRED"].includes(c.website.domainStatus)).length,
    onboarding: clients.filter((c) => !c.website.live || c.inventory.count === 0).length,
  };

  return json({
    kpis: { activeClients, mrrCents, adBudgetCents, needsAttention: needsAttention.length, totalClients: clients.length },
    queues,
    attention: needsAttention.slice(0, 12).map((c) => ({ id: c.id, name: c.name, issue: c.attention[0], count: c.attention.length, health: c.health })),
  });
});
