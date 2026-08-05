import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Routing = { autoAssign?: boolean; mode?: "round_robin" | "owner"; cursor?: number };

/* GET /api/v1/leads/routing → inbound auto-assign settings */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const d = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { leadRouting: true } });
  const c = (d?.leadRouting ?? {}) as Routing;
  return json({ autoAssign: !!c.autoAssign, mode: c.mode ?? "round_robin" });
});

const schema = z.object({ autoAssign: z.boolean(), mode: z.enum(["round_robin", "owner"]).optional() });

/* PUT /api/v1/leads/routing → save auto-assign settings (owner/manager only) */
export const PUT = route(async (req: NextRequest) => {
  const { dealershipId, role } = await requireAuth(req);
  if (role !== "OWNER" && role !== "MANAGER") throw new HttpError(403, "Only owners and managers can change lead routing.");
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { leadRouting: true } });
  const cur = (d?.leadRouting ?? {}) as Routing;
  const next: Routing = { ...cur, autoAssign: parsed.data.autoAssign, mode: parsed.data.mode ?? cur.mode ?? "round_robin" };
  await prisma.dealership.update({ where: { id: dealershipId }, data: { leadRouting: next as unknown as Prisma.InputJsonValue } });
  return json({ autoAssign: next.autoAssign, mode: next.mode });
});
