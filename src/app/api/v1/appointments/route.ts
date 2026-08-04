import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { AppointmentType, LeadStatus } from "@prisma/client";
import { vertical as verticalDef } from "@/components/site/verticals";
import { wallClockToUtc } from "@/lib/server/slots";
import { notifyAppointment } from "@/lib/server/appointmentNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { TEST_DRIVE: "Test drive", DELIVERY: "Delivery", PHONE: "Phone consultation", SERVICE: "Service", TRADE_APPRAISAL: "Trade appraisal" };
const STATUS_LABEL: Record<string, string> = { SCHEDULED: "Scheduled", CONFIRMED: "Confirmed", COMPLETED: "Completed", CANCELED: "Canceled", NO_SHOW: "No-show" };

const createSchema = z.object({
  leadId: z.string().uuid(),
  type: z.nativeEnum(AppointmentType),
  // wall-clock in the store's timezone (preferred), or explicit ISO instants
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

/* POST /api/v1/appointments → book an appointment (advances the lead).
   Times are interpreted in the STORE's timezone, not the dealer's browser. */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;

  const [lead, dealer] = await Promise.all([
    prisma.lead.findFirst({ where: { id: d.leadId, dealershipId }, select: { id: true } }),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { timezone: true } }),
  ]);
  if (!lead) throw new HttpError(404, "Lead not found");
  const tz = dealer?.timezone || "America/Chicago";
  const start = d.date && d.startTime ? wallClockToUtc(d.date, d.startTime, tz) : d.scheduledStart ? new Date(d.scheduledStart) : null;
  const end = d.date && d.endTime ? wallClockToUtc(d.date, d.endTime, tz) : d.scheduledEnd ? new Date(d.scheduledEnd) : null;
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) throw new HttpError(400, "Invalid start/end time");

  const appt = await prisma.$transaction(async (tx) => {
    const a = await tx.appointment.create({
      data: { dealershipId, leadId: d.leadId, type: d.type, scheduledStart: start, scheduledEnd: end, location: d.location, notes: d.notes },
    });
    await tx.lead.update({ where: { id: d.leadId }, data: { status: LeadStatus.APPOINTMENT, lastActivityAt: new Date() } });
    await tx.leadActivity.create({ data: { dealershipId, leadId: d.leadId, type: "APPOINTMENT_SET", actorType: "USER", content: `${d.type} on ${start.toISOString()}` } });
    return a;
  });
  // confirm with the customer now (best-effort; text needs Twilio, email needs Resend)
  void notifyAppointment(appt.id, "confirmation").then((r) => {
    if (r.sms || r.email) return prisma.appointment.update({ where: { id: appt.id }, data: { confirmationSentAt: new Date() } });
  }).catch(() => {});
  return json({ id: appt.id }, 201);
});

/* GET /api/v1/appointments → the current dealer's appointments (empty for new) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { vertical: true } });
  const apptMap = Object.fromEntries(verticalDef(dealer?.vertical).apptTypes.map((t) => [t.value, t.label]));
  const rows = await prisma.appointment.findMany({
    where: { dealershipId },
    orderBy: { scheduledStart: "asc" },
    take: 200,
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      vehicle: { select: { year: true, make: true, model: true, title: true } },
      assignedTo: { select: { firstName: true } },
    },
  });

  const items = rows.map((a) => ({
    id: a.id,
    leadId: a.leadId,
    name: a.lead ? `${a.lead.firstName} ${a.lead.lastName ?? ""}`.trim() : "—",
    vehicle: a.vehicle ? (a.vehicle.title || [a.vehicle.year, a.vehicle.make, a.vehicle.model].filter(Boolean).join(" ")) : "—",
    type: apptMap[a.type] ?? TYPE_LABEL[a.type] ?? a.type,
    typeKey: a.type,
    status: STATUS_LABEL[a.status] ?? a.status,
    statusKey: a.status.toLowerCase(),
    owner: a.createdByAi ? "Krakd AI" : a.assignedTo?.firstName ?? "—",
    start: a.scheduledStart.toISOString(),
    end: a.scheduledEnd.toISOString(),
    location: a.location ?? "",
  }));

  return json({ items });
});
