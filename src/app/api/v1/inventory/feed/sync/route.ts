import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { runFeedSync } from "@/lib/server/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // feed download + upsert can take a bit

/* POST /api/v1/inventory/feed/sync → pull the feed now and upsert inventory */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  try {
    const result = await runFeedSync(dealershipId);
    return json({ ok: true, ...result });
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : "Sync failed — check the connection details.");
  }
});
