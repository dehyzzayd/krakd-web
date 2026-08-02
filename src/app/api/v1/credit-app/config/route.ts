import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureCreditConfig } from "@/lib/server/creditApp";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/credit-app/config → the dealer's form config + public token */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const c = await ensureCreditConfig(dealershipId);
  return json({ publicToken: c.publicToken, config: c.config, consentText: c.consentText, disclaimerText: c.disclaimerText });
});

const putSchema = z.object({
  config: z.object({
    fields: z.record(z.string(), z.object({ enabled: z.boolean(), required: z.boolean() })),
    coApplicant: z.boolean(),
  }),
  consentText: z.string().max(4000),
  disclaimerText: z.string().max(4000),
});

/* PUT /api/v1/credit-app/config → save the builder config */
export const PUT = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  await ensureCreditConfig(dealershipId);
  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const c = await prisma.creditAppConfig.update({
    where: { dealershipId },
    data: { config: parsed.data.config as unknown as Prisma.InputJsonValue, consentText: parsed.data.consentText, disclaimerText: parsed.data.disclaimerText },
  });
  return json({ publicToken: c.publicToken, config: c.config, consentText: c.consentText, disclaimerText: c.disclaimerText });
});
