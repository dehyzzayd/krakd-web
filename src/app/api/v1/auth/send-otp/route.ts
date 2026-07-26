import { NextRequest } from "next/server";
import { z } from "zod";
import { signOtp } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { sendOtpEmail } from "@/lib/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export const POST = route(async (req: NextRequest) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "A valid email is required");
  const email = parsed.data.email.toLowerCase();

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const token = await signOtp(email, code);
  await sendOtpEmail({ to: email, code });

  // secure only over real HTTPS — so http://localhost works even under `next start`
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const res = json({ ok: true });
  res.cookies.set("krakd_otp", token, {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
});
