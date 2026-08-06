import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/server/admin";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "INTERESTED", "DEMO", "NEGOTIATING", "WON", "LOST"] as const;

async function team() {
  const admins = await prisma.user.findMany({ where: { role: "PLATFORM_ADMIN" }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: { firstName: "asc" } });
  return admins.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim() || u.email }));
}

/* GET /api/v1/outreach → the Krakd team's prospect pipeline + pipeline stats */
export const GET = route(async (req: NextRequest) => {
  await requirePlatformAdmin(req);
  const rows = await prisma.outreachContact.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { notes: true } } } });
  const items = rows.map((r) => ({
    id: r.id, company: r.company, contactName: r.contactName, title: r.title, email: r.email, phone: r.phone,
    website: r.website, city: r.city, state: r.state, category: r.category, status: r.status, source: r.source,
    value: Math.round(r.valueCents / 100), ownerId: r.ownerId, ownerName: r.ownerName,
    nextFollowUpAt: r.nextFollowUpAt?.toISOString() ?? null, lastContactedAt: r.lastContactedAt?.toISOString() ?? null,
    notes: r._count.notes, updatedAt: r.updatedAt.toISOString(),
  }));
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, items.filter((i) => i.status === s).length]));
  const open = items.filter((i) => i.status !== "WON" && i.status !== "LOST");
  const stats = {
    total: items.length,
    open: open.length,
    won: byStatus.WON,
    openValue: open.reduce((s, i) => s + i.value, 0),
    wonValue: items.filter((i) => i.status === "WON").reduce((s, i) => s + i.value, 0),
    byStatus,
  };
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))] as string[];
  return json({ items, stats, team: await team(), categories });
});

const createSchema = z.object({
  company: z.string().trim().min(1, "Company name is required"),
  contactName: z.string().optional(),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(STATUSES).optional(),
  source: z.string().optional(),
  valueCents: z.coerce.number().int().min(0).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  nextFollowUpAt: z.string().optional(),
});

/* POST /api/v1/outreach → add a prospect */
export const POST = route(async (req: NextRequest) => {
  const p = await requirePlatformAdmin(req);
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;

  let ownerName: string | null = null;
  if (d.ownerId) {
    const u = await prisma.user.findUnique({ where: { id: d.ownerId }, select: { firstName: true, lastName: true, email: true } });
    ownerName = u ? `${u.firstName} ${u.lastName}`.trim() || u.email : null;
  }
  const c = await prisma.outreachContact.create({
    data: {
      company: d.company, contactName: d.contactName, title: d.title, email: d.email, phone: d.phone, website: d.website,
      city: d.city, state: d.state, category: d.category, status: d.status ?? "NEW", source: d.source,
      valueCents: d.valueCents ?? 0, ownerId: d.ownerId ?? null, ownerName,
      nextFollowUpAt: d.nextFollowUpAt ? new Date(d.nextFollowUpAt) : null,
      createdById: p.userId,
    },
    select: { id: true },
  });
  return json({ id: c.id }, 201);
});
