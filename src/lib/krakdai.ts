/** Krakd AI — the dealership's autonomous sales agent.
 *  A buyer-facing chat agent that answers grounded in live inventory and takes
 *  real CRM actions via tools (capture lead, book appointment, flag for human,
 *  record vehicle-of-interest, capture trade-in). One brain, per-dealer config. */

import { vehicleById, money, type Vehicle } from "./inventory";

export type ToolKind = "lead" | "appointment" | "voi" | "tradein" | "task" | "handoff" | "inventory";

export type Msg = {
  from: "buyer" | "ai";
  text: string;
  vehicleId?: string;            // renders an inline vehicle card
  tools?: { kind: ToolKind; label: string; detail: string }[];
  time?: string;
};

/* ── headline metrics (trailing 30 days) ─────────────────────────────── */
export const AI_STATS = {
  conversations: 1284,
  leadsCaptured: 342,
  appointments: 96,
  captureRate: 27,          // %
  avgResponse: "3.2s",
  escalations: 18,
  afterHours: 41,           // % of conversations outside business hours
  costPerLead: 1.12,        // $
};

/* ── the agent's hands: tools, mirroring the capability matrix ───────── */
export type Capability = {
  name: string; kind: ToolKind | "answer" | "multilingual" | "links";
  desc: string; state: "active" | "gated"; write: boolean; gate?: string;
};
export const CAPABILITIES: Capability[] = [
  { name: "Answer questions", kind: "answer", desc: "Grounded prose from live dealer facts — never invents a spec, price, or link.", state: "active", write: false },
  { name: "Inventory lookup", kind: "inventory", desc: "Searches live stock and describes real vehicles, prices and mileage.", state: "active", write: false },
  { name: "Vehicle deep-links", kind: "links", desc: "Shares only real VDP and inventory URLs — never builds one.", state: "active", write: false },
  { name: "Lead capture", kind: "lead", desc: "Captures name, mobile and email and writes them straight to the CRM.", state: "active", write: true },
  { name: "Appointment booking", kind: "appointment", desc: "Checks availability and books test drives directly on the calendar.", state: "gated", write: true, gate: "Booking mode: Internal" },
  { name: "Follow-up task", kind: "task", desc: "Silently schedules a call-back task when a buyer asks to be contacted.", state: "active", write: true },
  { name: "Human handoff", kind: "handoff", desc: "Flags complaints, hot leads and out-of-scope asks for a person.", state: "active", write: true },
  { name: "Vehicle of interest", kind: "voi", desc: "Records the exact unit a buyer is shopping onto their CRM record.", state: "active", write: true },
  { name: "Trade-in capture", kind: "tradein", desc: "Logs a structured trade-in — never quotes a value, hands appraisal to the team.", state: "gated", write: true, gate: "Trade-in enabled" },
  { name: "Multilingual", kind: "multilingual", desc: "Replies in the buyer's language automatically.", state: "active", write: false },
];

/* ── per-dealer configuration (Krakd chat settings) ──────────────────── */
export const AI_CONFIG = {
  persona: "Warm & professional",
  negotiation: "Mostly firm" as "Flexible" | "Mostly firm" | "No negotiation",
  booking: "Internal" as "Internal" | "External" | "Disabled",
  tradeIn: true,
  finance: true,
  afterHours: true,
  welcome: "Hey! 👋 Looking for something specific? I can check what's on the lot right now and set up a time to see it.",
  custom: "Emphasize our 7-day exchange policy. Always mention free CarFax on every used unit.",
  // Krakd-provisioned line the AI texts/calls from (included in the $149 plan)
  phone: "(512) 555-0199",
  // resource links the agent hands to buyers
  links: {
    inventory: "https://downtownauto.com/inventory",
    creditApp: "https://downtownauto.com/finance/apply",
    appointment: "https://downtownauto.com/schedule",
    testDrive: "https://downtownauto.com/test-drive",
  },
  testDrive: true,
};

/* ── website embed widget appearance ─────────────────────────────────── */
export const WIDGET_DEFAULTS = {
  accent: "#2563eb",
  position: "right" as "right" | "left",
  title: "Chat with us",
  subtitle: "Typically replies in seconds",
  launcher: "Chat with us",
  greeting: "👋 Have a question about a vehicle? Ask away.",
  theme: "light" as "light" | "dark",
};

/* ── a real captured conversation, grounded in inventory ─────────────── */
export const DEMO_THREAD: Msg[] = [
  { from: "buyer", text: "Hi, do you have any trucks under $40k?", time: "2:41 PM" },
  { from: "ai", time: "2:41 PM", vehicleId: "k2213", tools: [{ kind: "inventory", label: "Inventory searched", detail: "3 matches under $40,000" }],
    text: "Hey! We do — a standout is our 2023 Chevrolet Silverado 1500 LT Trail Boss at $38,940 with 28,450 miles. Here it is 👇" },
  { from: "buyer", text: "That looks good. Is it still available?", time: "2:42 PM" },
  { from: "ai", time: "2:42 PM",
    text: "It is — in stock and ready to go. It's actually priced about $1,160 below market for that trim and mileage, so it tends to move quick. Want to come take a look?" },
  { from: "buyer", text: "Sure, can I come by Saturday afternoon?", time: "2:43 PM" },
  { from: "ai", time: "2:43 PM", text: "Absolutely. What's the best name and mobile number to hold the spot under?" },
  { from: "buyer", text: "Marcus Reed, 512-555-0148", time: "2:44 PM" },
  { from: "ai", time: "2:44 PM",
    tools: [
      { kind: "lead", label: "Lead captured", detail: "Marcus Reed · (512) 555-0148" },
      { kind: "appointment", label: "Appointment booked", detail: "Sat, Jul 26 · 2:00 PM" },
      { kind: "voi", label: "Vehicle of interest", detail: "2023 Silverado 1500" },
    ],
    text: "You're all set, Marcus — Saturday at 2:00 PM to see the Silverado. You'll get a text confirmation in a moment. Anything else I can pull up before then?" },
  { from: "buyer", text: "Do you take trade-ins? I've got a 2019 Camry.", time: "2:45 PM" },
  { from: "ai", time: "2:45 PM",
    tools: [{ kind: "tradein", label: "Trade-in captured", detail: "2019 Toyota Camry" }],
    text: "We do! I've noted your 2019 Camry and our team will appraise it while you're in — plus every used unit comes with a free CarFax. See you Saturday!" },
];

