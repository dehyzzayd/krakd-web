import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function load(dealershipId: string, id: string) {
  const q = await prisma.quote.findFirst({ where: { id, dealershipId }, include: { items: { orderBy: { sortOrder: "asc" } } } });
  if (!q) throw new HttpError(404, "Quote not found");
  return {
    id: q.id, number: q.number, status: q.status,
    clientName: q.clientName, clientEmail: q.clientEmail ?? "", clientPhone: q.clientPhone ?? "",
    projectTitle: q.projectTitle ?? "", notes: q.notes ?? "", taxRate: q.taxRate,
    validUntil: q.validUntil ? q.validUntil.toISOString().slice(0, 10) : "",
    subtotal: Math.round(q.subtotalCents / 100), tax: Math.round(q.taxCents / 100), total: Math.round(q.totalCents / 100),
    publicToken: q.publicToken, sentAt: q.sentAt?.toISOString() ?? null, respondedAt: q.respondedAt?.toISOString() ?? null,
    items: q.items.map((i) => ({ id: i.id, description: i.description, quantity: i.quantity, unit: Math.round(i.unitCents) / 100, amount: Math.round(i.amountCents / 100) })),
  };
}

export const GET = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  return json(await load(dealershipId, id));
});

const itemSchema = z.object({ description: z.string().default(""), quantity: z.coerce.number().min(0).default(1), unit: z.coerce.number().min(0).default(0) });
const patchSchema = z.object({
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  projectTitle: z.string().optional(),
  notes: z.string().max(4000).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  validUntil: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]).optional(),
  items: z.array(itemSchema).max(80).optional(),
});

export const PATCH = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const existing = await prisma.quote.findFirst({ where: { id, dealershipId }, select: { id: true, taxRate: true } });
  if (!existing) throw new HttpError(404, "Quote not found");
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;

  const taxRate = d.taxRate ?? existing.taxRate;
  await prisma.$transaction(async (tx) => {
    if (d.items) {
      const rows = d.items.map((it, idx) => ({ description: it.description, quantity: it.quantity, unitCents: Math.round(it.unit * 100), amountCents: Math.round(it.quantity * it.unit * 100), sortOrder: idx }));
      const subtotalCents = rows.reduce((s, r) => s + r.amountCents, 0);
      const taxCents = Math.round((subtotalCents * taxRate) / 100);
      await tx.quoteLineItem.deleteMany({ where: { quoteId: id } });
      if (rows.length) await tx.quoteLineItem.createMany({ data: rows.map((r) => ({ ...r, quoteId: id })) });
      await tx.quote.update({ where: { id, dealershipId }, data: { subtotalCents, taxCents, totalCents: subtotalCents + taxCents } });
    } else if (d.taxRate != null) {
      const q = await tx.quote.findFirst({ where: { id, dealershipId }, select: { subtotalCents: true } });
      const taxCents = Math.round(((q?.subtotalCents ?? 0) * taxRate) / 100);
      await tx.quote.update({ where: { id, dealershipId }, data: { taxCents, totalCents: (q?.subtotalCents ?? 0) + taxCents } });
    }
    await tx.quote.update({
      where: { id, dealershipId },
      data: {
        ...(d.clientName != null ? { clientName: d.clientName || "New client" } : {}),
        ...(d.clientEmail != null ? { clientEmail: d.clientEmail || null } : {}),
        ...(d.clientPhone != null ? { clientPhone: d.clientPhone || null } : {}),
        ...(d.projectTitle != null ? { projectTitle: d.projectTitle || null } : {}),
        ...(d.notes != null ? { notes: d.notes || null } : {}),
        ...(d.taxRate != null ? { taxRate } : {}),
        ...(d.validUntil != null ? { validUntil: d.validUntil ? new Date(d.validUntil) : null } : {}),
        ...(d.status ? { status: d.status, ...(d.status === "SENT" ? { sentAt: new Date() } : {}) } : {}),
      },
    });
  });
  return json(await load(dealershipId, id));
});

export const DELETE = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const owned = await prisma.quote.findFirst({ where: { id, dealershipId }, select: { id: true } });
  if (!owned) throw new HttpError(404, "Quote not found");
  await prisma.quote.delete({ where: { id, dealershipId } });
  return json({ ok: true });
});
