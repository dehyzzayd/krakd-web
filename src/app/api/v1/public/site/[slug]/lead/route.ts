import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, route, HttpError } from "@/lib/server/http";
import { sendLeadNotification } from "@/lib/server/email";
import { deliverAdf } from "@/lib/server/adfDelivery";
import { aiFirstTouch } from "@/lib/server/ai";
import { pushLeadToIntegrations } from "@/lib/server/integrationDelivery";
import { webConsentRecord } from "@/lib/consent";
import { findDuplicateLead, scoreSpam, nextAssignee, contactKeys } from "@/lib/server/leadPipeline";
import { rateLimit, clientIp } from "@/lib/server/ratelimit";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const leadSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your name"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  message: z.string().max(1000).optional(),
  vehicleId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(), // attribution: ?kc= from the ad landing URL
  consent: z.boolean().optional(), // TCPA/CAN-SPAM express consent checkbox
  hp: z.string().optional(), // honeypot — real users never fill this
}).refine((d) => d.phone?.trim() || d.email?.trim(), { message: "Add a phone or email so we can reach you" });

/* POST /api/v1/public/site/[slug]/lead → website form → CRM lead (source = Website, retains vehicle) */
export const POST = route(async (_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const w = await prisma.website.findUnique({ where: { slug } });
  if (!w || w.status !== "PUBLISHED") throw new HttpError(404, "Site not found");
  const dealershipId = w.dealershipId;

  const rl = await rateLimit("lead", clientIp(_req), 8, 60);
  if (!rl.ok) throw new HttpError(429, "Too many submissions — please try again in a minute.");

  const parsed = leadSchema.safeParse(await _req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;
  if (d.hp?.trim()) return json({ ok: true }, 201); // honeypot tripped — silently drop
  const ip = (_req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
  const consent = d.consent ? { sms: webConsentRecord(ip), email: webConsentRecord(ip) } : {};

  // only attach a vehicle-of-interest that actually belongs to this dealer
  let vehicleId: string | undefined;
  let vehicleLabel = "";
  if (d.vehicleId) {
    const v = await prisma.vehicle.findFirst({ where: { id: d.vehicleId, dealershipId }, select: { id: true, year: true, make: true, model: true } });
    if (v) { vehicleId = v.id; vehicleLabel = `${v.year} ${v.make} ${v.model}`; }
  }

  // attribute to a campaign only if the id is real and belongs to this dealer
  let campaignId: string | undefined;
  if (d.campaignId) {
    const cmp = await prisma.campaign.findFirst({ where: { id: d.campaignId, dealershipId }, select: { id: true } });
    if (cmp) campaignId = cmp.id;
  }

  // ── DEDUP: a returning enquiry re-engages the existing lead instead of duplicating ──
  const dup = await findDuplicateLead(dealershipId, d.email, d.phone);
  if (dup) {
    await prisma.lead.update({ where: { id: dup.id, dealershipId }, data: { lastActivityAt: new Date(), ...(vehicleId ? { vehicleId } : {}) } });
    await prisma.leadActivity.create({ data: { dealershipId, leadId: dup.id, type: "NOTE", actorType: "SYSTEM", content: `Returning enquiry via Website${d.message?.trim() ? `: ${d.message.trim()}` : ""}` } }).catch(() => {});
    const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, users: { where: { role: "OWNER" }, select: { email: true }, take: 1 } } });
    const ownerEmail = dealer?.users[0]?.email;
    if (ownerEmail) void sendLeadNotification({ to: ownerEmail, dealershipName: dealer!.name, leadName: `${d.firstName} ${d.lastName ?? ""}`.trim(), source: "Website (returning)", vehicle: vehicleLabel, contact: d.phone ?? d.email ?? "", leadId: dup.id });
    return json({ ok: true }, 201);
  }

  // ── SPAM: score cheap signals; flagged leads are stored but kept out of the pipeline ──
  const spam = scoreSpam({ firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone, message: d.message });
  // ── AUTO-ASSIGN: round-robin / owner per the dealership's routing setting ──
  const assignedToId = spam.isSpam ? null : await nextAssignee(dealershipId);

  const lead = await prisma.lead.create({
    data: {
      dealershipId, vehicleId, campaignId,
      firstName: d.firstName,
      lastName: d.lastName,
      emails: (d.email ? [{ value: d.email, type: "personal" }] : []) as unknown as Prisma.InputJsonValue,
      phones: (d.phone ? [{ value: d.phone, type: "mobile" }] : []) as unknown as Prisma.InputJsonValue,
      ...contactKeys(d.email, d.phone),
      source: "Website",
      temperature: "WARM",
      isSpam: spam.isSpam,
      ...(assignedToId ? { assignedToId, ownerType: "HUMAN" as const } : { ownerType: "AI" as const }),
      consent: consent as unknown as Prisma.InputJsonValue,
    },
  });

  if (d.message?.trim()) {
    await prisma.leadActivity.create({ data: { dealershipId, leadId: lead.id, type: "NOTE", actorType: "SYSTEM", content: `Website enquiry: ${d.message.trim()}` } }).catch(() => {});
  }

  // spam is a dead-end: no notifications, no outbound, no CRM push
  if (spam.isSpam) {
    await prisma.leadActivity.create({ data: { dealershipId, leadId: lead.id, type: "NOTE", actorType: "SYSTEM", content: `Auto-flagged as spam (${spam.reasons.join(", ")})` } }).catch(() => {});
    return json({ ok: true }, 201);
  }

  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, users: { where: { role: "OWNER" }, select: { email: true }, take: 1 } } });
  const ownerEmail = dealer?.users[0]?.email;
  if (ownerEmail) void sendLeadNotification({ to: ownerEmail, dealershipName: dealer!.name, leadName: `${d.firstName} ${d.lastName ?? ""}`.trim(), source: "Website", vehicle: vehicleLabel, contact: d.phone ?? d.email ?? "", leadId: lead.id });
  void deliverAdf(lead.dealershipId, lead.id).catch(() => {});
  void pushLeadToIntegrations(lead.dealershipId, lead.id).catch(() => {});
  void aiFirstTouch(lead.dealershipId, lead.id).catch(() => {}); // Krakd AI opens the conversation

  return json({ ok: true }, 201);
});
