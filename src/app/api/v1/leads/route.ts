import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import type { Prisma } from "@prisma/client";
import { sendLeadNotification } from "@/lib/server/email";
import { deliverAdf } from "@/lib/server/adfDelivery";
import { pushLeadToIntegrations } from "@/lib/server/integrationDelivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  emails: z.array(z.object({ value: z.string(), type: z.string() })).max(10).optional(),
  phones: z.array(z.object({ value: z.string(), type: z.string() })).max(10).optional(),
  source: z.string().optional(),
  vehicle: z.string().optional(),
  vehicleId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  temperature: z.enum(["HOT", "WARM", "COLD"]).optional(),
});

/* POST /api/v1/leads → add a lead to the current dealer */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;

  // only link a vehicle-of-interest that actually belongs to this dealer
  let vehicleId: string | undefined;
  let vehicleLabel = d.vehicle ?? "";
  if (d.vehicleId) {
    const v = await prisma.vehicle.findFirst({ where: { id: d.vehicleId, dealershipId }, select: { id: true, year: true, make: true, model: true } });
    if (!v) throw new HttpError(400, "That vehicle isn't in your inventory");
    vehicleId = v.id;
    vehicleLabel = `${v.year} ${v.make} ${v.model}`;
  }

  if (d.assignedToId) {
    const u = await prisma.user.findFirst({ where: { id: d.assignedToId, dealershipId, role: { not: "PLATFORM_ADMIN" } }, select: { id: true } });
    if (!u) throw new HttpError(400, "That teammate isn't on your team");
  }

  const lead = await prisma.lead.create({
    data: {
      dealershipId,
      vehicleId,
      firstName: d.firstName,
      lastName: d.lastName,
      emails: ((d.emails?.filter((e) => e.value.trim())) ?? (d.email ? [{ value: d.email, type: "personal" }] : [])) as unknown as Prisma.InputJsonValue,
      phones: ((d.phones?.filter((p) => p.value.trim())) ?? (d.phone ? [{ value: d.phone, type: "mobile" }] : [])) as unknown as Prisma.InputJsonValue,
      source: d.source,
      temperature: d.temperature ?? "WARM",
      ...(d.assignedToId ? { assignedToId: d.assignedToId, ownerType: "HUMAN" as const } : {}),
    },
  });

  // notify the dealer's owner (best-effort)
  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, users: { where: { role: "OWNER" }, select: { email: true }, take: 1 } } });
  const ownerEmail = dealer?.users[0]?.email;
  if (ownerEmail) void sendLeadNotification({ to: ownerEmail, dealershipName: dealer!.name, leadName: `${d.firstName} ${d.lastName ?? ""}`.trim(), source: d.source ?? "", vehicle: vehicleLabel, contact: d.phone ?? d.email ?? "", leadId: lead.id });
  void deliverAdf(lead.dealershipId, lead.id).catch(() => {});
  void pushLeadToIntegrations(lead.dealershipId, lead.id).catch(() => {});

  return json({ id: lead.id }, 201);
});

const ago = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};
const first = (arr: unknown, key = "value") => Array.isArray(arr) && arr[0] ? (arr[0] as Record<string, string>)[key] ?? "" : "";
const STATUS_LABEL: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", APPOINTMENT: "Appt set", SOLD: "Sold", LOST: "Lost" };
const TEMP_LABEL: Record<string, string> = { HOT: "Hot", WARM: "Warm", COLD: "Cold" };

/* GET /api/v1/leads → { items, stats } for the current dealer (empty for new accounts) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const where: Prisma.LeadWhereInput = { dealershipId };

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const dayAgo = new Date(Date.now() - 86_400_000);

  const [rows, total, newToday, hotLeads, apptsToday, sold, statusGroups] = await Promise.all([
    prisma.lead.findMany({
      where, orderBy: { createdAt: "desc" }, take: 200,
      include: { vehicle: { select: { year: true, make: true, model: true } }, assignedTo: { select: { firstName: true, lastName: true } } },
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { dealershipId, createdAt: { gte: dayAgo } } }),
    prisma.lead.count({ where: { dealershipId, temperature: "HOT", status: { notIn: ["SOLD", "LOST"] } } }),
    prisma.appointment.count({ where: { dealershipId, scheduledStart: { gte: startOfDay } } }),
    prisma.lead.count({ where: { dealershipId, status: "SOLD" } }),
    prisma.lead.groupBy({ by: ["status"], where, _count: true }),
  ]);

  const active = statusGroups.filter((g) => !["SOLD", "LOST"].includes(g.status)).reduce((s, g) => s + g._count, 0);
  const needsResponse = statusGroups.find((g) => g.status === "NEW")?._count ?? 0;

  const items = rows.map((l) => ({
    id: l.id,
    name: `${l.firstName} ${l.lastName ?? ""}`.trim(),
    phone: first(l.phones),
    email: first(l.emails),
    source: l.source ?? "—",
    vehicle: l.vehicle ? `${l.vehicle.year} ${l.vehicle.make} ${l.vehicle.model}` : "—",
    statusLabel: STATUS_LABEL[l.status] ?? l.status,
    status: l.status,
    temperature: TEMP_LABEL[l.temperature] ?? l.temperature,
    assigned: l.ownerType === "AI" ? "Krakd AI" : l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName ?? ""}`.trim() : null,
    lastAdded: `${ago(l.createdAt)} ago`,
  }));

  return json({
    items,
    stats: {
      total, active, newToday, needsResponse, apptsToday, hotLeads,
      closeRate: total ? Math.round((sold / total) * 100) : 0,
    },
  });
});
