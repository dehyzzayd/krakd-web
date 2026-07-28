import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueTokens, verifyPassword } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const POST = route(async (req: NextRequest) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "Email and password are required");
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email }, include: { dealership: { select: { status: true } } } });
  if (!user || user.status === "DISABLED" || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid credentials");
  }
  // suspended dealerships cannot sign in (platform admins are exempt — their internal org is never suspended)
  if (user.role !== "PLATFORM_ADMIN" && user.dealership.status === "SUSPENDED") {
    throw new HttpError(403, "This account is suspended. Please contact Krakd to reactivate.");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return json(await issueTokens({ userId: user.id, dealershipId: user.dealershipId, role: user.role, email: user.email }));
});
