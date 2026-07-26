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

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return json({ ok: true });
});
