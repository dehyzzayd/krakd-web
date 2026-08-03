import "server-only";

/* Twilio SMS — env-gated. Wires up the moment these three are set in the environment:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (an SMS-capable number, E.164).
 * Until then sendSms() is a no-op that reports why, so the UI can stay honest. */

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM;

// Testing safety net: if set, route EVERY text to this one number (never set in production).
const override = process.env.SMS_TEST_OVERRIDE;

export const smsConfigured = () => !!(sid && token && fromNumber);

/** E.164-normalize a US-style number. Returns null if it can't be made a plausible number. */
export function toE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export type SmsResult = { sent: boolean; reason?: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!smsConfigured()) return { sent: false, reason: "SMS not connected" };
  const dest = toE164(override || to);
  if (!dest) return { sent: false, reason: "Invalid phone number" };

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: dest, From: fromNumber!, Body: body }).toString(),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      const msg = (detail as { message?: string } | null)?.message;
      console.warn(`twilio error to ${dest}: ${res.status} ${msg ?? ""}`);
      return { sent: false, reason: msg || `Carrier rejected (${res.status})` };
    }
    return { sent: true };
  } catch (e) {
    console.error("sms failed:", e);
    return { sent: false, reason: "Send failed" };
  }
}
