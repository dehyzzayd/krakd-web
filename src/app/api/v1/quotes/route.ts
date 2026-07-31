import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/quotes → list for the current business */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const rows = await prisma.quote.findMany({ where: { dealershipId }, orderBy: { createdAt: "desc" }, take: 300, include: { _count: { select: { items: true } } } });
  return json({
    items: rows.map((q) => ({
      id: q.id, number: q.number, clientName: q.clientName, projectTitle: q.projectTitle,
      status: q.status, total: Math.round(q.totalCents / 100), lineItems: q._count.items,
      validUntil: q.validUntil?.toISOString() ?? null, createdAt: q.createdAt.toISOString(),
    })),
  });
});

const createSchema = z.object({ clientName: z.string().optional(), projectTitle: z.string().optional(), leadId: z.string().uuid().optional() });

/* POST /api/v1/quotes → create a draft; returns its id */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const d = parsed.data;

  if (d.leadId) { const l = await prisma.lead.findFirst({ where: { id: d.leadId, dealershipId }, select: { id: true } }); if (!l) throw new HttpError(404, "Lead not found"); }
  const count = await prisma.quote.count({ where: { dealershipId } });

  const q = await prisma.quote.create({
    data: {
      dealershipId, leadId: d.leadId,
      number: `Q-${1001 + count}`,
      clientName: d.clientName?.trim() || "New client",
      projectTitle: d.projectTitle?.trim() || null,
      status: "DRAFT",
      publicToken: randomUUID().replace(/-/g, ""),
    },
  });
  return json({ id: q.id }, 201);
});
