import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ago = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: "New", tone: "brand" },
  CONTACTED: { label: "Working", tone: "warn" },
  QUALIFIED: { label: "Qualified", tone: "warn" },
  APPOINTMENT: { label: "Appt set", tone: "ok" },
  SOLD: { label: "Sold", tone: "ok" },
  LOST: { label: "Lost", tone: "neutral" },
};

export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const where = { dealershipId };

  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 86_400_000);

  const [dealer, sold, activeLeads, apptsToday, liveVehicles, recent] = await Promise.all([
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, vertical: true } }),
    prisma.vehicle.findMany({ where: { dealershipId, status: "SOLD" }, select: { priceCents: true, costCents: true } }),
    prisma.lead.count({ where: { dealershipId, status: { notIn: ["SOLD", "LOST"] } } }),
    prisma.appointment.count({ where: { dealershipId, scheduledStart: { gte: startOfDay, lt: endOfDay } } }),
    prisma.vehicle.findMany({ where: { dealershipId, status: { not: "SOLD" } }, select: { listedAt: true } }),
    prisma.lead.findMany({
      where, orderBy: { lastActivityAt: "desc" }, take: 6,
      include: { vehicle: { select: { year: true, make: true, model: true } }, assignedTo: { select: { firstName: true } } },
    }),
  ]);

  const grossCents = sold.reduce((s, v) => s + (v.priceCents - v.costCents), 0);

  const days = liveVehicles.map((v) => (v.listedAt ? Math.floor((Date.now() - v.listedAt.getTime()) / 86_400_000) : 0));
  const bucket = (lo: number, hi: number) => days.filter((d) => d >= lo && d < hi).length;
  const units = liveVehicles.length;
  const aging = [
    { label: "Fresh · <15d", n: bucket(0, 15), tone: "ok" },
    { label: "Active · 15–30d", n: bucket(15, 30), tone: "brand" },
    { label: "Aging · 30–45d", n: bucket(30, 45), tone: "warn" },
    { label: "Stale · 45d+", n: bucket(45, 9999), tone: "err" },
  ];
  const avgDays = units ? Math.round(days.reduce((s, d) => s + d, 0) / units) : 0;

  return json({
    dealershipName: dealer?.name ?? "Your dealership",
    vertical: dealer?.vertical ?? "AUTOMOTIVE",
    kpis: {
      grossCents,
      unitsSold: sold.length,
      activeLeads,
      apptsToday,
    },
    recentLeads: recent.map((l) => ({
      name: `${l.firstName} ${l.lastName ?? ""}`.trim(),
      source: l.source ?? "—",
      vehicle: l.vehicle ? `${l.vehicle.year} ${l.vehicle.make} ${l.vehicle.model}` : "—",
      status: STATUS[l.status]?.label ?? l.status,
      tone: STATUS[l.status]?.tone ?? "neutral",
      owner: l.ownerType === "AI" ? "AI" : l.assignedTo?.firstName ?? "—",
      time: ago(l.lastActivityAt),
    })),
    inventory: { units, avgDays, aging },
  });
});
