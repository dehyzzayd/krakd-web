import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import type { ChannelConsent, ConsentRecord } from "@/lib/consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/leads/[id]/consent → current consent record for the badges/audit */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const lead = await prisma.lead.findFirst({ where: { id, dealershipId }, select: { consent: true } });
  if (!lead) throw new HttpError(404, "Lead not found");
  return json({ consent: (lead.consent ?? {}) as ConsentRecord });
});

const schema = z.object({
  channel: z.enum(["sms", "email", "both"]),
  status: z.enum(["granted", "revoked"]),
  method: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
});

/* PUT /api/v1/leads/[id]/consent → dealer records or revokes consent.
   This is an attestation: we log WHO (userId), WHEN, HOW (method) and from where,
   so the audit trail lands on the dealer, not on a bare checkbox. */
export const PUT = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId, userId } = await requireAuth(req);
  const { id } = await ctx.params;
  const lead = await prisma.lead.findFirst({ where: { id, dealershipId }, select: { consent: true } });
  if (!lead) throw new HttpError(404, "Lead not found");

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const { channel, status, method, note } = parsed.data;
  if (status === "granted" && !method) throw new HttpError(400, "Select how consent was obtained.");

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
  const record: ChannelConsent = {
    status, at: new Date().toISOString(), source: "dealer_attested",
    disclosure: status === "granted" ? `Dealer attested express consent — ${method}` : "Consent revoked by dealer",
    capturedBy: userId, ip, method, note,
  };

  const current = (lead.consent ?? {}) as ConsentRecord;
  const next: ConsentRecord = { ...current };
  if (channel === "both") { next.sms = record; next.email = record; }
  else next[channel] = record;

  await prisma.lead.update({ where: { id, dealershipId }, data: { consent: next as unknown as Prisma.InputJsonValue } });
  return json({ consent: next });
});
