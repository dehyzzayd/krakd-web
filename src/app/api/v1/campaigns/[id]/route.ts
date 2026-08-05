import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/campaigns/[id] */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({ where: { id, dealershipId } });
  if (!campaign) throw new HttpError(404, "Campaign not found");
  return json(campaign);
});

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "ENDED"]).optional(),
  primaryText: z.string().max(2000).optional(),
  headline: z.string().max(255).optional(),
  description: z.string().max(255).optional(),
  cta: z.string().max(40).optional(),
  spentCents: z.number().int().min(0).max(1_000_000_00).optional(), // dealer-recorded actual spend
});

/* PATCH /api/v1/campaigns/[id] — rename, edit creative, submit for review, pause/resume, end.
   Submitting sends the campaign to Krakd's review queue; a platform admin approves it. */
export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const existing = await prisma.campaign.findFirst({ where: { id, dealershipId } });
  if (!existing) throw new HttpError(404, "Campaign not found");
  const campaign = await prisma.campaign.update({ where: { id, dealershipId }, data: parsed.data });
  return json(campaign);
});
