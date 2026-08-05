import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { normPhone, findDuplicateLead, scoreSpam, nextAssignee, contactKeys } from "./leadPipeline";
import { sendLeadNotification } from "./email";
import { deliverAdf } from "./adfDelivery";
import { pushLeadToIntegrations } from "./integrationDelivery";
import { webConsentRecord } from "@/lib/consent";
import { openAiConfigured } from "./calls";

/* The website chat widget's brain. Two paths, same contract:
 *  • When OPENAI_API_KEY is set → a real conversational agent (agentTurn): grounded
 *    in the dealer's live data + inventory, answers free-form questions, and captures
 *    the lead itself via a `capture_lead` tool call. Guardrailed to never invent facts.
 *  • With no key → a guided, real-data conversation (guidedReply) that answers common
 *    questions and walks the visitor through capture. Both create the lead through the
 *    same dedup / spam / auto-assign pipeline and record TCPA consent. */

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

/* ── Guided (no-LLM) path: deterministic state machine over the dealer's real data ── */
async function guidedReply(dealershipId: string, c: Ctx, s: ChatState, userText: string, ip?: string): Promise<string> {
  const faq = faqAnswer(userText, c);
  const withFaq = (extra?: string) => [faq, extra].filter(Boolean).join(" ");
  const stage = s.stage ?? "intent";
  if (stage === "intent") {
    s.interest = userText.slice(0, 300);
    s.stage = "name";
    return withFaq("Happy to help with that! Can I grab your name so I can get you looked after?");
  }
  if (stage === "name") {
    s.name = userText.replace(/^(hi|hey|hello|i'?m|it'?s|my name is)\s+/i, "").trim().slice(0, 80) || userText.trim().slice(0, 80);
    s.stage = "contact"; s.consentDisclosed = true;
    return withFaq(`Thanks ${firstName(s.name)}! What's the best phone or email to reach you? ${CONSENT_LINE}`);
  }
  if (stage === "contact") {
    const phone = normPhone(userText);
    const email = (userText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [])[0] || null;
    if (!phone && !email) return withFaq("I didn't catch a phone number or email there — what's the best way to reach you?");
    s.phone = phone ?? s.phone; s.email = email ?? s.email;
    s.leadId = await createChatLead(dealershipId, c, s, ip);
    s.stage = "open";
    return withFaq(`Perfect — got it, ${firstName(s.name)}. Someone from ${c.name} will reach out to you shortly. Anything else I can help with in the meantime?`);
  }
  return faq ?? "Got it — I've passed that to the team and they'll follow up shortly. Anything else I can help you with?";
}

/* ── LLM agent path: grounded, tool-calling conversational agent ── */
type AiCfg = { persona: string; houseRules: string | null; financeEnabled: boolean; tradeInEnabled: boolean };

async function inventoryLines(dealershipId: string): Promise<string[]> {
  const vs = await prisma.vehicle.findMany({
    where: { dealershipId, status: "AVAILABLE" },
    orderBy: [{ listedAt: "desc" }, { createdAt: "desc" }],
    take: 40,
    select: { year: true, make: true, model: true, trim: true, priceCents: true, mileage: true, exteriorColor: true },
  });
  return vs.map((v) => {
    const label = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ").trim() || "Vehicle";
    const price = v.priceCents ? `$${Math.round(v.priceCents / 100).toLocaleString("en-US")}` : "call for price";
    const miles = v.mileage ? `${v.mileage.toLocaleString("en-US")} mi` : "";
    return [label, price, miles, v.exteriorColor].filter(Boolean).join(" · ");
  });
}

function buildSystemPrompt(c: Ctx, ai: AiCfg, inv: string[], captured: boolean): string {
  const p: string[] = [];
  p.push(`You are the online sales concierge for ${c.name}, an automotive dealership, chatting with a visitor on the website. Tone: ${ai.persona}. Reply in 1–3 short, natural sentences — like texting, never an essay. Use the visitor's first name once you know it.`);
  p.push(`GROUNDING (critical): only state facts that appear in CONTEXT below. Never invent or guess vehicles, prices, mileage, specs, availability, financing terms, addresses, hours, or links. If it isn't in CONTEXT, say you'll have the team confirm — do not make anything up. Only ever share the exact links in CONTEXT.`);
  if (!ai.financeEnabled) p.push(`Do not discuss financing or pre-qualification.`);
  if (!ai.tradeInEnabled) p.push(`Do not offer trade-in valuations.`);
  if (ai.houseRules?.trim()) p.push(`Dealer house rules (follow strictly): ${ai.houseRules.trim()}`);
  if (captured) {
    p.push(`You already have this visitor's contact details — do NOT ask for them again. Just keep helping.`);
  } else {
    p.push(`GOAL: be genuinely helpful AND capture the lead. Naturally get the visitor's first name, then ask for the best phone or email. The FIRST time you ask for a phone or email, include this sentence verbatim: "${CONSENT_LINE}" As soon as you have a name and either a phone or an email, call the capture_lead function with what you have, then confirm a team member will follow up.`);
  }
  const ctx: string[] = [`Dealership: ${c.name}.`];
  if (c.phone) ctx.push(`Phone: ${c.phone}.`);
  const loc = [c.addressLine1, c.city, c.state].filter(Boolean).join(", ");
  if (loc) ctx.push(`Address: ${loc}.`);
  const h = Array.isArray(c.hours) ? (c.hours as { day: string; open: string; close: string }[]) : [];
  if (h.length) ctx.push(`Hours: ${h.map((d) => `${d.day} ${d.open}${d.close ? `–${d.close}` : ""}`).join(", ")}.`);
  if (ai.financeEnabled && c.creditToken) ctx.push(`Financing pre-qualification link: ${c.origin}/apply/${c.creditToken}`);
  if (c.slug) ctx.push(`Book a visit / test drive link: ${c.origin}/site/${c.slug}/book`);
  ctx.push(inv.length ? `Available inventory (${inv.length} shown):\n- ${inv.join("\n- ")}` : `No vehicles are currently listed as available.`);
  p.push(`\nCONTEXT:\n${ctx.join("\n")}`);
  return p.join("\n\n");
}

