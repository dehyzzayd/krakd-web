import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  role: z.enum(["MANAGER", "STAFF"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

/* PATCH /api/v1/team/[id] → change a teammate's role or enable/disable them (owner/manager only). */
export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId, role, userId } = await requireAuth(req);
  if (role !== "OWNER" && role !== "MANAGER") throw new HttpError(403, "Only owners and managers can manage the team.");
  const { id } = await ctx.params;

  const target = await prisma.user.findFirst({ where: { id, dealershipId }, select: { id: true, role: true } });
  if (!target) throw new HttpError(404, "Teammate not found.");
  if (target.role === "OWNER") throw new HttpError(400, "The owner account can't be changed here.");
  if (id === userId) throw new HttpError(400, "You can't change your own access.");

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  await prisma.user.update({ where: { id, dealershipId }, data: parsed.data });
  return json({ ok: true });
});
