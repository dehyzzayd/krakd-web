import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyTwilioSignature } from "@/lib/server/calls";
import { toE164 } from "@/lib/server/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const xml = (body: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, { status: 200, headers: { "content-type": "text/xml" } });
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* POST /api/v1/webhooks/twilio/voice?d=<dealershipId> → Twilio Voice webhook for the dealer's
   Krakd tracking number. Answers the inbound call, forwards it to the dealer's real phone, and
   records it (dual channel). When the call ends, Twilio posts the recording to the recording
   webhook, which transcribes it and attaches/creates the lead. Set as the number's VoiceUrl. */
export async function POST(req: NextRequest) {
  const url = req.nextUrl.href;
  const dealershipId = req.nextUrl.searchParams.get("d") || "";
  const form = await req.formData().catch(() => null);
  if (!form || !dealershipId) return xml(`<Response><Say>Sorry, we can't take your call right now.</Say></Response>`);

  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);
  if (!verifyTwilioSignature(url, params, req.headers.get("x-twilio-signature"))) {
    return new Response("Invalid signature", { status: 403 });
  }

  const [ai, dealer] = await Promise.all([
    prisma.aiSettings.findUnique({ where: { dealershipId }, select: { forwardPhone: true } }),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { phone: true, name: true } }),
  ]);
  const target = toE164(ai?.forwardPhone || dealer?.phone || "");
  const name = esc(dealer?.name || "the dealership");

  if (!target) {
    // No forward number set → don't drop the caller silently.
    return xml(`<Response><Say voice="Polly.Joanna">Thanks for calling ${name}. Everyone is busy right now — please leave a message after the tone and we'll call you right back.</Say><Record maxLength="120" playBeep="true" recordingStatusCallback="${esc(base(req))}/api/v1/webhooks/twilio/recording?d=${dealershipId}" recordingStatusCallbackEvent="completed" /></Response>`);
  }

  const callerId = toE164(params.From || "") || undefined; // show the real caller on the dealer's phone
  const recCb = `${base(req)}/api/v1/webhooks/twilio/recording?d=${dealershipId}`;
  return xml(
    `<Response><Dial ${callerId ? `callerId="${callerId}"` : ""} answerOnBridge="true" timeout="25" record="record-from-answer-dual" recordingStatusCallback="${esc(recCb)}" recordingStatusCallbackEvent="completed"><Number>${esc(target)}</Number></Dial></Response>`
  );
}

const base = (req: NextRequest) => process.env.APP_BASE_URL || req.nextUrl.origin;
