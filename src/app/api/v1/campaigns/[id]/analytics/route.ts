import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { leadsByDay, deriveMetrics, funnel, insights, DEFAULT_AVG_GROSS_CENTS } from "@/lib/server/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/campaigns/[id]/analytics → real leads-per-day, derived metrics, matchback funnel, insights */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const c = await prisma.campaign.findFirst({ where: { id, dealershipId } });
  if (!c) throw new HttpError(404, "Campaign not found");

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [leadStatus, leadCount, recentLeads, acctLeads, acctSpendAgg, grossAgg] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], where: { dealershipId, campaignId: id }, _count: true }),
    prisma.lead.count({ where: { dealershipId, campaignId: id } }),
    prisma.lead.findMany({ where: { dealershipId, campaignId: id, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.lead.count({ where: { dealershipId, campaignId: { not: null } } }),
    prisma.campaign.aggregate({ where: { dealershipId }, _sum: { spentCents: true } }),
    prisma.vehicle.aggregate({ where: { dealershipId, status: "SOLD" }, _avg: { priceCents: true, costCents: true } }),
  ]);
  const countBy = (s: string) => leadStatus.filter((l) => l.status === s).reduce((n, l) => n + l._count, 0);
  const sold = countBy("SOLD");
  const appts = sold + countBy("APPOINTMENT");

  const acctSpend = acctSpendAgg._sum.spentCents ?? 0;
  const avgCplCents = acctLeads ? acctSpend / acctLeads : 0;
  const avgGrossCents = Math.max(0, Math.round((grossAgg._avg.priceCents ?? 0) - (grossAgg._avg.costCents ?? 0))) || DEFAULT_AVG_GROSS_CENTS;

  const metrics = deriveMetrics({ spendCents: c.spentCents, impressions: c.impressions, clicks: c.clicks, leads: leadCount, sold }, avgGrossCents);
  const series = leadsByDay(recentLeads.map((l) => l.createdAt), 30);
  const funnelStages = funnel({ spendCents: c.spentCents, impressions: c.impressions, clicks: c.clicks, leads: leadCount, appts, sold });
  const tips = insights({ id: c.id, status: c.status, startDate: c.startDate, leadCount, impressions: c.impressions, channel: c.channel }, metrics, { avgCplCents, sold });

  return json({ series, metrics, funnel: funnelStages, insights: tips, sold, appts, leadCount });
});
