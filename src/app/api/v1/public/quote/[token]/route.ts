import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { json, route, HttpError } from "@/lib/server/http";
import { sendLeadNotification } from "@/lib/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadByToken(token: string) {
  const q = await prisma.quote.findUnique({ where: { publicToken: token }, include: { items: { orderBy: { sortOrder: "asc" } }, dealership: { select: { name: true, brandColor: true, logoUrl: true, phone: true, email: true } } } });
  if (!q || q.status === "DRAFT") throw new HttpError(404, "Quote not found");
  return q;
}

/* GET /api/v1/public/quote/[token] → client-facing quote view */
export const GET = route(async (_req: NextRequest, ctx: { params: Promise<{ token: string }> }) => {
  const { token } = await ctx.params;
  const q = await loadByToken(token);
  return json({
    number: q.number, status: q.status, clientName: q.clientName, projectTitle: q.projectTitle ?? "",
    notes: q.notes ?? "", taxRate: q.taxRate,
    subtotal: Math.round(q.subtotalCents / 100), tax: Math.round(q.taxCents / 100), total: Math.round(q.totalCents / 100),
    validUntil: q.validUntil?.toISOString() ?? null,
    items: q.items.map((i) => ({ description: i.description, quantity: i.quantity, unit: Math.round(i.unitCents) / 100, amount: Math.round(i.amountCents / 100) })),
    business: { name: q.dealership.name, brandColor: q.dealership.brandColor, logoUrl: q.dealership.logoUrl, phone: q.dealership.phone },
  });
});

const actSchema = z.object({ action: z.enum(["accept", "decline"]) });

/* POST → client accepts or declines */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ token: string }> }) => {
  const { token } = await ctx.params;
  const q = await loadByToken(token);
  if (q.status !== "SENT") throw new HttpError(409, "This quote has already been responded to.");
  const parsed = actSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "Invalid action");
  const status = parsed.data.action === "accept" ? "ACCEPTED" : "DECLINED";

  await prisma.quote.update({ where: { id: q.id }, data: { status, respondedAt: new Date() } });
  if (q.leadId) {
    await prisma.leadActivity.create({ data: { dealershipId: q.dealershipId, leadId: q.leadId, type: "NOTE", actorType: "SYSTEM", content: `Quote ${q.number} was ${status.toLowerCase()} by the client.` } }).catch(() => {});
  }
  const dealer = await prisma.dealership.findUnique({ where: { id: q.dealershipId }, select: { name: true, users: { where: { role: "OWNER" }, select: { email: true }, take: 1 } } });
  const ownerEmail = dealer?.users[0]?.email;
  if (ownerEmail) void sendLeadNotification({ to: ownerEmail, dealershipName: dealer!.name, leadName: q.clientName, source: `Quote ${status.toLowerCase()}`, vehicle: q.projectTitle ?? q.number, contact: q.clientEmail ?? q.clientPhone ?? "", leadId: q.leadId ?? q.id });

  return json({ ok: true, status });
});
