import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHANNELS = ["FACEBOOK", "INSTAGRAM", "GOOGLE"] as const;

type Row = { channel: string; status: string; budgetCents: number; spentCents: number; impressions: number; clicks: number; leadCount: number };
const agg = (list: Row[]) => list.reduce((a, c) => ({
  spendCents: a.spendCents + c.spentCents, budgetCents: a.budgetCents + c.budgetCents,
  impressions: a.impressions + c.impressions, clicks: a.clicks + c.clicks, leads: a.leads + c.leadCount,
  active: a.active + (c.status === "ACTIVE" ? 1 : 0), count: a.count + 1,
}), { spendCents: 0, budgetCents: 0, impressions: 0, clicks: 0, leads: 0, active: 0, count: 0 });

/* GET /api/v1/marketing/summary → real per-network + total performance, plus connection state */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const [dealer, campaigns] = await Promise.all([
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { adConnections: true } }),
    prisma.campaign.findMany({ where: { dealershipId }, orderBy: { createdAt: "desc" } }),
  ]);
  const conn = (dealer?.adConnections ?? {}) as Record<string, boolean>;
  const connections = { facebook: !!conn.facebook, instagram: !!conn.instagram, google: !!conn.google };
  const totals = agg(campaigns as Row[]);
  const networks = CHANNELS.map((ch) => ({ channel: ch, ...agg((campaigns as Row[]).filter((c) => c.channel === ch)) }));
  return json({ connections, totals, networks });
});
