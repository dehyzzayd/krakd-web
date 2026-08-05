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
type VehicleInfo = { label: string; mileage: number; priceCents: number; exteriorColor: string | null; interiorColor: string | null; trim: string | null; vin: string | null; stockNumber: string | null; drivetrain: string | null; fuel: string | null; transmission: string | null };
type Ctx = { name: string; phone: string | null; addressLine1: string | null; city: string | null; state: string | null; hours: unknown; slug: string | null; creditToken: string | null; origin: string; current: VehicleInfo | null };

const firstName = (n?: string) => (n ?? "").trim().split(/\s+/)[0] || "there";
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString("en-US")}`;

/** Full, factual one-liner about a specific unit — only from stored fields, nothing invented. */
function describeVehicle(v: VehicleInfo): string {
  const bits: string[] = [v.label];
  if (v.priceCents) bits.push(`priced ${money(v.priceCents)}`);
  bits.push(v.mileage ? `${v.mileage.toLocaleString("en-US")} miles` : "mileage not listed");
  if (v.exteriorColor) bits.push(`${v.exteriorColor} exterior`);
  if (v.interiorColor) bits.push(`${v.interiorColor} interior`);
  if (v.transmission) bits.push(v.transmission);
  if (v.drivetrain) bits.push(v.drivetrain);
  if (v.fuel) bits.push(v.fuel);
  if (v.stockNumber) bits.push(`stock #${v.stockNumber}`);
  if (v.vin) bits.push(`VIN ${v.vin}`);
  return bits.join(", ");
}

/** Answer a common question from the dealer's real data (never invents specs/prices). */
function faqAnswer(text: string, c: Ctx): string | null {
  const t = text.toLowerCase();
  const v = c.current;
  // ── questions about the specific unit the visitor is viewing (real DB values only) ──
  if (v) {
    if (/\b(mileage|miles|odometer|kilomet|\bkms?\b)\b/.test(t)) return v.mileage ? `The ${v.label} has ${v.mileage.toLocaleString("en-US")} miles on it.` : `The mileage on the ${v.label} isn't listed — I can have the team confirm it for you.`;
    if (/\b(price|cost|how much|asking|msrp)\b/.test(t)) return v.priceCents ? `The ${v.label} is listed at ${money(v.priceCents)}.` : `I don't have a price posted on the ${v.label} — I can have someone confirm it.`;
    if (/\bcolou?r\b/.test(t)) { const parts = [v.exteriorColor && `${v.exteriorColor} on the outside`, v.interiorColor && `${v.interiorColor} inside`].filter(Boolean); return parts.length ? `The ${v.label} is ${parts.join(", ")}.` : `The color isn't listed on the ${v.label} — I can check for you.`; }
    if (/\bvin\b/.test(t)) return v.vin ? `The VIN for the ${v.label} is ${v.vin}.` : `The VIN isn't posted here — I can have the team send it over.`;
    if (/\bstock\b/.test(t)) return v.stockNumber ? `That's stock #${v.stockNumber}.` : `I don't have a stock number on this one handy — I can grab it for you.`;
    if (/\b(transmission|drivetrain|awd|4wd|fwd|rwd|fuel|gas|diesel|electric|hybrid|automatic|manual)\b/.test(t)) { const specs = [v.transmission, v.drivetrain, v.fuel].filter(Boolean).join(", "); return specs ? `The ${v.label} is ${specs}.` : `I don't have those details listed on the ${v.label} — I can have the team confirm.`; }
  } else if (/\b(mileage|miles|odometer|vin|stock number|what colou?r)\b/.test(t)) {
    return "Which vehicle are you asking about? If you tell me the year/make/model I can pull up the details.";
  }
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
    return withFaq("Happy to help you out. Who am I chatting with?");
  }
  if (stage === "name") {
    s.name = userText.replace(/^(hi|hey|hello|i'?m|it'?s|my name is)\s+/i, "").trim().slice(0, 80) || userText.trim().slice(0, 80);
    s.stage = "contact";
    return withFaq(`Great to meet you, ${firstName(s.name)}. What's the best number or email to reach you? I'll make sure someone looks after you personally.`);
  }
  if (stage === "contact") {
    const phone = normPhone(userText);
    const email = (userText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [])[0] || null;
    if (!phone && !email) return withFaq("Sorry — I didn't quite catch a number or email in there. What's the best way to get hold of you?");
    s.phone = phone ?? s.phone; s.email = email ?? s.email;
    s.leadId = await createChatLead(dealershipId, c, s, ip);
    s.stage = "open";
    return withFaq(`Perfect, thanks ${firstName(s.name)} — I'll have someone from ${c.name} reach out to you really soon. Anything else you're curious about while you're here?`);
  }
  return faq ?? "Good question — let me get the exact answer from the team and we'll get right back to you. Anything else on your mind?";
}

