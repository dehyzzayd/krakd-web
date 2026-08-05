import crypto from "crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/* Call transcription + analysis. Env-gated and webhook-driven (no blocking polls):
 *   Twilio Voice records → recording webhook → AssemblyAI transcript job (with a
 *   completion webhook) → OpenAI structured analysis. Activates when
 *   ASSEMBLYAI_API_KEY / OPENAI_API_KEY (and Twilio) are set. */

export const assemblyConfigured = () => !!process.env.ASSEMBLYAI_API_KEY;
export const openAiConfigured = () => !!process.env.OPENAI_API_KEY;
const base = () => process.env.APP_BASE_URL || "http://localhost:3000";

/** Verify a Twilio webhook signature (HMAC-SHA1 of URL + sorted params). Fails open
 *  in dev when no auth token is set (telephony isn't wired), closed otherwise. */
export function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string | null): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return true;
  if (!signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = crypto.createHmac("sha1", token).update(Buffer.from(data, "utf-8")).digest("base64");
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch { return false; }
}

/** Submit a call's recording to AssemblyAI (webhook completion → handleTranscriptComplete). */
export async function submitTranscription(callId: string): Promise<{ submitted: boolean; reason?: string }> {
  const call = await prisma.call.findUnique({ where: { id: callId }, select: { id: true, recordingUrl: true } });
  if (!call?.recordingUrl) return { submitted: false, reason: "No recording on this call." };
  if (!assemblyConfigured()) return { submitted: false, reason: "Transcription isn't connected yet." };

  const token = process.env.CRON_SECRET || "dev";
  const webhookUrl = `${base()}/api/v1/webhooks/assemblyai?call=${call.id}&token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY!, "content-type": "application/json" },
      body: JSON.stringify({ audio_url: call.recordingUrl, webhook_url: webhookUrl, speaker_labels: true }),
    });
    if (!res.ok) return { submitted: false, reason: "Transcription service rejected the recording." };
    const j = await res.json().catch(() => null);
    await prisma.call.update({ where: { id: call.id }, data: { externalRef: j?.id ?? null, transcriptStatus: "processing" } });
    return { submitted: true };
  } catch { return { submitted: false, reason: "Could not submit for transcription." }; }
}

/** AssemblyAI webhook fired → pull the finished transcript, store it, then analyze. */
export async function handleTranscriptComplete(callId: string, transcriptId: string): Promise<void> {
  if (!assemblyConfigured()) return;
  const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, { headers: { authorization: process.env.ASSEMBLYAI_API_KEY! } }).catch(() => null);
  const j = res && res.ok ? await res.json().catch(() => null) : null;
  if (!j || j.status !== "completed") { await prisma.call.update({ where: { id: callId }, data: { transcriptStatus: "failed" } }).catch(() => {}); return; }
  await prisma.call.update({ where: { id: callId }, data: { transcript: j.text ?? "", transcriptStatus: "done" } }).catch(() => {});
  await analyzeCall(callId).catch(() => {});
}

/** OpenAI structured analysis of the transcript (env-gated). */
export async function analyzeCall(callId: string): Promise<void> {
  if (!openAiConfigured()) return;
  const call = await prisma.call.findUnique({ where: { id: callId }, select: { transcript: true } });
  if (!call?.transcript) return;
  const system = "You analyze a car-dealership sales call transcript. Return STRICT JSON only, with keys: summary (2-3 sentences), preferences (string), financial (string), needs (string), nextSteps (array of short strings). No text outside the JSON.";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: call.transcript.slice(0, 12000) }] }),
    });
    if (!res.ok) return;
    const j = await res.json().catch(() => null);
    const content = j?.choices?.[0]?.message?.content;
    const analysis = content ? JSON.parse(content) : null;
    if (analysis) await prisma.call.update({ where: { id: callId }, data: { analysis: analysis as Prisma.InputJsonValue } });
  } catch { /* ignore */ }
}
