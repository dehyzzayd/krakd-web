import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { runFeedSync } from "@/lib/server/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* GET /api/v1/cron/feed-sync → runs every dealer's FTP inventory feed (daily via Vercel Cron).
   Protected by CRON_SECRET (Authorization: Bearer <secret>) when set. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authed = req.headers.get("authorization") === `Bearer ${secret}` || !!req.headers.get("x-vercel-cron");
  if (secret && !authed) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const dealers = await prisma.dealership.findMany({
    where: { feedConfig: { path: ["enabled"], equals: true } },
    select: { id: true, name: true },
  });

  const results: { dealer: string; ok: boolean; detail: string }[] = [];
  for (const d of dealers) {
    try {
      const r = await runFeedSync(d.id);
      results.push({ dealer: d.name, ok: true, detail: `${r.created} added, ${r.updated} updated, ${r.skipped} skipped` });
    } catch (e) {
      results.push({ dealer: d.name, ok: false, detail: e instanceof Error ? e.message : "failed" });
    }
  }
  return Response.json({ ran: dealers.length, results });
}
