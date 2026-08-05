import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/ai/settings → the dealer's AI config (defaults created on first read) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const s = await prisma.aiSettings.upsert({ where: { dealershipId }, create: { dealershipId }, update: {} });
  return json(s);
});

const patchSchema = z.object({
  persona: z.string().optional(),
  negotiation: z.enum(["FLEXIBLE", "MOSTLY_FIRM", "NO_NEGOTIATION"]).optional(),
  bookingMode: z.enum(["DISABLED", "INTERNAL", "EXTERNAL"]).optional(),
  tradeInEnabled: z.boolean().optional(),
  financeEnabled: z.boolean().optional(),
  afterHours: z.boolean().optional(),
  welcomeMessage: z.string().optional(),
  houseRules: z.string().optional(),
  inventoryUrl: z.string().optional(),
  creditAppUrl: z.string().optional(),
  appointmentUrl: z.string().optional(),
  testDriveUrl: z.string().optional(),
  aiPhone: z.string().optional(),
  forwardPhone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  channels: z.object({ website: z.boolean().optional(), fbmp: z.boolean().optional(), sms: z.boolean().optional(), email: z.boolean().optional() }).optional(),
});

export const PATCH = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const { languages, channels, ...rest } = parsed.data;
  const data = { ...rest, ...(languages ? { languages: languages as unknown as Prisma.InputJsonValue } : {}), ...(channels ? { channels: channels as unknown as Prisma.InputJsonValue } : {}) };
  const s = await prisma.aiSettings.upsert({ where: { dealershipId }, create: { dealershipId, ...data }, update: data });
  return json(s);
});
