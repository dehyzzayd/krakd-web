import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { TEST_DRIVE: "Test drive", DELIVERY: "Delivery", PHONE: "Phone consultation", SERVICE: "Service", TRADE_APPRAISAL: "Trade appraisal" };
const STATUS_LABEL: Record<string, string> = { SCHEDULED: "Scheduled", CONFIRMED: "Confirmed", COMPLETED: "Completed", CANCELED: "Canceled", NO_SHOW: "No-show" };

/* GET /api/v1/appointments → the current dealer's appointments (empty for new) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const rows = await prisma.appointment.findMany({
    where: { dealershipId },
    orderBy: { scheduledStart: "asc" },
    take: 200,
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      vehicle: { select: { year: true, make: true, model: true } },
      assignedTo: { select: { firstName: true } },
    },
  });

  const items = rows.map((a) => ({
    id: a.id,
    leadId: a.leadId,
    name: a.lead ? `${a.lead.firstName} ${a.lead.lastName ?? ""}`.trim() : "—",
    vehicle: a.vehicle ? `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}` : "—",
    type: TYPE_LABEL[a.type] ?? a.type,
    status: STATUS_LABEL[a.status] ?? a.status,
    statusKey: a.status.toLowerCase(),
    owner: a.createdByAi ? "Krakd AI" : a.assignedTo?.firstName ?? "—",
    start: a.scheduledStart.toISOString(),
    end: a.scheduledEnd.toISOString(),
    location: a.location ?? "",
  }));

  return json({ items });
});
