import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const days = (d: Date | null) => (d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000)) : 0);

/* GET /api/v1/inventory → { items, stats } for the current dealer */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);

  const rows = await prisma.vehicle.findMany({
    where: { dealershipId, status: { not: "SOLD" } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const items = rows.map((v) => {
    const photos = Array.isArray(v.photoUrls) ? (v.photoUrls as string[]) : [];
    return {
      id: v.id, year: v.year, make: v.make, model: v.model, trim: v.trim ?? "", body: v.bodyType ?? "",
      stock: v.stockNumber, vin: v.vin, price: Math.round(v.priceCents / 100), cost: Math.round(v.costCents / 100),
      mileage: v.mileage, status: v.status, color: v.exteriorColor ?? "", drivetrain: v.drivetrain ?? "", fuel: v.fuel ?? "",
      days: days(v.listedAt), image: photos[0] ?? null, photos: photos.length,
      marketAvg: v.marketAvgCents ? Math.round(v.marketAvgCents / 100) : null,
    };
  });

  const units = items.length || 1;
  const retailValue = items.reduce((s, v) => s + v.price, 0);
  const gross = items.reduce((s, v) => s + (v.price - v.cost), 0);
  const avgDays = Math.round(items.reduce((s, v) => s + v.days, 0) / units);
  const stale = items.filter((v) => v.days >= 45).length;

  return json({
    items,
    stats: {
      unitsLive: items.length,
      retailValue,
      avgFrontGross: Math.round(gross / units),
      avgDays: items.length ? avgDays : 0,
      agingPct: items.length ? Math.round((stale / units) * 100) : 0,
    },
  });
});
