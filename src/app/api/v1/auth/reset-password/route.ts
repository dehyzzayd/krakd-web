import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyResetToken } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(10), password: z.string().min(8) });

export const POST = route(async (req: NextRequest) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "Enter a new password of at least 8 characters");

  const userId = await verifyResetToken(parsed.data.token);
  if (!userId) throw new HttpError(401, "This reset link is invalid or has expired");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  const passwordHash = await hashPassword(parsed.data.password);
  // an invited teammate setting their password for the first time becomes ACTIVE
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, ...(user?.status === "INVITED" ? { status: "ACTIVE" as const } : {}) } });
  return json({ ok: true });
});
