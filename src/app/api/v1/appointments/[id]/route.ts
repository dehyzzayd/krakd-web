import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { AppointmentType, AppointmentStatus } from "@prisma/client";
import { wallClockToUtc, utcToWallClock } from "@/lib/server/slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/appointments/[id] → full appointment for editing, in the store's timezone */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const [a, dealer] = await Promise.all([
    prisma.appointment.findFirst({
      where: { id, dealershipId },
      select: { id: true, leadId: true, type: true, status: true, scheduledStart: true, scheduledEnd: true, location: true, notes: true, lead: { select: { firstName: true, lastName: true } } },
    }),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { timezone: true } }),
  ]);
  if (!a) throw new HttpError(404, "Appointment not found");
  const tz = dealer?.timezone || "America/Chicago";
  const s = utcToWallClock(a.scheduledStart, tz), e = utcToWallClock(a.scheduledEnd, tz);
  return json({ ...a, leadName: `${a.lead?.firstName ?? ""} ${a.lead?.lastName ?? ""}`.trim(), tz, date: s.date, startTime: s.time, endTime: e.time });
});

const patchSchema = z.object({
  type: z.nativeEnum(AppointmentType).optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  // wall-clock in the store's timezone (preferred), or explicit ISO instants
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

/* PATCH /api/v1/appointments/[id] → reschedule / update / cancel (tenant-scoped).
   Times are interpreted in the STORE's timezone. */
export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const [existing, dealer] = await Promise.all([
    prisma.appointment.findFirst({ where: { id, dealershipId } }),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { timezone: true } }),
  ]);
  if (!existing) throw new HttpError(404, "Appointment not found");
  const tz = dealer?.timezone || "America/Chicago";

  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.type) data.type = d.type;
  if (d.status) data.status = d.status;
  if (d.location !== undefined) data.location = d.location;
  if (d.notes !== undefined) data.notes = d.notes;
  const reschedule = (d.date && d.startTime) || d.scheduledStart;
  if (reschedule) {
    const start = d.date && d.startTime ? wallClockToUtc(d.date, d.startTime, tz) : new Date(d.scheduledStart!);
    const end = d.date && d.endTime ? wallClockToUtc(d.date, d.endTime, tz) : d.scheduledEnd ? new Date(d.scheduledEnd) : existing.scheduledEnd;
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) throw new HttpError(400, "Invalid start/end time");
    data.scheduledStart = start; data.scheduledEnd = end;
  }

  const appt = await prisma.$transaction(async (tx) => {
    const a = await tx.appointment.update({ where: { id, dealershipId }, data });
    if (existing.leadId && (reschedule || d.status)) {
      const verb = d.status === "CANCELED" ? "Appointment canceled" : "Appointment rescheduled";
      await tx.leadActivity.create({ data: { dealershipId, leadId: existing.leadId, type: "NOTE", actorType: "USER", content: `${verb} — ${a.type} on ${new Date(a.scheduledStart).toISOString()}` } });
    }
    return a;
  });
  return json({ id: appt.id });
});

/* DELETE /api/v1/appointments/[id] → remove an appointment (tenant-scoped) */
export const DELETE = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const existing = await prisma.appointment.findFirst({ where: { id, dealershipId }, select: { id: true } });
  if (!existing) throw new HttpError(404, "Appointment not found");
  await prisma.appointment.delete({ where: { id, dealershipId } });
  return json({ ok: true });
});
