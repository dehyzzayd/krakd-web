import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { twilioConfigured, provisionTrackingNumber, releaseTrackingNumber } from "@/lib/server/telephony";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/telephony → current call-tracking number + state */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const [ai, dealer] = await Promise.all([
    prisma.aiSettings.findUnique({ where: { dealershipId }, select: { aiPhone: true, forwardPhone: true } }),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { phone: true } }),
  ]);
  return json({
    configured: twilioConfigured(),          // whether Twilio keys are live in this environment
    number: ai?.aiPhone ?? null,             // the provisioned tracking number (E.164)
    forward: ai?.forwardPhone ?? null,       // where tracked calls ring through
    dealerPhone: dealer?.phone ?? null,      // fallback ring-to
  });
});

const postSchema = z.object({ areaCode: z.string().optional() });

/* POST /api/v1/telephony → provision a tracking number for this dealer */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const body = await req.json().catch(() => ({}));
  const { areaCode } = postSchema.parse(body ?? {});
  const result = await provisionTrackingNumber(dealershipId, areaCode);
  if (!result.ok) throw new HttpError(400, result.reason);
  return json({ number: result.number });
});

/* DELETE /api/v1/telephony → release the tracking number */
export const DELETE = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  await releaseTrackingNumber(dealershipId);
  return json({ ok: true });
});