/* ── recent autonomous actions (activity feed) ───────────────────────── */
export const AI_ACTIONS: { kind: ToolKind; title: string; detail: string; time: string }[] = [
  { kind: "appointment", title: "Booked appointment", detail: "Marcus Reed · Sat 2:00 PM · Silverado 1500", time: "24m ago" },
  { kind: "lead", title: "Captured lead", detail: "Priya Shah · after-hours (3:14 AM)", time: "38m ago" },
  { kind: "handoff", title: "Flagged for a human", detail: "Hot lead — ready to buy · Kayla Brooks", time: "1h ago" },
  { kind: "voi", title: "Recorded vehicle of interest", detail: "Tesla Model 3 · Priya Shah", time: "1h ago" },
  { kind: "tradein", title: "Captured trade-in", detail: "2018 Honda Civic · Derek Coleman", time: "2h ago" },
  { kind: "task", title: "Scheduled follow-up", detail: "Call back tomorrow AM · Nina Alvarez", time: "3h ago" },
  { kind: "lead", title: "Captured lead", detail: "Amara Okafor · Facebook Marketplace", time: "4h ago" },
];

/* ── conversations flagged for a person ──────────────────────────────── */
export const AI_ESCALATIONS: { reason: string; tone: "err" | "warn" | "brand"; who: string; note: string; time: string }[] = [
  { reason: "Hot lead", tone: "err", who: "Kayla Brooks", note: "Cash buyer, wants to close on the CR-V today.", time: "1h ago" },
  { reason: "Complaint", tone: "warn", who: "Anonymous", note: "Disputes the advertised price on a sold unit.", time: "3h ago" },
  { reason: "Low confidence", tone: "brand", who: "Sam Whitfield", note: "Detailed financing question beyond scope.", time: "5h ago" },
];

/* ── interactive widget: keyword → scripted reply ────────────────────── */
export const WIDGET_SUGGESTIONS = [
  "Show me trucks under $40k",
  "Is the Silverado still available?",
  "Can I book a test drive?",
  "Do you take trade-ins?",
];

export function botReply(input: string): Msg {
  const t = input.toLowerCase();
  if (/(truck|silverado|under|budget|40|cheap)/.test(t))
    return { from: "ai", vehicleId: "k2213", tools: [{ kind: "inventory", label: "Inventory searched", detail: "3 matches" }],
      text: "We've got a few! The 2023 Chevrolet Silverado 1500 LT Trail Boss at $38,940 (28,450 mi) is a favorite — priced about $1,160 below market. Want to see it?" };
  if (/(available|in stock|still have|sold)/.test(t))
    return { from: "ai", text: "Yes — it's in stock and frontline-ready. Would you like to come take a look? I can set up a time right now." };
  if (/(test drive|book|appointment|come|visit|saturday|see it)/.test(t))
    return { from: "ai", tools: [{ kind: "appointment", label: "Availability checked", detail: "Sat & Sun open" }],
      text: "Happy to! We've got openings this weekend. What's the best name and mobile number to hold the appointment under?" };
  if (/(trade|camry|my car|worth)/.test(t))
    return { from: "ai", tools: [{ kind: "tradein", label: "Trade-in noted", detail: "Pending appraisal" }],
      text: "We take trades! Tell me the year, make and model and I'll note it — our team handles the appraisal in person so you get the real number." };
  if (/(finance|loan|credit|payment|monthly)/.test(t))
    return { from: "ai", text: "We offer financing across several lenders. I can start a quick credit application, or connect you with our finance team — which works better?" };
  if (/(price|deal|discount|lower|negotiat)/.test(t))
    return { from: "ai", text: "Our prices are set sharp against the market, but our team can talk numbers in person. Want me to book a time so you can make an offer?" };
  if (/(name is|my number|phone|\d{3}[- ]?\d{3}[- ]?\d{4})/.test(t))
    return { from: "ai", tools: [{ kind: "lead", label: "Lead captured", detail: "Saved to CRM" }, { kind: "appointment", label: "Appointment booked", detail: "Confirmation sent" }],
      text: "Perfect — you're all set and I've saved your details. You'll get a text confirmation shortly. Anything else I can pull up? 🚗" };
  if (/(hi|hey|hello|help)/.test(t))
    return { from: "ai", text: AI_CONFIG.welcome };
  return { from: "ai", text: "Great question — let me connect you with our team so nothing gets missed. In the meantime, want me to check the lot or set up a visit?" };
}

export function aiVehicle(id: string): Vehicle | undefined {
  return vehicleById(id);
}
export { money };
