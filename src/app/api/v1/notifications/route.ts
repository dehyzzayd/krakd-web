import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ago = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
};

type Notif = { id: string; tone: "brand" | "ok" | "warn" | "err"; title: string; desc: string; href: string; at: string; time: string };

/* GET /api/v1/notifications → real actionable items (new leads, appointments, inventory gaps) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const since = new Date(Date.now() - 14 * 86_400_000);

  const [leads, appts, noPhoto] = await Promise.all([
    prisma.lead.findMany({ where: { dealershipId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 12, include: { vehicle: { select: { year: true, make: true, model: true } } } }),
    prisma.appointment.findMany({ where: { dealershipId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 8, include: { lead: { select: { firstName: true, lastName: true } } } }),
    prisma.vehicle.findMany({ where: { dealershipId, status: "AVAILABLE" }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, year: true, make: true, model: true, photoUrls: true, createdAt: true } }),
  ]);

  const items: Notif[] = [];
  for (const l of leads) {
    const veh = l.vehicle ? `${l.vehicle.year} ${l.vehicle.make} ${l.vehicle.model}` : "";
    items.push({ id: `lead-${l.id}`, tone: "brand", title: `New lead — ${l.firstName} ${l.lastName ?? ""}`.trim(), desc: [l.source, veh].filter(Boolean).join(" · ") || "New enquiry", href: `/dashboard/leads/${l.id}`, at: l.createdAt.toISOString(), time: ago(l.createdAt) });
  }
  for (const a of appts) {
    const who = a.lead ? `${a.lead.firstName} ${a.lead.lastName ?? ""}`.trim() : "Lead";
    items.push({ id: `appt-${a.id}`, tone: "ok", title: `Appointment — ${a.type.replace("_", " ").toLowerCase()}`, desc: `${who} · ${new Date(a.scheduledStart).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`, href: "/dashboard/appointments", at: a.createdAt.toISOString(), time: ago(a.createdAt) });
  }
  for (const v of noPhoto) {
    const photos = Array.isArray(v.photoUrls) ? (v.photoUrls as string[]) : [];
    if (photos.length === 0) items.push({ id: `veh-${v.id}`, tone: "warn", title: "Vehicle missing photos", desc: `${v.year} ${v.make} ${v.model} · listed with no images`, href: `/dashboard/inventory/${v.id}`, at: v.createdAt.toISOString(), time: ago(v.createdAt) });
  }

  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return json({ items: items.slice(0, 15) });
});
