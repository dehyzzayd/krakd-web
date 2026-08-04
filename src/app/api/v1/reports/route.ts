import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "APPOINTMENT", "SOLD"] as const;
const STAGE_LABEL: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", APPOINTMENT: "Appointment", SOLD: "Sold", LOST: "Lost" };

function rangeStart(range: string): Date | null {
  const d = new Date();
  if (range === "mtd") { d.setHours(0, 0, 0, 0); d.setDate(1); return d; }
  if (range === "30d") return new Date(Date.now() - 30 * 86_400_000);
  if (range === "7d") return new Date(Date.now() - 7 * 86_400_000);
  return null; // all-time
}

/* GET /api/v1/reports?range=mtd|30d|7d|all → funnel, close rate, sources, per-rep leaderboard */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const range = req.nextUrl.searchParams.get("range") || "mtd";
  const start = rangeStart(range);
  const leadWhere: Prisma.LeadWhereInput = { dealershipId, ...(start ? { createdAt: { gte: start } } : {}) };
  const apptWhere: Prisma.AppointmentWhereInput = { dealershipId, ...(start ? { scheduledStart: { gte: start } } : {}) };

  const [statusGroups, sourceGroups, users, apptByRep] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], where: leadWhere, _count: true }),
    prisma.lead.groupBy({ by: ["source"], where: leadWhere, _count: true }),
    prisma.user.findMany({ where: { dealershipId, role: { not: "PLATFORM_ADMIN" }, status: { not: "DISABLED" } }, select: { id: true, firstName: true, lastName: true } }),
    prisma.appointment.groupBy({ by: ["assignedToId"], where: apptWhere, _count: true }),
  ]);

  const countByStatus = (s: string) => statusGroups.find((g) => g.status === s)?._count ?? 0;
  const total = statusGroups.reduce((s, g) => s + g._count, 0);
  const sold = countByStatus("SOLD");
  const lost = countByStatus("LOST");

  // funnel: cumulative — everyone who reached at least this stage
  const reached = (stage: string) => {
    const idx = STAGES.indexOf(stage as (typeof STAGES)[number]);
    return STAGES.slice(idx).reduce((s, st) => s + countByStatus(st), 0);
  };
  const funnel = STAGES.map((st) => ({ key: st, label: STAGE_LABEL[st], value: reached(st) }));

  const sources = sourceGroups
    .map((g) => ({ source: g.source ?? "Unknown", count: g._count }))
    .sort((a, b) => b.count - a.count);

  // per-rep leaderboard (assigned all-time; sold + appts within range)
  const perRep = await Promise.all(users.map(async (u) => {
    const [assigned, repSold] = await Promise.all([
      prisma.lead.count({ where: { dealershipId, assignedToId: u.id } }),
      prisma.lead.count({ where: { dealershipId, assignedToId: u.id, status: "SOLD", ...(start ? { createdAt: { gte: start } } : {}) } }),
    ]);
    const appts = apptByRep.find((a) => a.assignedToId === u.id)?._count ?? 0;
    return {
      id: u.id, name: `${u.firstName} ${u.lastName ?? ""}`.trim(),
      assigned, appts, sold: repSold, closeRate: assigned ? Math.round((repSold / assigned) * 100) : 0,
    };
  }));
  perRep.sort((a, b) => b.sold - a.sold || b.assigned - a.assigned);

  return json({
    range,
    totals: { total, sold, lost, closeRate: total ? Math.round((sold / total) * 100) : 0 },
    funnel,
    sources,
    perRep,
  });
});
