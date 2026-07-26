import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signResetToken } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { sendPasswordResetEmail } from "@/lib/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export const POST = route(async (req: NextRequest) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "A valid email is required");
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await signResetToken(user.id);
    await sendPasswordResetEmail({ to: user.email, firstName: user.firstName, token });
  }
  // Always ok — never reveal whether an account exists.
  return json({ ok: true });
});
