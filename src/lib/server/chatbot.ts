import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { normPhone, findDuplicateLead, scoreSpam, nextAssignee, contactKeys } from "./leadPipeline";
import { sendLeadNotification } from "./email";
import { deliverAdf } from "./adfDelivery";
import { pushLeadToIntegrations } from "./integrationDelivery";
import { webConsentRecord } from "@/lib/consent";

/* The website chat widget's brain. A guided, real-data conversation that answers
 * common questions and captures the lead through chat (no form). Structured so an
 * LLM reply generator can slot in at `generateReply` when OPENAI_API_KEY is set. */

type ChatState = { stage?: "intent" | "name" | "contact" | "open"; name?: string; phone?: string; email?: string; interest?: string; leadId?: string; consentDisclosed?: boolean };
type Ctx = { name: string; phone: string | null; addressLine1: string | null; city: string | null; state: string | null; hours: unknown; slug: string | null; creditToken: string | null; origin: string };

const CONSENT_LINE = "By sharing your contact you agree to be contacted by phone, text & email about your enquiry — message/data rates may apply, reply STOP to opt out.";
const firstName = (n?: string) => (n ?? "").trim().split(/\s+/)[0] || "there";

/** Answer a common question from the dealer's real data (never invents specs/prices). */
function faqAnswer(text: string, c: Ctx): string | null {
  const t = text.toLowerCase();
  if (/\b(hours?|open|closed?|what time)\b/.test(t)) {
    const h = Array.isArray(c.hours) ? (c.hours as { day: string; open: string; close: string }[]) : [];
    if (h.length) return "Here are our hours — " + h.map((d) => `${d.day} ${d.open}${d.close ? `–${d.close}` : ""}`).join(", ") + ".";
  }
  if (/(where|address|located|location|directions|find you)/.test(t) && (c.addressLine1 || c.city)) return `We're at ${[c.addressLine1, c.city, c.state].filter(Boolean).join(", ")}.`;
  if (/(call|phone|your number|reach you)/.test(t) && c.phone) return `You can reach us at ${c.phone}.`;
  if (/(financ|credit|loan|apr|pre.?approv|qualif|monthly payment)/.test(t)) return c.creditToken ? `Yes, we offer financing — you can pre-qualify in a couple of minutes here: ${c.origin}/apply/${c.creditToken}` : "Yes, we offer financing — our finance team can walk you through the options.";
  if (/(test drive|see it|come in|appointment|visit|book a)/.test(t)) return c.slug ? `Happy to set that up — you can pick a time here: ${c.origin}/site/${c.slug}/book` : "Happy to set that up — what day works best for you?";
  if (/(price|cost|how much|best deal|discount|offer)/.test(t)) return "I can have someone confirm exact pricing and any current offers for you.";
  return null;
}

async function createChatLead(dealershipId: string, c: Ctx, s: ChatState, ip?: string): Promise<string> {
  const dup = await findDuplicateLead(dealershipId, s.email, s.phone);
  if (dup) {
    await prisma.lead.update({ where: { id: dup.id, dealershipId }, data: { lastActivityAt: new Date() } });
    await prisma.leadActivity.create({ data: { dealershipId, leadId: dup.id, type: "NOTE", actorType: "SYSTEM", content: `Returning via website chat${s.interest ? ` — ${s.interest}` : ""}` } }).catch(() => {});
    return dup.id;
  }
  const [fn, ...rest] = (s.name ?? "Website visitor").trim().split(/\s+/);
  const spam = scoreSpam({ firstName: fn, lastName: rest.join(" "), email: s.email, phone: s.phone, message: s.interest });
  const assignedToId = spam.isSpam ? null : await nextAssignee(dealershipId);
  const consent = { sms: webConsentRecord(ip), email: webConsentRecord(ip) };
  const lead = await prisma.lead.create({
    data: {
      dealershipId, firstName: fn, lastName: rest.join(" ") || null,
      emails: (s.email ? [{ value: s.email, type: "personal" }] : []) as unknown as Prisma.InputJsonValue,
      phones: (s.phone ? [{ value: s.phone, type: "mobile" }] : []) as unknown as Prisma.InputJsonValue,
      ...contactKeys(s.email, s.phone),
      source: "Website chat", temperature: "WARM", isSpam: spam.isSpam,
      ...(assignedToId ? { assignedToId, ownerType: "HUMAN" as const } : { ownerType: "AI" as const }),
      consent: consent as unknown as Prisma.InputJsonValue,
    },
  });
  if (s.interest) await prisma.leadActivity.create({ data: { dealershipId, leadId: lead.id, type: "NOTE", actorType: "SYSTEM", content: `Website chat — interested in: ${s.interest}` } }).catch(() => {});
  if (!spam.isSpam) {
    const dealer = await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true, users: { where: { role: "OWNER" }, select: { email: true }, take: 1 } } });
    const ownerEmail = dealer?.users[0]?.email;
    if (ownerEmail) void sendLeadNotification({ to: ownerEmail, dealershipName: dealer!.name, leadName: `${fn} ${rest.join(" ")}`.trim(), source: "Website chat", vehicle: "—", contact: s.phone ?? s.email ?? "", leadId: lead.id });
    void deliverAdf(dealershipId, lead.id).catch(() => {});
    void pushLeadToIntegrations(dealershipId, lead.id).catch(() => {});
  }
  return lead.id;
}

