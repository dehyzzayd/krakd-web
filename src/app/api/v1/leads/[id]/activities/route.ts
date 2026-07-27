import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["NOTE", "CALL", "SMS", "EMAIL"]).default("NOTE"),
  content: z.string().trim().min(1, "Add some text"),
});

/* POST /api/v1/leads/[id]/activities → log a note, call, text or email on the lead.
 * Communications are recorded here (and surface in the inbox) — no external mail client. */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  const lead = await prisma.lead.findFirst({ where: { id, dealershipId }, select: { id: true } });
  if (!lead) throw new HttpError(404, "Lead not found");

  await prisma.$transaction([
    prisma.leadActivity.create({ data: { dealershipId, leadId: id, type: parsed.data.type, actorType: "USER", content: parsed.data.content } }),
    prisma.lead.update({ where: { id }, data: { lastActivityAt: new Date() } }),
  ]);
  return json({ ok: true }, 201);
});