async function agentTurn(dealershipId: string, convoId: string, c: Ctx, ai: AiCfg, s: ChatState, ip?: string): Promise<string> {
  const [hist, inv] = await Promise.all([
    prisma.aiMessage.findMany({ where: { conversationId: convoId }, orderBy: { createdAt: "asc" }, take: 24, select: { role: true, content: true } }),
    inventoryLines(dealershipId),
  ]);
  const messages = [
    { role: "system" as const, content: buildSystemPrompt(c, ai, inv, !!s.leadId) },
    ...hist
      .filter((m) => m.role === "BUYER" || m.role === "AI")
      .map((m) => ({ role: (m.role === "BUYER" ? "user" : "assistant") as "user" | "assistant", content: m.content })),
  ];
  const tools = s.leadId ? undefined : [{
    type: "function",
    function: {
      name: "capture_lead",
      description: "Save this visitor as a sales lead. Call as soon as you have their name plus a phone number or email address.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Visitor's name" },
          phone: { type: "string", description: "Phone number, if given" },
          email: { type: "string", description: "Email address, if given" },
          interest: { type: "string", description: "What they're interested in — a vehicle, financing, trade-in, etc." },
        },
        required: ["name"],
      },
    },
  }];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.4, messages, ...(tools ? { tools } : {}) }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const j = await res.json();
  const msg = j?.choices?.[0]?.message;
  let reply = (msg?.content || "").trim();

  const call = msg?.tool_calls?.find?.((t: { function?: { name?: string } }) => t?.function?.name === "capture_lead");
  if (call && !s.leadId) {
    let a: { name?: string; phone?: string; email?: string; interest?: string } = {};
    try { a = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore malformed args */ }
    if (a.name) s.name = String(a.name).slice(0, 80);
    const phone = normPhone(String(a.phone || ""));
    const email = (String(a.email || "").match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [])[0] || null;
    s.phone = phone ?? s.phone; s.email = email ?? s.email;
    if (a.interest) s.interest = String(a.interest).slice(0, 300);
    s.consentDisclosed = true;
    if (s.phone || s.email) {
      s.leadId = await createChatLead(dealershipId, c, s, ip);
      await prisma.aiConversation.update({ where: { id: convoId }, data: { leadId: s.leadId } }).catch(() => {});
    }
    if (!reply) reply = `Perfect — thanks ${firstName(s.name)}! Someone from ${c.name} will reach out shortly. Anything else I can help with in the meantime?`;
  }
  if (!reply) reply = "Happy to help — could you tell me a little more about what you're after?";
  return reply.slice(0, 1500);
}

export async function chatReply(dealershipId: string, conversationId: string | undefined, userText: string, origin: string, ip?: string): Promise<{ conversationId: string; reply: string }> {
  const dealer = await prisma.dealership.findUnique({
    where: { id: dealershipId },
    select: { name: true, phone: true, addressLine1: true, city: true, state: true, hours: true, website: { select: { slug: true } }, creditAppConfig: { select: { publicToken: true } }, aiSettings: { select: { persona: true, houseRules: true, financeEnabled: true, tradeInEnabled: true } } },
  });
  const c: Ctx = { name: dealer?.name ?? "us", phone: dealer?.phone ?? null, addressLine1: dealer?.addressLine1 ?? null, city: dealer?.city ?? null, state: dealer?.state ?? null, hours: dealer?.hours, slug: dealer?.website?.slug ?? null, creditToken: dealer?.creditAppConfig?.publicToken ?? null, origin };
  const ai: AiCfg = {
    persona: dealer?.aiSettings?.persona ?? "Warm & professional",
    houseRules: dealer?.aiSettings?.houseRules ?? null,
    financeEnabled: dealer?.aiSettings?.financeEnabled ?? true,
    tradeInEnabled: dealer?.aiSettings?.tradeInEnabled ?? true,
  };

  let convo = conversationId ? await prisma.aiConversation.findFirst({ where: { id: conversationId, dealershipId } }) : null;
  if (!convo) convo = await prisma.aiConversation.create({ data: { dealershipId, channel: "WEB", status: "ACTIVE", state: { stage: "intent" } as unknown as Prisma.InputJsonValue } });
  const s = (convo.state ?? {}) as ChatState;
  await prisma.aiMessage.create({ data: { conversationId: convo.id, role: "BUYER", content: userText.slice(0, 1000) } }).catch(() => {});

  let reply: string;
  if (openAiConfigured()) {
    try { reply = await agentTurn(dealershipId, convo.id, c, ai, s, ip); }
    catch { reply = await guidedReply(dealershipId, c, s, userText, ip); } // graceful fallback if the LLM call fails
  } else {
    reply = await guidedReply(dealershipId, c, s, userText, ip);
  }

  await prisma.aiMessage.create({ data: { conversationId: convo.id, role: "AI", content: reply } }).catch(() => {});
  await prisma.aiConversation.update({ where: { id: convo.id }, data: { state: s as unknown as Prisma.InputJsonValue, ...(s.leadId ? { leadId: s.leadId } : {}) } }).catch(() => {});
  return { conversationId: convo.id, reply };
}
