import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { leadsByDay, deriveMetrics, funnel, DEFAULT_AVG_GROSS_CENTS } from "@/lib/server/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHANNELS = ["FACEBOOK", "INSTAGRAM", "GOOGLE"] as const;

type Row = { id: string; channel: string; status: string; startDate: Date | null; budgetCents: number; spentCents: number; impressions: number; clicks: number; leadCount: number };
const agg = (list: Row[]) => list.reduce((a, c) => ({
  spendCents: a.spendCents + c.spentCents, budgetCents: a.budgetCents + c.budgetCents,
  impressions: a.impressions + c.impressions, clicks: a.clicks + c.clicks, leads: a.leads + c.leadCount,
  active: a.active + (c.status === "ACTIVE" ? 1 : 0), count: a.count + 1,
}), { spendCents: 0, budgetCents: 0, impressions: 0, clicks: 0, leads: 0, active: 0, count: 0 });

/* GET /api/v1/marketing/summary → per-network + total performance from REAL attributed
   leads (Lead.campaignId), real leads-per-day, real sales matchback, and connection state. */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [dealer, campaigns, leadStatus, leadsByCampaign, recentLeads, grossAgg] = await Promise.all([
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { adConnections: true } }),
    prisma.campaign.findMany({ where: { dealershipId }, orderBy: { createdAt: "desc" } }),
    prisma.lead.groupBy({ by: ["status"], where: { dealershipId, campaignId: { not: null } }, _count: true }),
    prisma.lead.groupBy({ by: ["campaignId"], where: { dealershipId, campaignId: { not: null } }, _count: true }),
    prisma.lead.findMany({ where: { dealershipId, campaignId: { not: null }, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.vehicle.aggregate({ where: { dealershipId, status: "SOLD" }, _avg: { priceCents: true, costCents: true } }),
  ]);
  const conn = (dealer?.adConnections ?? {}) as Record<string, boolean>;
  const connections = { facebook: !!conn.facebook, instagram: !!conn.instagram, google: !!conn.google };

  // real attributed lead count per campaign (replaces the never-updated leadCount column)
  const leadMap = new Map<string, number>();
  for (const g of leadsByCampaign) if (g.campaignId) leadMap.set(g.campaignId, g._count);
  const rows: Row[] = (campaigns as Row[]).map((c) => ({ ...c, leadCount: leadMap.get(c.id) ?? 0 }));

  const totals = agg(rows);
  const networks = CHANNELS.map((ch) => ({ channel: ch, ...agg(rows.filter((c) => c.channel === ch)) }));

  const countBy = (s: string) => leadStatus.filter((l) => l.status === s).reduce((n, l) => n + l._count, 0);
  const sold = countBy("SOLD");
  const appts = sold + countBy("APPOINTMENT");

  // real average front gross from the dealer's own sold units
  const avgGrossCents = Math.max(0, Math.round((grossAgg._avg.priceCents ?? 0) - (grossAgg._avg.costCents ?? 0))) || DEFAULT_AVG_GROSS_CENTS;

  const metrics = deriveMetrics({ spendCents: totals.spendCents, impressions: totals.impressions, clicks: totals.clicks, leads: totals.leads, sold }, avgGrossCents);
  const funnelStages = funnel({ spendCents: totals.spendCents, impressions: totals.impressions, clicks: totals.clicks, leads: totals.leads, appts, sold });
  const daily = leadsByDay(recentLeads.map((l) => l.createdAt), 30);

  return json({ connections, totals, networks, metrics, sold, appts, funnel: funnelStages, daily, avgGrossCents });
});
