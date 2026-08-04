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
  const [l, cfg] = await Promise.all([
    prisma.lead.findFirst({
      where: { id, dealershipId },
      include: { vehicle: true, assignedTo: { select: { firstName: true, lastName: true } }, activities: { orderBy: { createdAt: "desc" }, take: 50 }, appointments: { orderBy: { scheduledStart: "desc" } }, creditApps: { orderBy: { createdAt: "desc" }, select: { id: true, status: true, createdAt: true } } },
    }),
    prisma.creditAppConfig.findUnique({ where: { dealershipId }, select: { publicToken: true } }),
  ]);
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
    nextAction: l.nextAction ?? null, nextActionAt: l.nextActionAt?.toISOString() ?? null,
    creditAppToken: cfg?.publicToken ?? null,
    creditApps: l.creditApps.map((c) => ({ id: c.id, status: c.status, when: `${ago(c.createdAt)} ago` })),
    activities: l.activities.map((a) => ({ id: a.id, type: ACT_LABEL[a.type] ?? a.type, kind: a.type, content: a.content ?? "", actor: a.actorType, when: `${ago(a.createdAt)} ago` })),
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
  emails: z.array(z.object({ value: z.string(), type: z.string() })).max(10).optional(),
  phones: z.array(z.object({ value: z.string(), type: z.string() })).max(10).optional(),
  source: z.string().optional(),
  vehicleId: z.string().uuid().nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  hasTradeIn: z.boolean().optional(),
  financing: z.boolean().optional(),
  nextAction: z.string().nullable().optional(),
  nextActionAt: z.string().nullable().optional(),
});

export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const existing = await prisma.lead.findFirst({ where: { id, dealershipId }, select: { id: true, status: true } });
  if (!existing) throw new HttpError(404, "Lead not found");

  const { phone, email, emails, phones, vehicleId, assignedToId, status, nextActionAt, ...rest } = parsed.data;
  const data: Prisma.LeadUpdateInput = { ...rest, lastActivityAt: new Date() };
  if (status) data.status = status;
  if (nextActionAt !== undefined) data.nextActionAt = nextActionAt ? new Date(nextActionAt) : null;
  // full arrays (from the contact editor) win over the single phone/email convenience fields
  if (phones !== undefined) data.phones = phones.filter((p) => p.value.trim()) as unknown as Prisma.InputJsonValue;
  else if (phone !== undefined) data.phones = (phone ? [{ value: phone, type: "mobile" }] : []) as unknown as Prisma.InputJsonValue;
  if (emails !== undefined) data.emails = emails.filter((e) => e.value.trim()) as unknown as Prisma.InputJsonValue;
  else if (email !== undefined) data.emails = (email ? [{ value: email, type: "personal" }] : []) as unknown as Prisma.InputJsonValue;
  if (vehicleId !== undefined) {
    if (vehicleId) {
      const v = await prisma.vehicle.findFirst({ where: { id: vehicleId, dealershipId }, select: { id: true } });
      if (!v) throw new HttpError(400, "That vehicle isn't in your inventory");
      data.vehicle = { connect: { id: vehicleId } };
    } else {
      data.vehicle = { disconnect: true };
    }
  }

  let assignActivity: string | null = null;
  if (assignedToId !== undefined) {
    if (assignedToId) {
      const u = await prisma.user.findFirst({ where: { id: assignedToId, dealershipId, role: { not: "PLATFORM_ADMIN" } }, select: { firstName: true, lastName: true } });
      if (!u) throw new HttpError(400, "That teammate isn't on your team");
      data.assignedTo = { connect: { id: assignedToId } };
      data.ownerType = "HUMAN";
      assignActivity = `Assigned to ${u.firstName} ${u.lastName ?? ""}`.trim();
    } else {
      data.assignedTo = { disconnect: true };
      data.ownerType = "UNASSIGNED";
      assignActivity = "Unassigned";
    }
  }

  await prisma.lead.update({ where: { id, dealershipId }, data });
  // log a status change to the timeline
  if (status && status !== existing.status) {
    await prisma.leadActivity.create({ data: { dealershipId, leadId: id, type: "STATUS_CHANGE", actorType: "USER", content: `Status set to ${STATUS_LABEL[status] ?? status}` } }).catch(() => {});
  }
  if (assignActivity) {
    await prisma.leadActivity.create({ data: { dealershipId, leadId: id, type: "ASSIGNMENT", actorType: "USER", content: assignActivity } }).catch(() => {});
  }
  return json(await load(dealershipId, id));
});
