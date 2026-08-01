import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { dailySeries, deriveMetrics, funnel, insights } from "@/lib/server/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/campaigns/[id]/analytics → trend series, derived metrics, matchback funnel, insights */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const c = await prisma.campaign.findFirst({ where: { id, dealershipId } });
  if (!c) throw new HttpError(404, "Campaign not found");

  const [leadStatus, all] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], where: { dealershipId, campaignId: id }, _count: true }),
    prisma.campaign.findMany({ where: { dealershipId }, select: { spentCents: true, leadCount: true } }),
  ]);
  const countBy = (s: string) => leadStatus.filter((l) => l.status === s).reduce((n, l) => n + l._count, 0);
  const sold = countBy("SOLD");
  const appts = sold + countBy("APPOINTMENT");

  const acctSpend = all.reduce((s, x) => s + x.spentCents, 0);
  const acctLeads = all.reduce((s, x) => s + x.leadCount, 0);
  const avgCplCents = acctLeads ? acctSpend / acctLeads : 0;

  const metrics = deriveMetrics({ spendCents: c.spentCents, impressions: c.impressions, clicks: c.clicks, leads: c.leadCount, sold });
  const series = dailySeries(c, 30);
  const funnelStages = funnel({ spendCents: c.spentCents, impressions: c.impressions, clicks: c.clicks, leads: c.leadCount, appts, sold });
  const tips = insights(c, metrics, { avgCplCents, sold });

  return json({ series, metrics, funnel: funnelStages, insights: tips, sold, appts });
});
