import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const days = (d: Date | null) => (d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000)) : 0);

async function load(dealershipId: string, id: string) {
  const v = await prisma.vehicle.findFirst({ where: { id, dealershipId } });
  if (!v) throw new HttpError(404, "Vehicle not found");
  const photos = Array.isArray(v.photoUrls) ? (v.photoUrls as string[]) : [];
  return {
    id: v.id, year: v.year, make: v.make, model: v.model, trim: v.trim ?? "", body: v.bodyType ?? "", category: v.category ?? "CAR",
    title: v.title, subtitle: v.subtitle, attributes: (v.attributes && typeof v.attributes === "object" ? v.attributes : {}) as Record<string, unknown>,
    stock: v.stockNumber, vin: v.vin, price: Math.round(v.priceCents / 100), cost: Math.round(v.costCents / 100),
    mileage: v.mileage, status: v.status, color: v.exteriorColor ?? "", drivetrain: v.drivetrain ?? "", fuel: v.fuel ?? "",
    engine: v.engine ?? "", transmission: v.transmission ?? "", interior: v.interiorColor ?? "",
    days: days(v.listedAt), photos, photoCount: photos.length, vdpViews: v.vdpViews,
    marketLow: v.marketLowCents ? Math.round(v.marketLowCents / 100) : null,
    marketAvg: v.marketAvgCents ? Math.round(v.marketAvgCents / 100) : null,
    marketHigh: v.marketHighCents ? Math.round(v.marketHighCents / 100) : null,
  };
}

export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  return json(await load(dealershipId, id));
});

const patchSchema = z.object({
  priceCents: z.coerce.number().int().min(0).optional(),
  costCents: z.coerce.number().int().min(0).optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  status: z.enum(["AVAILABLE", "RECON", "RESERVED", "WHOLESALE", "SOLD"]).optional(),
  exteriorColor: z.string().optional(),
  bodyType: z.string().optional(),
  category: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  photoUrls: z.array(z.string().max(1_500_000)).max(24).optional(),
});

export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const owned = await prisma.vehicle.findFirst({ where: { id, dealershipId }, select: { id: true } });
  if (!owned) throw new HttpError(404, "Vehicle not found");

  const { photoUrls, attributes, ...d } = parsed.data;
  await prisma.vehicle.update({
    where: { id },
    data: {
      ...d,
      ...(attributes ? { attributes: attributes as Prisma.InputJsonValue } : {}),
      ...(photoUrls ? { photoUrls: photoUrls as unknown as Prisma.InputJsonValue } : {}),
      ...(d.status === "AVAILABLE" ? { listedAt: new Date() } : {}),
      ...(d.status === "SOLD" ? { soldAt: new Date() } : {}),
    },
  });
  return json(await load(dealershipId, id));
});
