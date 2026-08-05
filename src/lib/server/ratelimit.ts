import { prisma } from "@/lib/db";

/** DB-backed fixed-window rate limiter — works across serverless instances (no Redis).
 *  Returns { ok:false, retryAfter } when the caller has exceeded `limit` in `windowSec`. */
export async function rateLimit(scope: string, ip: string, limit: number, windowSec: number): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSec) * windowSec;
  const id = `${scope}:${ip}:${windowStart}`;
  const expiresAt = new Date((windowStart + windowSec) * 1000);
  try {
    const row = await prisma.rateLimit.upsert({
      where: { id },
      create: { id, count: 1, expiresAt },
      update: { count: { increment: 1 } },
    });
    // opportunistic cleanup of stale windows (~2% of calls)
    if (Math.random() < 0.02) void prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
    return { ok: row.count <= limit, retryAfter: (windowStart + windowSec) - now };
  } catch {
    return { ok: true, retryAfter: 0 }; // fail open — never block a real customer on limiter error
  }
}

export const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
