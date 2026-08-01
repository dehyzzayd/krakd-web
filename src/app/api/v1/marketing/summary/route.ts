import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { dailySeries, mergeSeries, deriveMetrics, funnel } from "@/lib/server/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHANNELS = ["FACEBOOK", "INSTAGRAM", "GOOGLE"] as const;

type Row = { id: string; channel: string; status: string; startDate: Date | null; budgetCents: number; spentCents: number; impressions: number; clicks: number; leadCount: number };
const agg = (list: Row[]) => list.reduce((a, c) => ({
  spendCents: a.spendCents + c.spentCents, budgetCents: a.budgetCents + c.budgetCents,
  impressions: a.impressions + c.impressions, clicks: a.clicks + c.clicks, leads: a.leads + c.leadCount,
  active: a.active + (c.status === "ACTIVE" ? 1 : 0), count: a.count + 1,
}), { spendCents: 0, budgetCents: 0, impressions: 0, clicks: 0, leads: 0, active: 0, count: 0 });

/* GET /api/v1/marketing/summary → live per-network + total performance, 30-day trend,
   real sales-matchback funnel (from attributed leads), and connection state. */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const [dealer, campaigns, leadStatus] = await Promise.all([
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { adConnections: true } }),
    prisma.campaign.findMany({ where: { dealershipId }, orderBy: { createdAt: "desc" } }),
    prisma.lead.groupBy({ by: ["status"], where: { dealershipId, campaignId: { not: null } }, _count: true }),
  ]);
  const conn = (dealer?.adConnections ?? {}) as Record<string, boolean>;
  const connections = { facebook: !!conn.facebook, instagram: !!conn.instagram, google: !!conn.google };

  const rows = campaigns as Row[];
  const totals = agg(rows);
  const networks = CHANNELS.map((ch) => ({ channel: ch, ...agg(rows.filter((c) => c.channel === ch)) }));

  const countBy = (s: string) => leadStatus.filter((l) => l.status === s).reduce((n, l) => n + l._count, 0);
  const sold = countBy("SOLD");
  const appts = sold + countBy("APPOINTMENT");

  const metrics = deriveMetrics({ spendCents: totals.spendCents, impressions: totals.impressions, clicks: totals.clicks, leads: totals.leads, sold });
  const funnelStages = funnel({ spendCents: totals.spendCents, impressions: totals.impressions, clicks: totals.clicks, leads: totals.leads, appts, sold });
  const daily = mergeSeries(rows.map((c) => dailySeries(c, 30)), 30);

  return json({ connections, totals, networks, metrics, sold, appts, funnel: funnelStages, daily });
});
