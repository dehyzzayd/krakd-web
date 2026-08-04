/** Communication consent — TCPA (SMS) + CAN-SPAM (email) audit trail.
 *  A consent record is only meaningful if it's auditable: we store the exact
 *  disclosure the person agreed to, when, from where, and who captured it. */

export type ConsentChannel = "sms" | "email";
export type ConsentStatus = "granted" | "revoked";
export type ConsentSource = "web_form" | "dealer_attested" | "import";

export type ChannelConsent = {
  status: ConsentStatus;
  at: string;                 // ISO timestamp of capture
  source: ConsentSource;
  disclosure: string;         // exact language the person agreed to
  capturedBy: string;         // "customer" (web) or the user id who attested
  ip?: string;                // for web captures
  method?: string;            // dealer-attested: "Signed buyer's order", "Verbal at desk", etc.
  note?: string;
};

export type ConsentRecord = Partial<Record<ConsentChannel, ChannelConsent>>;

/** The disclosure a customer agrees to on a public web form (TCPA-compliant express consent). */
export const WEB_CONSENT_DISCLOSURE =
  "By checking this box I give my express written consent to be contacted by this business and its agents at the phone number and email I provided, including by autodialed and prerecorded calls, text messages, and email, for marketing and servicing purposes. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to opt out of texts at any time.";

/** How a dealer can attest they obtained consent offline. */
export const ATTESTATION_METHODS = [
  "Signed buyer's order / consent form",
  "Verbal consent at the desk",
  "Opted in by text (replied START/YES)",
  "Existing customer relationship",
  "Web form (double opt-in)",
];

export function hasConsent(consent: unknown, channel: ConsentChannel): boolean {
  const c = (consent && typeof consent === "object" ? (consent as ConsentRecord)[channel] : undefined);
  return c?.status === "granted";
}

/** Build a consent record captured from a customer submitting a public web form. */
export function webConsentRecord(ip?: string): ChannelConsent {
  return { status: "granted", at: new Date().toISOString(), source: "web_form", disclosure: WEB_CONSENT_DISCLOSURE, capturedBy: "customer", ip };
}
