import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ code: z.string().length(6) });

export const POST = route(async (req: NextRequest) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "Enter the 6-digit code");

  const token = req.cookies.get("krakd_otp")?.value;
  const payload = token ? await verifyOtp(token) : null;
  if (!payload) throw new HttpError(400, "Your code expired — request a new one");
  if (payload.code !== parsed.data.code) throw new HttpError(400, "That code isn't right");

  const res = json({ ok: true });
  res.cookies.delete("krakd_otp");
  return res;
});
