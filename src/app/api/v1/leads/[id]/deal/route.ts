import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/leads/[id]/deal → the lead's desking worksheet */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const lead = await prisma.lead.findFirst({ where: { id, dealershipId }, select: { deal: true, hasTradeIn: true, financing: true } });
  if (!lead) throw new HttpError(404, "Lead not found");
  return json({ deal: lead.deal ?? {}, hasTradeIn: lead.hasTradeIn, financing: lead.financing });
});

const dealSchema = z.object({
  sellPriceCents: z.number().int().min(0).optional(),
  tradeValueCents: z.number().int().min(0).optional(),
  tradePayoffCents: z.number().int().min(0).optional(),
  downCents: z.number().int().min(0).optional(),
  taxRatePct: z.number().min(0).max(20).optional(),
  termMonths: z.number().int().min(0).max(120).optional(),
  aprPct: z.number().min(0).max(35).optional(),
  trade: z.object({
    year: z.string().max(8).optional(),
    make: z.string().max(40).optional(),
    model: z.string().max(60).optional(),
    mileage: z.string().max(12).optional(),
  }).optional(),
});

/* PUT /api/v1/leads/[id]/deal → save the worksheet; flags trade-in/financing on the lead */
export const PUT = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const owned = await prisma.lead.findFirst({ where: { id, dealershipId }, select: { id: true } });
  if (!owned) throw new HttpError(404, "Lead not found");

  const parsed = dealSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const deal = parsed.data;

  const hasTradeIn = !!(deal.tradeValueCents || deal.trade?.make || deal.trade?.model);
  const financing = !!(deal.termMonths || deal.aprPct);

  await prisma.lead.update({
    where: { id, dealershipId },
    data: { deal: deal as unknown as Prisma.InputJsonValue, hasTradeIn, financing },
  });
  return json({ ok: true });
});
