/** CRM domain — a real dealer pipeline: source → lead → appointment → deal →
 *  sold, with AI activity, lead scoring, temperature and a full timeline. */

export type Stage = "new" | "working" | "appointment" | "deal" | "sold";
export const STAGES: { id: Stage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "working", label: "Working" },
  { id: "appointment", label: "Appointment" },
  { id: "deal", label: "Working deal" },
  { id: "sold", label: "Sold" },
];

export type Temp = "hot" | "warm" | "cold";
export const TEMP_TONE: Record<Temp, "err" | "warn" | "neutral"> = { hot: "err", warm: "warn", cold: "neutral" };

export type Activity = { t: string; who: "ai" | "you" | "lead" | "system"; text: string; when: string };
export type Msg = { from: "lead" | "ai" | "you"; text: string; when: string };

export type Lead = {
  id: string; name: string; source: string; vehicle: string; stage: Stage;
  temp: Temp; score: number; value: number; owner: string; ai: boolean;
  needsYou: boolean; last: string; phone: string; email: string;
  timeline: Activity[]; messages: Msg[]; next: string;
};

export const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const LEADS: Lead[] = [
  {
    id: "l1", name: "Marcus Reed", source: "Facebook", vehicle: "2023 Silverado 1500", stage: "appointment",
    temp: "hot", score: 92, value: 38940, owner: "AI", ai: true, needsYou: false, last: "6m", phone: "(512) 555-0148", email: "marcus.reed@gmail.com",
    timeline: [
      { t: "lead", who: "lead", text: "Submitted lead from Facebook ad — Certified Trucks", when: "2h ago" },
      { t: "ai", who: "ai", text: "AI texted within 6 seconds, confirmed vehicle availability", when: "2h ago" },
      { t: "ai", who: "ai", text: "Qualified — financing, trade-in a 2018 F-150", when: "1h ago" },
      { t: "appt", who: "ai", text: "Booked test drive · Saturday 2:00 PM", when: "48m ago" },
    ],
    messages: [
      { from: "lead", text: "Is the black Silverado still available?", when: "2h" },
      { from: "ai", text: "Hi Marcus! Yes — the 2023 Silverado LT Trail Boss is on the lot. Want to come see it this week?", when: "2h" },
      { from: "lead", text: "Yeah maybe Saturday. Do you take trades?", when: "1h" },
      { from: "ai", text: "Absolutely. I can get your F-150 appraised while you're here. I've got you down for Saturday at 2 — sound good?", when: "48m" },
    ],
    next: "Confirm the Saturday appointment the morning of and prep the trade appraisal.",
  },
  {
    id: "l2", name: "Priya Shah", source: "Cars.com", vehicle: "2021 Tesla Model 3", stage: "working",
    temp: "warm", score: 74, value: 27450, owner: "Dana M.", ai: false, needsYou: true, last: "18m",
    phone: "(512) 555-0192", email: "priya.shah@outlook.com",
    timeline: [
      { t: "lead", who: "lead", text: "Cars.com lead — Model 3 Long Range", when: "5h ago" },
      { t: "ai", who: "ai", text: "AI emailed + texted, no reply yet", when: "5h ago" },
      { t: "you", who: "you", text: "Dana called — left voicemail", when: "3h ago" },
      { t: "system", who: "system", text: "Reassigned to Dana M.", when: "3h ago" },
    ],
    messages: [{ from: "ai", text: "Hi Priya, the Model 3 you asked about is available. When works for a quick call?", when: "5h" }],
    next: "Second follow-up due — try a call before 6pm, then a text if no answer.",
  },
  {
    id: "l3", name: "Luis Ortega", source: "Website", vehicle: "2020 Ram 1500", stage: "working",
    temp: "warm", score: 68, value: 34120, owner: "AI", ai: true, needsYou: false, last: "41m",
    phone: "(512) 555-0110", email: "lortega88@gmail.com",
    timeline: [
      { t: "lead", who: "lead", text: "Website chat — asked about the Ram 1500", when: "1d ago" },
      { t: "ai", who: "ai", text: "AI answered financing question, sent VDP link", when: "1d ago" },
      { t: "ai", who: "ai", text: "Follow-up text — still deciding", when: "41m ago" },
    ],
    messages: [
      { from: "lead", text: "What would payments look like with $3k down?", when: "1d" },
      { from: "ai", text: "On the Ram at $34,120, roughly $520/mo over 72 with approved credit — want me to run a real pre-qual? Soft pull, no impact.", when: "1d" },
    ],
    next: "Send the pre-qualification link and a walkaround video of the Ram.",
  },
  {
    id: "l4", name: "Kayla Brooks", source: "AutoTrader", vehicle: "2022 Honda CR-V", stage: "new",
    temp: "warm", score: 61, value: 29880, owner: "—", ai: true, needsYou: false, last: "1h",
    phone: "(512) 555-0175", email: "kayla.brooks@icloud.com",
    timeline: [
      { t: "lead", who: "lead", text: "AutoTrader lead — CR-V EX-L", when: "1h ago" },
      { t: "ai", who: "ai", text: "AI sent intro text, awaiting reply", when: "1h ago" },
    ],
    messages: [{ from: "ai", text: "Hi Kayla! Thanks for your interest in the CR-V EX-L. Still shopping? Happy to hold it for you.", when: "1h" }],
    next: "AI is working the first response — no action needed yet.",
  },
  {
    id: "l5", name: "Sam Whitfield", source: "Referral", vehicle: "2019 BMW 4 Series", stage: "deal",
    temp: "hot", score: 88, value: 25300, owner: "Marco T.", ai: false, needsYou: true, last: "2h",
    phone: "(512) 555-0133", email: "swhitfield@gmail.com",
    timeline: [
      { t: "lead", who: "lead", text: "Referral from a past customer", when: "3d ago" },
      { t: "appt", who: "you", text: "Came in, drove the 440i", when: "1d ago" },
      { t: "deal", who: "you", text: "Working numbers — trade + financing", when: "2h ago" },
    ],
    messages: [{ from: "lead", text: "Can you do $24,500 out the door?", when: "2h" }],
    next: "Desk the deal — buyer countered $24.5k OTD. Get manager approval.",
  },
  {
    id: "l6", name: "Nina Alvarez", source: "CarGurus", vehicle: "2023 Toyota Tacoma", stage: "appointment",
    temp: "hot", score: 85, value: 41200, owner: "AI", ai: true, needsYou: false, last: "3h",
    phone: "(512) 555-0166", email: "nina.alvarez@gmail.com",
    timeline: [
      { t: "lead", who: "lead", text: "CarGurus lead — Tacoma TRD Sport", when: "6h ago" },
      { t: "ai", who: "ai", text: "AI qualified + booked appointment", when: "5h ago" },
      { t: "appt", who: "ai", text: "Appointment · tomorrow 11:00 AM", when: "3h ago" },
    ],
    messages: [{ from: "ai", text: "You're set for tomorrow at 11 for the Tacoma, Nina. I'll text a reminder in the morning!", when: "3h" }],
    next: "AI will send a reminder tomorrow AM. Have the Tacoma detailed and up front.",
  },
  {
    id: "l7", name: "Derek Coleman", source: "Google", vehicle: "2022 Kia Telluride", stage: "new",
    temp: "cold", score: 44, value: 42600, owner: "—", ai: true, needsYou: false, last: "20m",
    phone: "(512) 555-0121", email: "dcoleman@yahoo.com",
    timeline: [{ t: "lead", who: "lead", text: "Google search lead — Telluride SX", when: "20m ago" }, { t: "ai", who: "ai", text: "AI sent intro, no reply", when: "18m ago" }],
    messages: [{ from: "ai", text: "Hi Derek — the Telluride SX is available. Want more photos or a video?", when: "20m" }],
    next: "AI nurturing. Escalate if no reply in 24h.",
  },
  {
    id: "l8", name: "Tanya Brooks", source: "Facebook", vehicle: "2024 Hyundai Santa Fe", stage: "deal",
    temp: "hot", score: 90, value: 43900, owner: "Dana M.", ai: false, needsYou: false, last: "5h",
    phone: "(512) 555-0154", email: "tanya.b@gmail.com",
    timeline: [{ t: "appt", who: "you", text: "Test drove the Santa Fe Calligraphy", when: "1d ago" }, { t: "deal", who: "you", text: "Credit approved — finalizing", when: "5h ago" }],
    messages: [{ from: "lead", text: "Approved! When can I pick it up?", when: "5h" }],
    next: "Schedule delivery — buyer approved. Prep paperwork and detail.",
  },
  {
    id: "l9", name: "Robert Fields", source: "Website", vehicle: "2020 Subaru Outback", stage: "sold",
    temp: "cold", score: 100, value: 24700, owner: "Marco T.", ai: false, needsYou: false, last: "1d",
    phone: "(512) 555-0188", email: "rfields@gmail.com",
    timeline: [{ t: "deal", who: "you", text: "Signed — 2020 Outback", when: "1d ago" }, { t: "system", who: "system", text: "Marked sold · $24,700", when: "1d ago" }],
    messages: [{ from: "you", text: "Congrats Robert, enjoy the Outback! We'll send registration details shortly.", when: "1d" }],
    next: "Send the post-sale follow-up and ask for a review in 3 days.",
  },
  {
    id: "l10", name: "Amara Okafor", source: "CarGurus", vehicle: "2021 Lexus RX 350", stage: "working",
    temp: "warm", score: 70, value: 39600, owner: "AI", ai: true, needsYou: false, last: "55m",
    phone: "(512) 555-0139", email: "amara.o@gmail.com",
    timeline: [{ t: "lead", who: "lead", text: "CarGurus lead — RX 350 F Sport", when: "8h ago" }, { t: "ai", who: "ai", text: "AI following up, in recon — ETA shared", when: "55m ago" }],
    messages: [{ from: "ai", text: "The RX is finishing recon and will be ready Friday — want me to hold it and text you the moment it's photographed?", when: "55m" }],
    next: "Notify the moment the RX clears recon and photos are live.",
  },
];

export function crmStats() {
  const active = LEADS.filter((l) => l.stage !== "sold");
  const appts = LEADS.filter((l) => l.stage === "appointment").length;
  const needs = LEADS.filter((l) => l.needsYou).length;
  return { active: active.length, appts, needs, aiWorking: LEADS.filter((l) => l.ai && l.stage !== "sold").length };
}
