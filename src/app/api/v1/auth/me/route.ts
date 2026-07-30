import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  const dealer = await prisma.dealership.findUnique({ where: { id: principal.dealershipId }, select: { vertical: true } });
  return json({ ...principal, vertical: dealer?.vertical ?? "AUTOMOTIVE" });
});
