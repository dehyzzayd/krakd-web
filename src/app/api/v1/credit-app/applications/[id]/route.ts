import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/credit-app/applications/[id] → full application for review / PDF */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const r = await prisma.creditApplication.findFirst({ where: { id, dealershipId } });
  if (!r) throw new HttpError(404, "Application not found");
  return json({ id: r.id, status: r.status, createdAt: r.createdAt.toISOString(), applicant: r.applicant, coApplicant: r.coApplicant });
});

const patchSchema = z.object({ status: z.enum(["NEW", "REVIEWING", "APPROVED", "DECLINED"]) });

/* PATCH /api/v1/credit-app/applications/[id] → update decision status */
export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const owned = await prisma.creditApplication.findFirst({ where: { id, dealershipId }, select: { id: true } });
  if (!owned) throw new HttpError(404, "Application not found");
  const r = await prisma.creditApplication.update({ where: { id }, data: { status: parsed.data.status } });
  return json({ status: r.status });
});
