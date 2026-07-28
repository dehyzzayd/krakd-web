import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin, computeClient, ago } from "@/lib/server/admin";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACT: Record<string, string> = { NOTE: "Note", CALL: "Call", SMS: "Text", EMAIL: "Email", STATUS_CHANGE: "Status change", AI_MESSAGE: "Krakd AI", APPOINTMENT_SET: "Appointment", ASSIGNMENT: "Assignment" };

/* GET /api/v1/admin/clients/[id] → the Client 360 profile */
export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requirePlatformAdmin(req);
  const { id } = await ctx.params;

  const d = await prisma.dealership.findUnique({
    where: { id },
    include: {
      subscription: { select: { status: true, priceCents: true, currentPeriodEnd: true } },
      website: { select: { status: true, domainStatus: true, template: true, domain: true, domainRenewsAt: true } },
      users: { select: { email: true, role: true, firstName: true, lastName: true, lastLoginAt: true } },
      vehicles: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } },
      campaigns: { where: { status: "ACTIVE" }, select: { name: true, channel: true, budgetCents: true, feeCents: true, netSpendCents: true, leadCount: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { vehicles: true, users: true, leads: true, appointments: true } },
    },
  });
  if (!d) throw new HttpError(404, "Client not found");

  // reuse row computation
  const row = computeClient({
    id: d.id, name: d.name, city: d.city, state: d.state, status: d.status, createdAt: d.createdAt,
    subscription: d.subscription ? { status: d.subscription.status, priceCents: d.subscription.priceCents } : null,
    website: d.website, users: d.users.filter((u) => u.role === "OWNER"), vehicles: d.vehicles,
    campaigns: d.campaigns.map((c) => ({ budgetCents: c.budgetCents, feeCents: c.feeCents, netSpendCents: c.netSpendCents })),
    _count: { vehicles: d._count.vehicles, users: d._count.users, leads: d._count.leads },
  });

  const noPhotos = await prisma.vehicle.count({ where: { dealershipId: id, status: { not: "SOLD" }, photoUrls: { equals: [] } } });
  const recentLeads = await prisma.leadActivity.findMany({ where: { dealershipId: id }, orderBy: { createdAt: "desc" }, take: 15, select: { type: true, content: true, actorType: true, createdAt: true } });

  const adBudgetCents = d.campaigns.reduce((s, c) => s + c.budgetCents, 0);
  const feeCents = d.campaigns.reduce((s, c) => s + c.feeCents, 0);
  const netCents = d.campaigns.reduce((s, c) => s + c.netSpendCents, 0);

  return json({
    ...row,
    subscription: { ...row.subscription, renewsAt: d.subscription?.currentPeriodEnd?.toISOString() ?? null },
    admin: (() => { const o = d.users.find((u) => u.role === "OWNER"); return o ? { name: `${o.firstName} ${o.lastName}`.trim(), email: o.email, lastLogin: ago(o.lastLoginAt) } : null; })(),
    services: {
      crm: { leads: d._count.leads, appointments: d._count.appointments, aiEnabled: true },
      inventory: { count: d._count.vehicles, lastSync: row.inventory.lastSync, missingPhotos: noPhotos },
      ads: { budgetCents: adBudgetCents, feeCents, netCents, campaigns: d.campaigns.length, channels: [...new Set(d.campaigns.map((c) => c.channel))] },
      website: { template: d.website?.template ?? null, live: d.website?.status === "PUBLISHED", domain: d.website?.domain ?? null, domainStatus: d.website?.domainStatus ?? "NOT_CONNECTED", renewsAt: d.website?.domainRenewsAt?.toISOString() ?? null },
      users: { total: d._count.users, seats: 5 },
    },
    billing: {
      priceCents: d.subscription?.priceCents ?? 14900,
      status: d.subscription?.status ?? "INACTIVE",
      payments: d.payments.map((p) => ({ id: p.id, type: p.type, status: p.status, amountCents: p.amountCents, description: p.description, when: ago(p.createdAt) })),
    },
    activity: recentLeads.map((a, i) => ({ id: `${i}`, type: ACT[a.type] ?? a.type, content: a.content ?? "", actor: a.actorType, when: ago(a.createdAt) })),
  });
});

/* PATCH /api/v1/admin/clients/[id] → suspend / reactivate (audited-lite via status) */
export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requirePlatformAdmin(req);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = body.status as string | undefined;
  if (!status || !["ACTIVE", "SUSPENDED"].includes(status)) throw new HttpError(400, "Invalid status");
  await prisma.dealership.update({ where: { id }, data: { status: status as "ACTIVE" | "SUSPENDED" } });
  return json({ ok: true });
});
