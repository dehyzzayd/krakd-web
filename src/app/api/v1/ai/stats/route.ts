import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/ai/stats → the current dealer's Krakd AI activity (zeros for new) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);

  const [conversations, leadsCaptured, appointments, totalLeads] = await Promise.all([
    prisma.aiConversation.count({ where: { dealershipId } }),
    prisma.lead.count({ where: { dealershipId, ownerType: "AI" } }),
    prisma.appointment.count({ where: { dealershipId, createdByAi: true } }),
    prisma.lead.count({ where: { dealershipId } }),
  ]);

  return json({
    conversations,
    leadsCaptured,
    appointments,
    captureRate: totalLeads ? Math.round((leadsCaptured / totalLeads) * 100) : 0,
    escalations: 0,
    actions: [] as { kind: string; title: string; detail: string; time: string }[],
    escalationList: [] as { reason: string; tone: string; who: string; note: string; time: string }[],
  });
});
