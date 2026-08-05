import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, route, HttpError } from "@/lib/server/http";
import { sendLeadNotification } from "@/lib/server/email";
import { deliverAdf } from "@/lib/server/adfDelivery";
import { notifyAppointment } from "@/lib/server/appointmentNotify";
import { pushLeadToIntegrations } from "@/lib/server/integrationDelivery";
import { webConsentRecord } from "@/lib/consent";
import { contactKeys } from "@/lib/server/leadPipeline";
import { computeSlots, parseDuration, type Hour, type Busy } from "@/lib/server/slots";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUFFER_MIN = 15;
const MIN_NOTICE_MIN = 120;
const DEFAULT_DURATION: Record<string, number> = { MEDICAL: 45, REAL_ESTATE: 30, AUTOMOTIVE: 45, SERVICES: 45, RESTAURANT: 90, RETAIL: 20, GENERIC: 30 };

async function context(slug: string) {
  const w = await prisma.website.findUnique({ where: { slug }, select: { dealershipId: true, status: true, hours: true } });
  if (!w || w.status !== "PUBLISHED") throw new HttpError(404, "Site not found");
  const d = await prisma.dealership.findUnique({ where: { id: w.dealershipId }, select: { vertical: true, timezone: true, hours: true } });
  const hours = ((Array.isArray(d?.hours) && d.hours.length ? d.hours : w.hours) as Hour[] | undefined) ?? [];
  return { dealershipId: w.dealershipId, vertical: d?.vertical ?? "AUTOMOTIVE", tz: d?.timezone || "America/Chicago", hours };
}

async function durationFor(dealershipId: string, vertical: string, listingId?: string): Promise<number> {
  if (listingId) {
    const v = await prisma.vehicle.findFirst({ where: { id: listingId, dealershipId }, select: { attributes: true } });
    const attrs = (v?.attributes && typeof v.attributes === "object" ? v.attributes : {}) as Record<string, unknown>;
    const d = parseDuration(attrs.duration);
    if (d) return d;
  }
  return DEFAULT_DURATION[vertical] ?? 30;
}

async function busyFor(dealershipId: string, days: number): Promise<Busy[]> {
  const now = new Date();
  const rows = await prisma.appointment.findMany({
    where: { dealershipId, scheduledStart: { gte: new Date(now.getTime() - 86_400_000), lte: new Date(now.getTime() + (days + 1) * 86_400_000) }, status: { notIn: ["CANCELED"] } },
    select: { scheduledStart: true, scheduledEnd: true },
  }).catch(() => [] as { scheduledStart: Date; scheduledEnd: Date }[]);
  return rows.map((r) => ({ start: r.scheduledStart, end: r.scheduledEnd }));
}

/* GET → { slots: ISO[], businessTz, durationMin } for the next `days` */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const c = await context(slug);
  const days = Math.min(30, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 14));
  const listingId = req.nextUrl.searchParams.get("listing") || undefined;
  if (!c.hours.length) return json({ slots: [], businessTz: c.tz, durationMin: 30, noHours: true });

  const durationMin = await durationFor(c.dealershipId, c.vertical, listingId);
  const busy = await busyFor(c.dealershipId, days);
  const slots = computeSlots({ hours: c.hours, tz: c.tz, durationMin, bufferMin: BUFFER_MIN, minNoticeMin: MIN_NOTICE_MIN, days, busy });
  return json({ slots, businessTz: c.tz, durationMin, noHours: false });
});

const bookSchema = z.object({
  start: z.string().datetime(),
  firstName: z.string().trim().min(1, "Enter your name"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  note: z.string().max(1000).optional(),
  listingId: z.string().uuid().optional(),
  consent: z.boolean().optional(),
}).refine((d) => d.phone?.trim() || d.email?.trim(), { message: "Add a phone or email so we can confirm" });

/* POST → book a slot: creates a Lead + Appointment; returns a manage id */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const c = await context(slug);
  const parsed = bookSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;

  if (!d.consent) throw new HttpError(400, "Please agree to be contacted so we can confirm and remind you about your appointment.");
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;

  const start = new Date(d.start);
  if (isNaN(start.getTime()) || start.getTime() < Date.now()) throw new HttpError(400, "That time is no longer available.");
  const durationMin = await durationFor(c.dealershipId, c.vertical, d.listingId);
  const end = new Date(start.getTime() + durationMin * 60_000);

  // re-check the slot is free (with buffer) to avoid a double-book race
  const busy = await busyFor(c.dealershipId, 30);
  const clash = busy.some((b) => start.getTime() < b.end.getTime() + BUFFER_MIN * 60_000 && end.getTime() > b.start.getTime() - BUFFER_MIN * 60_000);
  if (clash) throw new HttpError(409, "Sorry — that slot was just taken. Please pick another.");

  let listingId: string | undefined;
  if (d.listingId) {
    const v = await prisma.vehicle.findFirst({ where: { id: d.listingId, dealershipId: c.dealershipId }, select: { id: true } });
    if (v) listingId = v.id;
  }

  const lead = await prisma.lead.create({
    data: {
      dealershipId: c.dealershipId, vehicleId: listingId,
      firstName: d.firstName, lastName: d.lastName,
      emails: (d.email ? [{ value: d.email, type: "personal" }] : []) as unknown as Prisma.InputJsonValue,
      phones: (d.phone ? [{ value: d.phone, type: "mobile" }] : []) as unknown as Prisma.InputJsonValue,
      ...contactKeys(d.email, d.phone),
      source: "Website booking", temperature: "HOT", ownerType: "AI",
      consent: { sms: webConsentRecord(ip), email: webConsentRecord(ip) } as unknown as Prisma.InputJsonValue,
    },
  });
  const appt = await prisma.appointment.create({
    data: { dealershipId: c.dealershipId, leadId: lead.id, vehicleId: listingId, type: "SERVICE", status: "SCHEDULED", scheduledStart: start, scheduledEnd: end, createdByAi: true, notes: d.note?.trim() ? `Website booking: ${d.note.trim()}` : "Booked online via website" },
  });

  const dealer = await prisma.dealership.findUnique({ where: { id: c.dealershipId }, select: { name: true, users: { where: { role: "OWNER" }, select: { email: true }, take: 1 } } });
  const label = start.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: c.tz });
  const ownerEmail = dealer?.users[0]?.email;
  if (ownerEmail) void sendLeadNotification({ to: ownerEmail, dealershipName: dealer!.name, leadName: `${d.firstName} ${d.lastName ?? ""}`.trim(), source: "Website booking", vehicle: label, contact: d.phone ?? d.email ?? "", leadId: lead.id });
  void deliverAdf(lead.dealershipId, lead.id).catch(() => {});
  void pushLeadToIntegrations(lead.dealershipId, lead.id).catch(() => {});
  // confirm the booking with the customer (best-effort)
  void notifyAppointment(appt.id, "confirmation").then((r) => {
    if (r.sms || r.email) return prisma.appointment.update({ where: { id: appt.id }, data: { confirmationSentAt: new Date() } });
  }).catch(() => {});

  return json({ ok: true, id: appt.id, start: start.toISOString(), durationMin }, 201);
});
