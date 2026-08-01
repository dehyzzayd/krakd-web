import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/server/admin";
import { CHANNEL_KEY } from "@/lib/server/campaigns";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/admin/campaigns → every campaign awaiting review, across all dealers */
export const GET = route(async (req: NextRequest) => {
  await requirePlatformAdmin(req);
  const rows = await prisma.campaign.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" },
    include: { dealership: { select: { name: true, brandColor: true, logoUrl: true, adConnections: true } } },
  });
  const items = rows.map((c) => {
    const conn = (c.dealership.adConnections ?? {}) as Record<string, boolean>;
    return {
      id: c.id, dealer: c.dealership.name, dealerLogo: c.dealership.logoUrl, brandColor: c.dealership.brandColor,
      name: c.name, channel: c.channel, format: c.format, objective: c.objective,
      budgetCents: c.budgetCents, netSpendCents: c.netSpendCents,
      primaryText: c.primaryText, headline: c.headline, description: c.description, cta: c.cta,
      creativeImageUrl: c.creativeImageUrl, creativeImages: (Array.isArray(c.creativeImages) ? c.creativeImages : []) as string[],
      connected: !!conn[CHANNEL_KEY[c.channel]], submittedAt: c.updatedAt,
    };
  });
  return json({ items, count: items.length });
});
