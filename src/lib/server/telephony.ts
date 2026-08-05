import "server-only";
import { prisma } from "@/lib/db";

/* Call-tracking numbers — env-gated. Provisions a real Twilio number per dealer whose
 * inbound voice webhook forwards to the dealer's phone while recording, so every call
 * placed to the number on their site/ads is intercepted, recorded, transcribed, and
 * turned into a lead. Activates when TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN are set. */

const sid = () => process.env.TWILIO_ACCOUNT_SID;
const token = () => process.env.TWILIO_AUTH_TOKEN;
const base = () => process.env.APP_BASE_URL || "http://localhost:3000";

export const twilioConfigured = () => !!(sid() && token());

const authHeader = () => `Basic ${Buffer.from(`${sid()}:${token()}`).toString("base64")}`;
const voiceUrlFor = (dealershipId: string) => `${base()}/api/v1/webhooks/twilio/voice?d=${dealershipId}`;

export type ProvisionResult = { ok: true; number: string } | { ok: false; reason: string };

/** Buy a US tracking number wired to this dealer's voice webhook, and store it on AiSettings. */
export async function provisionTrackingNumber(dealershipId: string, areaCode?: string): Promise<ProvisionResult> {
  if (!twilioConfigured()) return { ok: false, reason: "Telephony isn't connected yet — set the Twilio keys to enable call tracking." };

  // don't double-buy
  const current = await prisma.aiSettings.findUnique({ where: { dealershipId }, select: { aiPhone: true, aiPhoneSid: true } });
  if (current?.aiPhone && current.aiPhoneSid) return { ok: true, number: current.aiPhone };

  const acct = sid()!;
  try {
    // 1) find an available voice-capable local number
    const searchQs = new URLSearchParams({ VoiceEnabled: "true", SmsEnabled: "true", ...(areaCode ? { AreaCode: areaCode.replace(/\D/g, "").slice(0, 3) } : {}) });
    const avail = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${acct}/AvailablePhoneNumbers/US/Local.json?${searchQs}`, { headers: { Authorization: authHeader() } });
    if (!avail.ok) return { ok: false, reason: "Couldn't search for a number right now." };
    const list = (await avail.json().catch(() => null)) as { available_phone_numbers?: { phone_number: string }[] } | null;
    const pick = list?.available_phone_numbers?.[0]?.phone_number;
    if (!pick) return { ok: false, reason: areaCode ? `No numbers available in area code ${areaCode}.` : "No numbers available right now." };

    // 2) buy it and point its voice webhook at us
    const buy = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${acct}/IncomingPhoneNumbers.json`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ PhoneNumber: pick, VoiceUrl: voiceUrlFor(dealershipId), VoiceMethod: "POST", FriendlyName: `Krakd tracking — ${dealershipId}` }).toString(),
    });
    if (!buy.ok) {
      const detail = (await buy.json().catch(() => null)) as { message?: string } | null;
      return { ok: false, reason: detail?.message || "Couldn't provision that number." };
    }
    const bought = (await buy.json()) as { sid: string; phone_number: string };
    await prisma.aiSettings.upsert({ where: { dealershipId }, create: { dealershipId, aiPhone: bought.phone_number, aiPhoneSid: bought.sid }, update: { aiPhone: bought.phone_number, aiPhoneSid: bought.sid } });
    return { ok: true, number: bought.phone_number };
  } catch {
    return { ok: false, reason: "Couldn't reach the telephony provider." };
  }
}

/** Release the dealer's tracking number back to Twilio and clear it. */
export async function releaseTrackingNumber(dealershipId: string): Promise<{ ok: boolean }> {
  const s = await prisma.aiSettings.findUnique({ where: { dealershipId }, select: { aiPhoneSid: true } });
  if (twilioConfigured() && s?.aiPhoneSid) {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid()}/IncomingPhoneNumbers/${s.aiPhoneSid}.json`, { method: "DELETE", headers: { Authorization: authHeader() } }).catch(() => {});
  }
  await prisma.aiSettings.update({ where: { dealershipId }, data: { aiPhone: null, aiPhoneSid: null } }).catch(() => {});
  return { ok: true };
}
