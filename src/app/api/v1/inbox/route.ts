import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ago = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
};
const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as Record<string, string>).value ?? "" : "");

/* GET /api/v1/inbox → one conversation per lead, newest activity first */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const rows = await prisma.lead.findMany({
    where: { dealershipId },
    orderBy: { lastActivityAt: "desc" },
    take: 100,
    include: {
      vehicle: { select: { year: true, make: true, model: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const items = rows.map((l) => {
    const last = l.activities[0];
    return {
      leadId: l.id,
      name: `${l.firstName} ${l.lastName ?? ""}`.trim(),
      phone: first(l.phones), email: first(l.emails),
      vehicle: l.vehicle ? `${l.vehicle.year} ${l.vehicle.make} ${l.vehicle.model}` : "",
      source: l.source ?? "",
      lastPreview: last?.content || (last ? last.type : "New lead — no messages yet"),
      lastAgo: ago(last?.createdAt ?? l.createdAt),
      lastAt: (last?.createdAt ?? l.createdAt).toISOString(),
    };
  });
  return json({ items });
});
