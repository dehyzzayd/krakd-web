import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, route, HttpError } from "@/lib/server/http";
import { sendLeadNotification } from "@/lib/server/email";
import { deliverAdf } from "@/lib/server/adfDelivery";
import { pushLeadToIntegrations, deliverCreditAppToIntegrations } from "@/lib/server/integrationDelivery";
import { webConsentRecord } from "@/lib/consent";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadByToken(token: string) {
  const c = await prisma.creditAppConfig.findUnique({
    where: { publicToken: token },
    include: { dealership: { select: { id: true, name: true, brandColor: true, logoUrl: true, phone: true, email: true } } },
  });
  if (!c) throw new HttpError(404, "Application form not found");
  return c;
}

/* GET /api/v1/public/credit-app/[token] → the form config + branding for public render */
export const GET = route(async (_req: NextRequest, ctx: { params: Promise<{ token: string }> }) => {
  const { token } = await ctx.params;
  const c = await loadByToken(token);
  return json({
    config: c.config, consentText: c.consentText, disclaimerText: c.disclaimerText,
    business: { name: c.dealership.name, brandColor: c.dealership.brandColor, logoUrl: c.dealership.logoUrl, phone: c.dealership.phone },
  });
});

const submitSchema = z.object({
  applicant: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  coApplicant: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).nullable().optional(),
  consent: z.literal(true),
});

/* POST /api/v1/public/credit-app/[token] → submit an application (creates a lead) */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ token: string }> }) => {
  const { token } = await ctx.params;
  const c = await loadByToken(token);
  const parsed = submitSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "Please complete the required fields and consent.");
  const a = parsed.data.applicant as Record<string, string>;
  const firstName = String(a.firstName ?? "").trim();
  const lastName = String(a.lastName ?? "").trim();
  const phone = String(a.phone ?? "").trim();
  if (!firstName || !lastName || !phone) throw new HttpError(400, "Name and phone are required.");
  const email = String(a.email ?? "").trim();
  const dealershipId = c.dealership.id;
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;

  const app = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        dealershipId, firstName, lastName, source: "Credit Application",
        emails: (email ? [{ value: email, type: "personal" }] : []) as unknown as Prisma.InputJsonValue,
        phones: [{ value: phone, type: "mobile" }] as unknown as Prisma.InputJsonValue,
        financing: true, status: "NEW",
        consent: { sms: webConsentRecord(ip), email: webConsentRecord(ip) } as unknown as Prisma.InputJsonValue,
      },
    });
    const created = await tx.creditApplication.create({
      data: {
        dealershipId, leadId: lead.id,
        applicant: parsed.data.applicant as unknown as Prisma.InputJsonValue,
        coApplicant: parsed.data.coApplicant ? (parsed.data.coApplicant as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
    await tx.leadActivity.create({ data: { dealershipId, leadId: lead.id, type: "NOTE", actorType: "SYSTEM", content: "Submitted a credit application" } });
    return created;
  });

  const to = c.dealership.email;
  if (to) {
    sendLeadNotification({ to, dealershipName: c.dealership.name, leadName: `${firstName} ${lastName}`, source: "Credit Application", vehicle: "—", contact: phone, leadId: app.leadId ?? "" }).catch(() => {});
  }
  if (app.leadId) void deliverAdf(dealershipId, app.leadId).catch(() => {});
  if (app.leadId) void pushLeadToIntegrations(dealershipId, app.leadId).catch(() => {});
  void deliverCreditAppToIntegrations(dealershipId, app.id).catch(() => {});
  return json({ ok: true }, 201);
});
