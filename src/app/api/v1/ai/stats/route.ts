import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ago = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
const nameOf = (l: { firstName: string; lastName: string | null } | null) => (l ? `${l.firstName} ${l.lastName ?? ""}`.trim() : "a lead");

/* GET /api/v1/ai/stats → the dealer's real Krakd AI activity (conversations opened,
   leads captured, appointments booked, recent actions, and human hand-offs). */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);

  const [conversations, leadsCaptured, aiAppointments, totalLeads, recentConvos, recentAppts, handoffs] = await Promise.all([
    prisma.aiConversation.count({ where: { dealershipId } }),
    prisma.lead.count({ where: { dealershipId, ownerType: "AI" } }),
    prisma.appointment.count({ where: { dealershipId, createdByAi: true } }),
    prisma.lead.count({ where: { dealershipId } }),
    prisma.aiConversation.findMany({
      where: { dealershipId }, orderBy: { createdAt: "desc" }, take: 8,
      include: { lead: { select: { firstName: true, lastName: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.appointment.findMany({
      where: { dealershipId, createdByAi: true }, orderBy: { createdAt: "desc" }, take: 5,
      include: { lead: { select: { firstName: true, lastName: true } } },
    }),
    prisma.aiConversation.findMany({
      where: { dealershipId, status: "HANDED_OFF" }, orderBy: { createdAt: "desc" }, take: 8,
      include: { lead: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const actions = [
    ...recentConvos.map((c) => ({ kind: "message", title: `Krakd AI reached out to ${nameOf(c.lead)}`, detail: c.messages[0]?.content.slice(0, 90) ?? "Opened a conversation", at: c.createdAt })),
    ...recentAppts.map((a) => ({ kind: "appointment", title: `Booked ${nameOf(a.lead)} an appointment`, detail: `${a.type.replace(/_/g, " ").toLowerCase()} · ${a.scheduledStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, at: a.createdAt })),
  ]
    .sort((x, y) => y.at.getTime() - x.at.getTime())
    .slice(0, 10)
    .map(({ at, ...r }) => ({ ...r, time: ago(at) }));

  const escalationList = handoffs.map((h) => ({
    reason: `${nameOf(h.lead)} needs a human`,
    tone: "warn",
    who: "Krakd AI",
    note: "Captured this lead but couldn't reach them automatically — no consented channel. Follow up personally.",
    time: ago(h.createdAt),
  }));

  return json({
    conversations,
    leadsCaptured,
    appointments: aiAppointments,
    captureRate: totalLeads ? Math.round((leadsCaptured / totalLeads) * 100) : 0,
    escalations: handoffs.length,
    actions,
    escalationList,
  });
});
