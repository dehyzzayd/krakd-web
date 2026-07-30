import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const days = (d: Date | null) => (d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000)) : 0);

// Accepts both automotive units (vin/year/make/model) and generic listings (title + attributes).
const createSchema = z.object({
  vin: z.string().optional(),
  stockNumber: z.string().optional(),
  year: z.coerce.number().int().min(1900).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  bodyType: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  mileage: z.coerce.number().int().min(0).default(0),
  priceCents: z.coerce.number().int().min(0).default(0),
  costCents: z.coerce.number().int().min(0).default(0),
  status: z.enum(["AVAILABLE", "RECON", "RESERVED", "WHOLESALE", "SOLD"]).default("RECON"),
  exteriorColor: z.string().optional(),
  photoUrls: z.array(z.string().max(1_500_000)).max(24).optional(),
});

/* POST /api/v1/inventory → add a listing to the current business */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;

  // Every listing needs an identity: automotive uses make+model, other verticals use a title.
  if (!d.title && !(d.make && d.model)) throw new HttpError(400, "A title (or make and model) is required.");
  const stockNumber = d.stockNumber?.trim() || `L-${Date.now().toString(36).toUpperCase()}`;

  const v = await prisma.vehicle.create({
    data: {
      dealershipId,
      vin: d.vin ? d.vin.toUpperCase() : null,
      stockNumber,
      year: d.year ?? null, make: d.make ?? null, model: d.model ?? null, trim: d.trim, bodyType: d.bodyType,
      title: d.title ?? null, subtitle: d.subtitle ?? null,
      ...(d.attributes ? { attributes: d.attributes as Prisma.InputJsonValue } : {}),
      mileage: d.mileage, priceCents: d.priceCents, costCents: d.costCents,
      status: d.status, exteriorColor: d.exteriorColor,
      ...(d.photoUrls ? { photoUrls: d.photoUrls as unknown as Prisma.InputJsonValue } : {}),
      listedAt: d.status === "AVAILABLE" ? new Date() : null,
    },
  });
  return json({ id: v.id }, 201);
});

/* GET /api/v1/inventory → { items, stats } for the current dealer */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);

  const [dealer, rows] = await Promise.all([
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { vertical: true } }),
    prisma.vehicle.findMany({ where: { dealershipId, status: { not: "SOLD" } }, orderBy: { createdAt: "desc" }, take: 300 }),
  ]);

  const items = rows.map((v) => {
    const photos = Array.isArray(v.photoUrls) ? (v.photoUrls as string[]) : [];
    return {
      id: v.id, year: v.year, make: v.make, model: v.model, trim: v.trim ?? "", body: v.bodyType ?? "",
      title: v.title, subtitle: v.subtitle, attributes: (v.attributes && typeof v.attributes === "object" ? v.attributes : {}) as Record<string, unknown>,
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
    vertical: dealer?.vertical ?? "AUTOMOTIVE",
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