/* ── LLM agent path: grounded, tool-calling conversational agent ── */
type AiCfg = { persona: string; houseRules: string | null; financeEnabled: boolean; tradeInEnabled: boolean };

async function inventoryLines(dealershipId: string): Promise<string[]> {
  const vs = await prisma.vehicle.findMany({
    where: { dealershipId, status: "AVAILABLE" },
    orderBy: [{ listedAt: "desc" }, { createdAt: "desc" }],
    take: 40,
    select: { year: true, make: true, model: true, trim: true, priceCents: true, mileage: true, exteriorColor: true, drivetrain: true, fuel: true, transmission: true, stockNumber: true },
  });
  return vs.map((v) => {
    const label = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ").trim() || "Vehicle";
    const price = v.priceCents ? money(v.priceCents) : "call for price";
    const miles = v.mileage ? `${v.mileage.toLocaleString("en-US")} mi` : "";
    const specs = [v.exteriorColor, v.transmission, v.drivetrain, v.fuel].filter(Boolean).join(" · ");
    return [label, price, miles, specs, v.stockNumber ? `stk ${v.stockNumber}` : ""].filter(Boolean).join(" · ");
  });
}

function buildSystemPrompt(c: Ctx, ai: AiCfg, inv: string[], captured: boolean): string {
  const p: string[] = [];

  p.push(`You are a real member of the sales team at ${c.name}, an automotive dealership, chatting with a visitor on the website right now. You are warm, sharp, and genuinely likeable — a top salesperson people actually enjoy talking to. Personality to lean into: ${ai.persona}.`);

  p.push(`HOW YOU TALK — this is everything:
• Text like a real person messaging from their phone. Short. 1–2 sentences, sometimes just a few words. Never a paragraph, never an essay.
• Use contractions, everyday words, a relaxed rhythm. A single emoji occasionally is fine when it fits — never more than one, and not every message.
• Match the visitor's energy and length. If they're brief, you're brief. If they're excited, get excited with them. Mirror the words they use.
• Sound human, not scripted. Vary how you phrase things. React naturally ("oh nice choice", "yeah that one's sharp", "totally get that").
• NEVER do these robot tells: "How may I assist you", "I'm here to help", "Is there anything else I can help you with?", "Feel free to", "As an AI", "I'd be happy to assist", numbered or bulleted lists, restating their question back, corporate filler, or over-apologizing. If you catch yourself about to sound like a help desk, rewrite it the way a person would text it.`);

  p.push(`HOW YOU SELL — you're a closer, not an FAQ bot:
• Your #1 job is to get them onto the lot for a visit or test drive — that's where cars get sold. Every conversation gently moves toward "come see it" or "let's set a time".
• Build a little rapport before you push anything. Ask ONE easy question at a time — what they'll be using it for, their timeline, whether they've got something to trade, what they're driving now.
• Answer their question, then always take the lead with a small next step ("want to swing by this week and take it out?").
• Read the room: if they're just browsing, zero pressure — be the helpful friend and plant a seed. If they're hot, guide them to the finish line.
• Only create urgency when it's real (a genuinely popular or one-of-a-kind unit). Never fabricate scarcity or pressure.`);

  p.push(`GROUNDING (never break this): only state facts that appear in CONTEXT below. Never invent or guess a vehicle, price, mileage, spec, availability, payment, rate, address, hour, or link. If you don't have it, don't make it up — say you'll get the exact answer from the team, and use that as a natural reason to grab their contact so someone can follow up. Only ever share the exact links in CONTEXT.`);

  if (!ai.financeEnabled) p.push(`Do not bring up financing or pre-qualification.`);
  if (!ai.tradeInEnabled) p.push(`Do not offer trade-in valuations.`);
  if (ai.houseRules?.trim()) p.push(`House rules from the dealership (follow these strictly): ${ai.houseRules.trim()}`);

  p.push(`IF THEY ASK WHETHER YOU'RE A BOT OR A REAL PERSON: stay natural and don't announce that you're an AI out of the blue. You genuinely are part of the ${c.name} team. If someone asks directly and seriously, be honest and offer to connect them with a salesperson right away — never lie if pressed.`);

  if (captured) {
    p.push(`You already have this visitor's contact info — do NOT ask for it again. Just keep being helpful and keep nudging toward a visit.`);
  } else {
    p.push(`CAPTURING THEM (do it smoothly, never like a form): get their first name early and casually ("who am I chatting with?"). Then earn their number or email by offering something worth it — sending more photos, holding the vehicle for them, texting a quick out-the-door number, or locking in a time to come see it. The moment you have a name plus a phone or email, quietly call the capture_lead function with whatever you've got, then keep the conversation going naturally. Never demand contact up front and never read out legal or consent text.`);
  }
  const ctx: string[] = [`Dealership: ${c.name}.`];
  if (c.current) ctx.push(`The visitor is CURRENTLY VIEWING this exact unit — when they say "this", "this one", "this unit", "it", or "the price/mileage" without naming a vehicle, they mean THIS one: ${describeVehicle(c.current)}. Answer questions about it from these details only.`);
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
    // higher temp + penalties → warmer, more human phrasing that doesn't repeat itself
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.75, frequency_penalty: 0.4, presence_penalty: 0.3, messages, ...(tools ? { tools } : {}) }),
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

