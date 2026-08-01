import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/server/admin";
import { issueTokens } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/admin/clients/[id]/impersonate → mint a client session for the admin.
 * "View as client": logs the access, never exposes or changes the client password. */
export const POST = route(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requirePlatformAdmin(req);
  const { id } = await ctx.params;

  const dealer = await prisma.dealership.findUnique({ where: { id }, select: { name: true } });
  if (!dealer) throw new HttpError(404, "Client not found");
  const user = await prisma.user.findFirst({ where: { dealershipId: id, role: "OWNER", status: "ACTIVE" }, select: { id: true, email: true, role: true } })
    ?? await prisma.user.findFirst({ where: { dealershipId: id }, select: { id: true, email: true, role: true } });
  if (!user) throw new HttpError(404, "This client has no user account to view as.");

  const tokens = await issueTokens({ userId: user.id, dealershipId: id, role: user.role, email: user.email });
  // durable audit trail — who viewed which client, as whom, and when
  await prisma.auditLog.create({
    data: { actorUserId: admin.userId, actorEmail: admin.email, action: "IMPERSONATE", targetType: "DEALERSHIP", targetId: id, dealershipId: id, metadata: { dealerName: dealer.name, viewedAs: user.email } },
  }).catch(() => {});
  return json({ ...tokens, dealershipName: dealer.name, email: user.email });
});
