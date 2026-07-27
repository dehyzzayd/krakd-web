import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ago = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
};
const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as Record<string, string>).value ?? "" : "");
const STATUS_LABEL: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", APPOINTMENT: "Appt set", SOLD: "Sold", LOST: "Lost" };
const ACT_LABEL: Record<string, string> = { NOTE: "Note", CALL: "Call", SMS: "Text", EMAIL: "Email", STATUS_CHANGE: "Status change", AI_MESSAGE: "Krakd AI", APPOINTMENT_SET: "Appointment", ASSIGNMENT: "Assignment" };

async function load(dealershipId: string, id: string) {
  const l = await prisma.lead.findFirst({
    where: { id, dealershipId },
    include: { vehicle: true, assignedTo: { select: { firstName: true, lastName: true } }, activities: { orderBy: { createdAt: "desc" }, take: 50 }, appointments: { orderBy: { scheduledStart: "desc" } } },
  });
  if (!l) throw new HttpError(404, "Lead not found");
  return {
    id: l.id,
    name: `${l.firstName} ${l.lastName ?? ""}`.trim(),
    phone: first(l.phones), email: first(l.emails),
    source: l.source ?? "—", status: l.status, statusLabel: STATUS_LABEL[l.status] ?? l.status,
    temperature: l.temperature, score: l.score,
    vehicle: l.vehicle ? `${l.vehicle.year} ${l.vehicle.make} ${l.vehicle.model}` : "—",
    assigned: l.ownerType === "AI" ? "Krakd AI" : l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName ?? ""}`.trim() : "Unassigned",
    hasTradeIn: l.hasTradeIn, financing: l.financing, createdAgo: `${ago(l.createdAt)} ago`,
    activities: l.activities.map((a) => ({ id: a.id, type: ACT_LABEL[a.type] ?? a.type, content: a.content ?? "", actor: a.actorType, when: `${ago(a.createdAt)} ago` })),
    appointments: l.appointments.map((a) => ({ id: a.id, type: a.type, status: a.status, start: a.scheduledStart.toISOString() })),
  };
}

export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  return json(await load(dealershipId, id));
});

const patchSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "APPOINTMENT", "SOLD", "LOST"]).optional(),
  temperature: z.enum(["HOT", "WARM", "COLD"]).optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  source: z.string().optional(),
  vehicleId: z.string().uuid().nullable().optional(),
  hasTradeIn: z.boolean().optional(),
  financing: z.boolean().optional(),
});

export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const existing = await prisma.lead.findFirst({ where: { id, dealershipId }, select: { id: true, status: true } });
  if (!existing) throw new HttpError(404, "Lead not found");

  const { phone, email, vehicleId, status, ...rest } = parsed.data;
  const data: Prisma.LeadUpdateInput = { ...rest, lastActivityAt: new Date() };
  if (status) data.status = status;
  if (phone !== undefined) data.phones = (phone ? [{ value: phone, type: "mobile" }] : []) as unknown as Prisma.InputJsonValue;
  if (email !== undefined) data.emails = (email ? [{ value: email, type: "personal" }] : []) as unknown as Prisma.InputJsonValue;
  if (vehicleId !== undefined) {
    if (vehicleId) {
      const v = await prisma.vehicle.findFirst({ where: { id: vehicleId, dealershipId }, select: { id: true } });
      if (!v) throw new HttpError(400, "That vehicle isn't in your inventory");
      data.vehicle = { connect: { id: vehicleId } };
    } else {
      data.vehicle = { disconnect: true };
    }
  }

  await prisma.lead.update({ where: { id }, data });
  // log a status change to the timeline
  if (status && status !== existing.status) {
    await prisma.leadActivity.create({ data: { dealershipId, leadId: id, type: "STATUS_CHANGE", actorType: "USER", content: `Status set to ${STATUS_LABEL[status] ?? status}` } }).catch(() => {});
  }
  return json(await load(dealershipId, id));
});
