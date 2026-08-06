import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/server/admin";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "INTERESTED", "DEMO", "NEGOTIATING", "WON", "LOST"] as const;

async function load(id: string) {
  const r = await prisma.outreachContact.findUnique({ where: { id }, include: { notes: { orderBy: { createdAt: "desc" } } } });
  if (!r) throw new HttpError(404, "Prospect not found");
  return {
    id: r.id, company: r.company, contactName: r.contactName, title: r.title, email: r.email, phone: r.phone,
    website: r.website, city: r.city, state: r.state, category: r.category, status: r.status, source: r.source,
    value: Math.round(r.valueCents / 100), ownerId: r.ownerId, ownerName: r.ownerName,
    nextFollowUpAt: r.nextFollowUpAt?.toISOString() ?? null, lastContactedAt: r.lastContactedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    notes: r.notes.map((n) => ({ id: n.id, type: n.type, content: n.content, authorName: n.authorName, when: n.createdAt.toISOString() })),
  };
}

export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requirePlatformAdmin(req);
  const { id } = await ctx.params;
  return json(await load(id));
});

const patchSchema = z.object({
  company: z.string().trim().min(1).optional(),
  contactName: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  status: z.enum(STATUSES).optional(),
  source: z.string().nullable().optional(),
  valueCents: z.coerce.number().int().min(0).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  nextFollowUpAt: z.string().nullable().optional(),
});

export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const p = await requirePlatformAdmin(req);
  const { id } = await ctx.params;
  const existing = await prisma.outreachContact.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw new HttpError(404, "Prospect not found");
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const { ownerId, nextFollowUpAt, ...d } = parsed.data;

  let ownerName: string | null | undefined;
  if (ownerId !== undefined) {
    if (ownerId) { const u = await prisma.user.findUnique({ where: { id: ownerId }, select: { firstName: true, lastName: true, email: true } }); ownerName = u ? `${u.firstName} ${u.lastName}`.trim() || u.email : null; }
    else ownerName = null;
  }

  await prisma.outreachContact.update({
    where: { id },
    data: {
      ...d,
      ...(ownerId !== undefined ? { ownerId, ownerName } : {}),
      ...(nextFollowUpAt !== undefined ? { nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null } : {}),
    },
  });

  // log a status change on the timeline
  if (d.status && d.status !== existing.status) {
    const u = await prisma.user.findUnique({ where: { id: p.userId }, select: { firstName: true, lastName: true, email: true } });
    const author = u ? `${u.firstName} ${u.lastName}`.trim() || u.email : "Krakd";
    await prisma.outreachNote.create({ data: { contactId: id, type: "STATUS", content: `Status → ${d.status}`, authorId: p.userId, authorName: author } }).catch(() => {});
  }
  return json(await load(id));
});

export const DELETE = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requirePlatformAdmin(req);
  const { id } = await ctx.params;
  await prisma.outreachContact.delete({ where: { id } }).catch(() => {});
  return json({ ok: true });
});
