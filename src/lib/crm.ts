/** CRM cluster data — contacts, unified inbox, appointments, credit apps.
 *  Derived from the lead pipeline so the whole CRM stays consistent. */

import { LEADS, leadProfile, money, type Lead } from "./leads";

export { money };

/* ── contacts ── */
export type Contact = {
  id: string; name: string; phone: string; email: string;
  type: "lead" | "customer" | "past"; vehicle: string; ltv: number;
  last: string; leadId?: string; source: string;
};

const PAST: Contact[] = [
  { id: "c-101", name: "Gloria Mendez", phone: "(512) 555-0201", email: "gloria.m@gmail.com", type: "past", vehicle: "2019 RAV4 XLE", ltv: 31400, last: "8 mo ago", source: "Walk-in" },
  { id: "c-102", name: "Terrance Hill", phone: "(512) 555-0233", email: "t.hill@outlook.com", type: "customer", vehicle: "2021 Explorer", ltv: 46200, last: "3 wk ago", source: "Referral" },
  { id: "c-103", name: "Bianca Rossi", phone: "(512) 555-0288", email: "brossi@icloud.com", type: "past", vehicle: "2017 Civic EX", ltv: 18900, last: "1 yr ago", source: "Cars.com" },
];

export const CONTACTS: Contact[] = [
  ...LEADS.map((l): Contact => ({
    id: `c-${l.id}`, name: l.name, phone: l.phone, email: l.email,
    type: l.stage === "sold" ? "customer" : "lead", vehicle: l.vehicle, ltv: l.value,
    last: l.last, leadId: l.id, source: l.source,
  })),
  ...PAST,
];

/* ── unified inbox ── */
export type Channel = "sms" | "email" | "messenger";
export const CHANNEL_LABEL: Record<Channel, string> = { sms: "SMS", email: "Email", messenger: "Messenger" };
export type Conversation = {
  id: string; leadId: string; name: string; channel: Channel;
  vehicle: string; unread: boolean; when: string;
  messages: { from: "lead" | "ai" | "you"; text: string; when: string }[];
  preview: string;
};

export const CONVERSATIONS: Conversation[] = LEADS.filter((l) => l.messages.length).map((l, i): Conversation => {
  const channel: Channel = i % 5 === 1 ? "email" : i % 7 === 3 ? "messenger" : "sms";
  const last = l.messages[l.messages.length - 1];
  return {
    id: `cv-${l.id}`, leadId: l.id, name: l.name, channel, vehicle: l.vehicle,
    unread: l.needsYou, when: l.last, messages: l.messages, preview: last.text,
  };
});

export function inboxUnread() {
  return CONVERSATIONS.filter((c) => c.unread).length;
}

/* ── appointments ── */
export type Appt = { id: string; name: string; leadId: string; type: string; day: string; time: string; status: string; vehicle: string; owner: string };

const DAYS = ["Today", "Tomorrow", "Thu · Jul 27", "Fri · Jul 28", "Sat · Jul 29"];
export const APPOINTMENTS: Appt[] = LEADS.flatMap((l, i) => {
  const prof = leadProfile(l.id);
  if (!prof || !prof.appointments.length) return [];
  return prof.appointments.map((a, j): Appt => ({
    id: `ap-${l.id}-${j}`, name: l.name, leadId: l.id, type: a.type,
    day: DAYS[(i + j) % DAYS.length], time: a.when.includes("11") ? "11:00 AM" : ["9:30 AM", "1:00 PM", "2:00 PM", "3:30 PM", "5:00 PM"][(i + j) % 5],
    status: a.status, vehicle: l.vehicle, owner: l.owner,
  }));
});

export function apptStats() {
  return { today: APPOINTMENTS.filter((a) => a.day === "Today").length, week: APPOINTMENTS.length, confirmed: APPOINTMENTS.filter((a) => a.status === "confirmed").length };
}

/* ── credit apps ── */
export type CreditRow = { leadId: string; name: string; vehicle: string; status: string; fico: number | null; tier: string; amount: number; when: string };
export const CREDIT_APPS: CreditRow[] = LEADS.map((l) => {
  const p = leadProfile(l.id)!;
  return { leadId: l.id, name: l.name, vehicle: l.vehicle, status: p.creditStatus, fico: p.bureau?.fico ?? null, tier: p.bureau?.tier ?? "—", amount: p.deal.price, when: l.last };
}).filter((c) => c.status !== "not_started");

export { LEADS };
export type { Lead };
