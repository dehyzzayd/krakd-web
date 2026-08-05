import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyTwilioSignature, submitTranscription } from "@/lib/server/calls";
import { normPhone } from "@/lib/server/leadPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/webhooks/twilio/recording?d=<dealershipId> → Twilio recording-status callback.
   Verifies the Twilio signature, records the Call, matches a lead by phone, and kicks off
   transcription. Point Twilio's recordingStatusCallback at this URL (with ?d=) at launch. */
export async function POST(req: NextRequest) {
  const url = req.nextUrl.href;
  const dealershipId = req.nextUrl.searchParams.get("d") || "";
  const form = await req.formData().catch(() => null);
  if (!form || !dealershipId) return new Response("Bad request", { status: 400 });

  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);
  if (!verifyTwilioSignature(url, params, req.headers.get("x-twilio-signature"))) {
    return new Response("Invalid signature", { status: 403 });
  }

  const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { id: true } });
  if (!dealer) return new Response("Unknown dealership", { status: 404 });

  const sid = params.CallSid || null;
  const recordingUrl = params.RecordingUrl ? `${params.RecordingUrl}.mp3` : null;
  const from = params.From || null, to = params.To || null;
  const direction = (params.Direction || "").includes("outbound") ? "outbound" : "inbound";

  // match a lead by either party's phone
  const customer = normPhone(direction === "inbound" ? from : to) || normPhone(direction === "inbound" ? to : from);
  const lead = customer ? await prisma.lead.findFirst({ where: { dealershipId, primaryPhone: customer }, select: { id: true } }) : null;

  const durationSec = parseInt(params.RecordingDuration || "0") || 0;
  const existing = sid ? await prisma.call.findFirst({ where: { provider: sid, dealershipId }, select: { id: true } }) : null;
  const call = existing
    ? await prisma.call.update({ where: { id: existing.id }, data: { recordingUrl, durationSec, status: params.CallStatus || "completed" } })
    : await prisma.call.create({ data: { dealershipId, leadId: lead?.id ?? null, direction, fromNumber: from, toNumber: to, status: params.CallStatus || "completed", durationSec, recordingUrl, provider: sid } });

  if (recordingUrl) void submitTranscription(call.id).catch(() => {});
  if (lead?.id && !existing) void prisma.leadActivity.create({ data: { dealershipId, leadId: lead.id, type: "CALL", actorType: "SYSTEM", content: `Call recorded (${durationSec}s)` } }).catch(() => {});

  return new Response("OK", { status: 200 });
}
