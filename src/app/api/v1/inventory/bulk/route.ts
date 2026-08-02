import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rowSchema = z.object({
  vin: z.string().optional(),
  stockNumber: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  category: z.string().optional(),
  bodyType: z.string().optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  priceCents: z.coerce.number().int().min(0).optional(),
  costCents: z.coerce.number().int().min(0).optional(),
  exteriorColor: z.string().optional(),
  status: z.enum(["AVAILABLE", "RECON", "RESERVED", "WHOLESALE", "SOLD"]).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

/* POST /api/v1/inventory/bulk → create many units at once (CSV import).
   Validates every row, imports the valid ones, reports the rest. */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const body = await req.json();
  const items = Array.isArray(body?.items) ? body.items : null;
  if (!items) throw new HttpError(400, "Expected an items array");
  if (items.length > 2000) throw new HttpError(400, "Import is capped at 2000 rows per file");

  const now = Date.now();
  const data: Prisma.VehicleCreateManyInput[] = [];
  const failed: { row: number; error: string }[] = [];

  items.forEach((raw: unknown, i: number) => {
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) { failed.push({ row: i + 1, error: parsed.error.issues[0].message }); return; }
    const d = parsed.data;
    if (!d.make || !d.model) { failed.push({ row: i + 1, error: "Make and model are required" }); return; }
    const status = d.status ?? "AVAILABLE";
    data.push({
      dealershipId,
      vin: d.vin ? d.vin.toUpperCase() : null,
      stockNumber: d.stockNumber?.trim() || `IMP-${now.toString(36).toUpperCase()}-${i}`,
      year: d.year ?? null, make: d.make, model: d.model, trim: d.trim ?? null,
      category: d.category ?? "CAR", bodyType: d.bodyType ?? null,
      mileage: d.mileage ?? 0, priceCents: d.priceCents ?? 0, costCents: d.costCents ?? 0,
      exteriorColor: d.exteriorColor ?? null, status,
      ...(d.attributes ? { attributes: d.attributes as Prisma.InputJsonValue } : {}),
      listedAt: status === "AVAILABLE" ? new Date() : null,
    });
  });

  if (data.length) await prisma.vehicle.createMany({ data });
  return json({ created: data.length, failed }, 201);
});