export async function chatReply(dealershipId: string, conversationId: string | undefined, userText: string, origin: string, ip?: string, vehicleId?: string): Promise<{ conversationId: string; reply: string }> {
  const [dealer, veh] = await Promise.all([
    prisma.dealership.findUnique({
      where: { id: dealershipId },
      select: { name: true, phone: true, addressLine1: true, city: true, state: true, hours: true, website: { select: { slug: true } }, creditAppConfig: { select: { publicToken: true } }, aiSettings: { select: { persona: true, houseRules: true, financeEnabled: true, tradeInEnabled: true } } },
    }),
    vehicleId
      ? prisma.vehicle.findFirst({ where: { id: vehicleId, dealershipId }, select: { year: true, make: true, model: true, trim: true, mileage: true, priceCents: true, exteriorColor: true, interiorColor: true, vin: true, stockNumber: true, drivetrain: true, fuel: true, transmission: true } })
      : Promise.resolve(null),
  ]);
  const current: VehicleInfo | null = veh
    ? { label: [veh.year, veh.make, veh.model, veh.trim].filter(Boolean).join(" ").trim() || "this vehicle", mileage: veh.mileage, priceCents: veh.priceCents, exteriorColor: veh.exteriorColor, interiorColor: veh.interiorColor, trim: veh.trim, vin: veh.vin, stockNumber: veh.stockNumber, drivetrain: veh.drivetrain, fuel: veh.fuel, transmission: veh.transmission }
    : null;
  const c: Ctx = { name: dealer?.name ?? "us", phone: dealer?.phone ?? null, addressLine1: dealer?.addressLine1 ?? null, city: dealer?.city ?? null, state: dealer?.state ?? null, hours: dealer?.hours, slug: dealer?.website?.slug ?? null, creditToken: dealer?.creditAppConfig?.publicToken ?? null, origin, current };
  const ai: AiCfg = {
    persona: dealer?.aiSettings?.persona ?? "Warm & professional",
    houseRules: dealer?.aiSettings?.houseRules ?? null,
    financeEnabled: dealer?.aiSettings?.financeEnabled ?? true,
    tradeInEnabled: dealer?.aiSettings?.tradeInEnabled ?? true,
  };

  let convo = conversationId ? await prisma.aiConversation.findFirst({ where: { id: conversationId, dealershipId } }) : null;
  if (!convo) convo = await prisma.aiConversation.create({ data: { dealershipId, channel: "WEB", status: "ACTIVE", state: { stage: "intent" } as unknown as Prisma.InputJsonValue } });
  const s = (convo.state ?? {}) as ChatState;
  if (current && !s.interest) s.interest = current.label; // they're on a unit's page → that's the interest
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
