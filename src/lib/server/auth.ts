import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { HttpError } from "./http";

export type Principal = { userId: string; dealershipId: string; role: string; email: string };

const enc = new TextEncoder();
const accessSecret = () => enc.encode(process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me");
const refreshSecret = () => enc.encode(process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function issueTokens(p: Principal) {
  const accessToken = await new SignJWT({ did: p.dealershipId, role: p.role, email: p.email })
    .setProtectedHeader({ alg: "HS256" }).setSubject(p.userId).setIssuedAt().setExpirationTime("15m").sign(accessSecret());
  const refreshToken = await new SignJWT({ did: p.dealershipId, role: p.role, email: p.email })
    .setProtectedHeader({ alg: "HS256" }).setSubject(p.userId).setIssuedAt().setExpirationTime("30d").sign(refreshSecret());
  return { accessToken, refreshToken, tokenType: "Bearer" };
}

export async function signOtp(email: string, code: string) {
  return new SignJWT({ email, code, purpose: "otp" })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").sign(refreshSecret());
}

export async function verifyOtp(token: string): Promise<{ email: string; code: string } | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret());
    if (payload.purpose !== "otp") return null;
    return { email: payload.email as string, code: payload.code as string };
  } catch {
    return null;
  }
}

export async function signResetToken(userId: string) {
  return new SignJWT({ purpose: "pwreset" })
    .setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("30m").sign(refreshSecret());
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret());
    return payload.purpose === "pwreset" ? (payload.sub as string) : null;
  } catch {
    return null;
  }
}

export async function verifyAccess(token: string): Promise<Principal | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    return { userId: payload.sub as string, dealershipId: payload.did as string, role: payload.role as string, email: payload.email as string };
  } catch {
    return null;
  }
}

/** Reads the bearer token and returns the trusted principal, or throws 401. */
export async function requireAuth(req: Request): Promise<Principal> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const principal = token ? await verifyAccess(token) : null;
  if (!principal) throw new HttpError(401, "Unauthorized");
  return principal;
}
