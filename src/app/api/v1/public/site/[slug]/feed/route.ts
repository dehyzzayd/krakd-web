import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { buildInventoryFeed, type FeedVehicle } from "@/lib/server/syndication";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/public/site/[slug]/feed?format=meta|csv → public inventory feed a
   marketplace (Facebook/Google/AutoTrader) pulls on a schedule. Live units only. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const format = req.nextUrl.searchParams.get("format") === "meta" ? "meta" : "csv";

  const w = await prisma.website.findUnique({ where: { slug }, select: { dealershipId: true, status: true } });
  if (!w || w.status !== "PUBLISHED") return new Response("Not found", { status: 404 });

  const [dealer, vehicles] = await Promise.all([
    prisma.dealership.findUnique({ where: { id: w.dealershipId }, select: { name: true, phone: true, addressLine1: true, city: true, state: true, postalCode: true } }),
    prisma.vehicle.findMany({ where: { dealershipId: w.dealershipId, status: "AVAILABLE" }, orderBy: { listedAt: "desc" }, take: 2000 }),
  ]);
  if (!dealer) return new Response("Not found", { status: 404 });

  const items: FeedVehicle[] = vehicles.map((v) => ({
    id: v.id, vin: v.vin, stock: v.stockNumber,
    year: v.year, make: v.make, model: v.model, trim: v.trim,
    mileage: v.mileage, priceCents: v.priceCents, exteriorColor: v.exteriorColor, bodyType: v.bodyType,
    photoUrls: Array.isArray(v.photoUrls) ? (v.photoUrls as string[]) : [],
  }));

  const baseUrl = process.env.APP_BASE_URL || req.nextUrl.origin;
  const body = buildInventoryFeed(dealer, items, { baseUrl, slug, format });

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `inline; filename="${slug}-inventory-${format}.csv"`,
      "cache-control": "public, max-age=1800", // marketplaces re-pull; 30-min freshness
    },
  });
}
