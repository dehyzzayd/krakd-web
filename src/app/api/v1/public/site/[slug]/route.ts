import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/public/site/[slug] → public website config + live inventory (published sites only) */
export const GET = route(async (_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const w = await prisma.website.findUnique({ where: { slug } });
  if (!w || w.status !== "PUBLISHED") throw new HttpError(404, "Site not found");

  const dealer = await prisma.dealership.findUnique({ where: { id: w.dealershipId }, select: { name: true } });
  const rows = await prisma.vehicle.findMany({
    where: { dealershipId: w.dealershipId, status: { in: ["AVAILABLE", "RESERVED"] } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const vehicles = rows.map((v) => {
    const photos = Array.isArray(v.photoUrls) ? (v.photoUrls as string[]) : [];
    return {
      id: v.id, year: v.year, make: v.make, model: v.model, trim: v.trim ?? "",
      price: Math.round(v.priceCents / 100), mileage: v.mileage, color: v.exteriorColor ?? "",
      drivetrain: v.drivetrain ?? "", fuel: v.fuel ?? "", image: photos[0] ?? null,
    };
  });

  return json({
    dealershipName: dealer?.name ?? "Dealership",
    template: w.template,
    logoUrl: w.logoUrl, primaryColor: w.primaryColor,
    headline: w.headline, intro: w.intro, ctaLabel: w.ctaLabel,
    phone: w.phone, email: w.email, address: w.address, city: w.city, state: w.state, zip: w.zip,
    hours: w.hours, socials: w.socials,
    vehicles,
  });
});