export async function chatReply(dealershipId: string, conversationId: string | undefined, userText: string, origin: string, ip?: string): Promise<{ conversationId: string; reply: string }> {
  const dealer = await prisma.dealership.findUnique({
    where: { id: dealershipId },
    select: { name: true, phone: true, addressLine1: true, city: true, state: true, hours: true, website: { select: { slug: true } }, creditAppConfig: { select: { publicToken: true } } },
  });
  const c: Ctx = { name: dealer?.name ?? "us", phone: dealer?.phone ?? null, addressLine1: dealer?.addressLine1 ?? null, city: dealer?.city ?? null, state: dealer?.state ?? null, hours: dealer?.hours, slug: dealer?.website?.slug ?? null, creditToken: dealer?.creditAppConfig?.publicToken ?? null, origin };

  let convo = conversationId ? await prisma.aiConversation.findFirst({ where: { id: conversationId, dealershipId } }) : null;
  if (!convo) convo = await prisma.aiConversation.create({ data: { dealershipId, channel: "WEB", status: "ACTIVE", state: { stage: "intent" } as unknown as Prisma.InputJsonValue } });
  const s = (convo.state ?? {}) as ChatState;
  await prisma.aiMessage.create({ data: { conversationId: convo.id, role: "BUYER", content: userText.slice(0, 1000) } }).catch(() => {});

  const faq = faqAnswer(userText, c);
  const lead = (extra?: string) => [faq, extra].filter(Boolean).join(" ");
  let reply: string;
  const stage = s.stage ?? "intent";

  if (stage === "intent") {
    s.interest = userText.slice(0, 300);
    reply = lead("Happy to help with that! Can I grab your name so I can get you looked after?");
    s.stage = "name";
  } else if (stage === "name") {
    s.name = userText.replace(/^(hi|hey|hello|i'?m|it'?s|my name is)\s+/i, "").trim().slice(0, 80) || userText.trim().slice(0, 80);
    reply = lead(`Thanks ${firstName(s.name)}! What's the best phone or email to reach you? ${CONSENT_LINE}`);
    s.stage = "contact"; s.consentDisclosed = true;
  } else if (stage === "contact") {
    const phone = normPhone(userText);
    const email = (userText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [])[0] || null;
    if (!phone && !email) {
      reply = lead("I didn't catch a phone number or email there — what's the best way to reach you?");
    } else {
      s.phone = phone ?? s.phone; s.email = email ?? s.email;
      s.leadId = await createChatLead(dealershipId, c, s, ip);
      await prisma.aiConversation.update({ where: { id: convo.id }, data: { leadId: s.leadId } }).catch(() => {});
      s.stage = "open";
      reply = lead(`Perfect — got it, ${firstName(s.name)}. Someone from ${c.name} will reach out to you shortly. Anything else I can help with in the meantime?`);
    }
  } else {
    reply = faq ?? "Got it — I've passed that to the team and they'll follow up shortly. Anything else I can help you with?";
  }

  await prisma.aiMessage.create({ data: { conversationId: convo.id, role: "AI", content: reply } }).catch(() => {});
  await prisma.aiConversation.update({ where: { id: convo.id }, data: { state: s as unknown as Prisma.InputJsonValue } }).catch(() => {});
  return { conversationId: convo.id, reply };
}
