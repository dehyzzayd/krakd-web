import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/server/admin";
import { CHANNEL_KEY, launchMetrics } from "@/lib/server/campaigns";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

/* POST /api/v1/admin/campaigns/[id] — approve (publish to the connected account) or reject */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requirePlatformAdmin(req);
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  const c = await prisma.campaign.findUnique({ where: { id }, include: { dealership: { select: { adConnections: true } } } });
  if (!c) throw new HttpError(404, "Campaign not found");
  if (c.status !== "PENDING_REVIEW") throw new HttpError(409, "Campaign is not awaiting review");

  if (parsed.data.action === "reject") {
    const updated = await prisma.campaign.update({ where: { id }, data: { status: "REJECTED" } });
    return json({ status: updated.status });
  }

  // approve → publish. Requires the dealer to have connected the network.
  const conn = (c.dealership.adConnections ?? {}) as Record<string, boolean>;
  if (!conn[CHANNEL_KEY[c.channel]]) throw new HttpError(400, `Dealer hasn't connected ${c.channel} yet — can't publish.`);

  const updated = await prisma.campaign.update({ where: { id }, data: { status: "ACTIVE", ...launchMetrics(c.budgetCents) } });
  return json({ status: updated.status });
});
