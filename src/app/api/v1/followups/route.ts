import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as { value?: string }).value ?? "" : "");

/* GET /api/v1/followups → every lead with a scheduled next action, bucketed
   overdue / today / upcoming, so nothing in the cadence slips. */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const rows = await prisma.lead.findMany({
    where: { dealershipId, nextActionAt: { not: null }, status: { notIn: ["SOLD", "LOST"] } },
    orderBy: { nextActionAt: "asc" },
    take: 300,
    include: { assignedTo: { select: { firstName: true, lastName: true } } },
  });

  const now = Date.now();
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  const items = rows.map((l) => {
    const at = l.nextActionAt!;
    const bucket = at.getTime() < now ? "overdue" : at.getTime() <= endOfToday.getTime() ? "today" : "upcoming";
    return {
      id: l.id,
      name: `${l.firstName} ${l.lastName ?? ""}`.trim(),
      phone: first(l.phones),
      action: l.nextAction ?? "Follow up",
      dueAt: at.toISOString(),
      bucket,
      assigned: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName ?? ""}`.trim() : (l.ownerType === "AI" ? "Krakd AI" : null),
      status: l.status,
    };
  });

  const counts = { overdue: items.filter((i) => i.bucket === "overdue").length, today: items.filter((i) => i.bucket === "today").length, upcoming: items.filter((i) => i.bucket === "upcoming").length };
  return json({ items, counts });
});
