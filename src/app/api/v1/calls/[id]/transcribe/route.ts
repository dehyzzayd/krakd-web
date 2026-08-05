import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { submitTranscription } from "@/lib/server/calls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/calls/[id]/transcribe → (re)transcribe a call's recording */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { dealershipId } = await requireAuth(req);
  const { id } = await ctx.params;
  const call = await prisma.call.findFirst({ where: { id, dealershipId }, select: { id: true } });
  if (!call) throw new HttpError(404, "Call not found");
  const r = await submitTranscription(id);
  if (!r.submitted) throw new HttpError(400, r.reason ?? "Could not transcribe.");
  return json({ ok: true });
});
