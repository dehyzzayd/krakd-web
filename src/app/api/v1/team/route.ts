import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { hashPassword, signResetToken } from "@/lib/server/auth";
import { sendTeamInviteEmail } from "@/lib/server/email";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ago = (d: Date | null) => {
  if (!d) return null;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

/* GET /api/v1/team → the dealership's people (never platform admins) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const users = await prisma.user.findMany({
    where: { dealershipId, role: { not: "PLATFORM_ADMIN" } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, firstName: true, lastName: true, email: true, role: true, status: true, lastLoginAt: true,
      _count: { select: { assignedLeads: true } },
    },
  });
  return json({
    members: users.map((u) => ({
      id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), email: u.email,
      role: u.role, status: u.status, lastActive: ago(u.lastLoginAt), assignedLeads: u._count.assignedLeads,
    })),
  });
});

const inviteSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name"),
  lastName: z.string().trim().min(1, "Enter a last name"),
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["MANAGER", "STAFF"]),
});

/* POST /api/v1/team → invite a teammate (owner/manager only). Creates an INVITED
 * user and emails them a set-password link (reuses the reset-token flow). */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId, role, userId } = await requireAuth(req);
  if (role !== "OWNER" && role !== "MANAGER") throw new HttpError(403, "Only owners and managers can add teammates.");

  const parsed = inviteSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const { firstName, lastName, role: newRole } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new HttpError(409, "Someone with that email already has a Krakd account.");

  // random unguessable placeholder password; they set their own via the invite link
  const passwordHash = await hashPassword(randomUUID() + randomUUID());
  const user = await prisma.user.create({
    data: { dealershipId, email, firstName, lastName, role: newRole, status: "INVITED", passwordHash },
    select: { id: true, firstName: true },
  });

  const [inviter, dealer] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } }),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true } }),
  ]);
  const token = await signResetToken(user.id);
  void sendTeamInviteEmail({
    to: email, firstName,
    inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}`.trim() : "Your team",
    dealershipName: dealer?.name ?? "your dealership", token,
  }).catch(() => {});

  return json({ id: user.id }, 201);
});
