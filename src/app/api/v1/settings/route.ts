import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/settings → the global business profile for the current tenant */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const d = await prisma.dealership.findUnique({ where: { id: dealershipId } });
  if (!d) throw new HttpError(404, "Business not found");
  return json({
    name: d.name, vertical: d.vertical, phone: d.phone, email: d.email,
    addressLine1: d.addressLine1, addressLine2: d.addressLine2, city: d.city, state: d.state, postalCode: d.postalCode,
    timezone: d.timezone,
    hours: Array.isArray(d.hours) ? d.hours : [],
    brandColor: d.brandColor, logoUrl: d.logoUrl,
  });
});

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  vertical: z.enum(["AUTOMOTIVE", "REAL_ESTATE", "RESTAURANT", "SERVICES", "RETAIL", "GENERIC"]).optional(),
  phone: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  timezone: z.string().optional(),
  hours: z.array(z.object({ day: z.string(), open: z.string(), close: z.string() })).optional(),
  brandColor: z.string().optional(),
  logoUrl: z.string().max(1_500_000).optional(),
});

/* PATCH /api/v1/settings → update the business profile (global, vertical-agnostic) */
export const PATCH = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const { hours, ...rest } = parsed.data;
  await prisma.dealership.update({
    where: { id: dealershipId },
    data: { ...rest, ...(hours ? { hours: hours as unknown as Prisma.InputJsonValue } : {}) },
  });
  return json({ ok: true });
});
