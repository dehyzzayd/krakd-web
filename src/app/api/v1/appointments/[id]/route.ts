import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { AppointmentType, AppointmentStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/appointments/[id] → full appointment for editing */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const a = await prisma.appointment.findFirst({
    where: { id, dealershipId },
    select: { id: true, leadId: true, type: true, status: true, scheduledStart: true, scheduledEnd: true, location: true, notes: true, lead: { select: { firstName: true, lastName: true } } },
  });
  if (!a) throw new HttpError(404, "Appointment not found");
  return json({ ...a, leadName: `${a.lead?.firstName ?? ""} ${a.lead?.lastName ?? ""}`.trim() });
});

const patchSchema = z.object({
  type: z.nativeEnum(AppointmentType).optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

/* PATCH /api/v1/appointments/[id] → reschedule / update / cancel (tenant-scoped) */
export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const existing = await prisma.appointment.findFirst({ where: { id, dealershipId } });
  if (!existing) throw new HttpError(404, "Appointment not found");

  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.type) data.type = d.type;
  if (d.status) data.status = d.status;
  if (d.location !== undefined) data.location = d.location;
  if (d.notes !== undefined) data.notes = d.notes;
  if (d.scheduledStart || d.scheduledEnd) {
    const start = new Date(d.scheduledStart ?? existing.scheduledStart);
    const end = new Date(d.scheduledEnd ?? existing.scheduledEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) throw new HttpError(400, "Invalid start/end time");
    data.scheduledStart = start; data.scheduledEnd = end;
  }

  const appt = await prisma.$transaction(async (tx) => {
    const a = await tx.appointment.update({ where: { id }, data });
    if (existing.leadId && (d.scheduledStart || d.status)) {
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
  await prisma.appointment.delete({ where: { id } });
  return json({ ok: true });
});
