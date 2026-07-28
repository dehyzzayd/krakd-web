import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, issueTokens } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { sendWelcomeEmail } from "@/lib/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  dealershipName: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  accessCode: z.string().optional(),
});

export const POST = route(async (req: NextRequest) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const dto = parsed.data;

  // Krakd is invite-only. Signup requires a valid access code (server-validated; never shipped to the client).
  const required = (process.env.SIGNUP_ACCESS_CODE ?? "BETAACCESS").trim().toUpperCase();
  if ((dto.accessCode ?? "").trim().toUpperCase() !== required) {
    throw new HttpError(403, "Krakd is invite-only. A valid access code is required to sign up.");
  }

  const email = dto.email.toLowerCase();

  if (await prisma.user.findUnique({ where: { email } })) {
    throw new HttpError(409, "Email already registered");
  }

  const passwordHash = await hashPassword(dto.password);
  const user = await prisma.$transaction(async (tx) => {
    const dealership = await tx.dealership.create({
      data: {
        name: dto.dealershipName,
        phone: dto.phone,
        email,
        subscription: { create: { priceCents: 14900, status: "ACTIVE" } },
        aiSettings: { create: {} },
      },
    });
    return tx.user.create({
      data: { dealershipId: dealership.id, email, passwordHash, firstName: dto.firstName, lastName: dto.lastName, role: "OWNER" },
    });
  });

  const tokens = await issueTokens({ userId: user.id, dealershipId: user.dealershipId, role: user.role, email: user.email });
  await sendWelcomeEmail({
    to: email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    dealershipName: dto.dealershipName,
    email,
    customerId: `KRK-${user.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    priceLabel: "$149.00/mo",
  });
  return json(tokens);
});
