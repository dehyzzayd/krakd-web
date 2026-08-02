import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyRefresh, issueTokens } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ refreshToken: z.string().min(1) });

/* POST /api/v1/auth/refresh → mint a fresh access token from a valid refresh token */
export const POST = route(async (req: NextRequest) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "Missing refresh token");
  const userId = await verifyRefresh(parsed.data.refreshToken);
  if (!userId) throw new HttpError(401, "Session expired");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true, dealershipId: true, status: true } });
  if (!user || user.status !== "ACTIVE") throw new HttpError(401, "Session expired");

  const tokens = await issueTokens({ userId: user.id, dealershipId: user.dealershipId, role: user.role, email: user.email });
  return json(tokens);
});
