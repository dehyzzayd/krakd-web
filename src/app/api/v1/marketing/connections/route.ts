import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/marketing/connections → { facebook, instagram, google } */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const d = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { adConnections: true } });
  const c = (d?.adConnections ?? {}) as Record<string, boolean>;
  return json({ facebook: !!c.facebook, instagram: !!c.instagram, google: !!c.google });
});

const schema = z.object({ network: z.enum(["facebook", "instagram", "google"]), connected: z.boolean() });

/* PATCH /api/v1/marketing/connections → connect / disconnect an ad account.
   (Simulated OAuth — flips the connection flag. Real Meta/Google OAuth swaps in here.) */
export const PATCH = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { adConnections: true } });
  const current = (d?.adConnections ?? {}) as Record<string, boolean>;
  const next = { ...current, [parsed.data.network]: parsed.data.connected };
  await prisma.dealership.update({ where: { id: dealershipId }, data: { adConnections: next as unknown as Prisma.InputJsonValue } });
  return json({ facebook: !!next.facebook, instagram: !!next.instagram, google: !!next.google });
});
