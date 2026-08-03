import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdfConfig = { enabled?: boolean; emails?: string[] };
const load = async (dealershipId: string) => ((await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { adfConfig: true } }))?.adfConfig ?? {}) as AdfConfig;

/* GET /api/v1/leads/adf-delivery → ADF email-delivery config */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const c = await load(dealershipId);
  return json({ enabled: !!c.enabled, emails: c.emails ?? [] });
});

const schema = z.object({
  enabled: z.boolean(),
  emails: z.array(z.string().email("Enter valid email addresses")).max(10),
});

/* PUT /api/v1/leads/adf-delivery → save ADF delivery config */
export const PUT = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  if (parsed.data.enabled && parsed.data.emails.length === 0) throw new HttpError(400, "Add at least one delivery email.");
  await prisma.dealership.update({ where: { id: dealershipId }, data: { adfConfig: parsed.data as unknown as Prisma.InputJsonValue } });
  return json({ enabled: parsed.data.enabled, emails: parsed.data.emails });
});
