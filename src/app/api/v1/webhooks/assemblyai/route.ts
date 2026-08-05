import { NextRequest } from "next/server";
import { handleTranscriptComplete } from "@/lib/server/calls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/webhooks/assemblyai?call=<id>&token=<secret> → transcript-complete callback. */
export async function POST(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get("call") || "";
  const token = req.nextUrl.searchParams.get("token") || "";
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) return new Response("Unauthorized", { status: 401 });
  if (!callId) return new Response("Bad request", { status: 400 });

  const body = await req.json().catch(() => null) as { transcript_id?: string; status?: string } | null;
  if (body?.status === "completed" && body.transcript_id) {
    await handleTranscriptComplete(callId, body.transcript_id).catch(() => {});
  }
  return Response.json({ received: true }, { status: 200 });
}
