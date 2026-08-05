import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { openJson } from "@/lib/server/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/credit-app/applications → the dealer's submitted applications + stats */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const rows = await prisma.creditApplication.findMany({ where: { dealershipId }, orderBy: { createdAt: "desc" } });
  const items = rows.map((r) => {
    const a = openJson<Record<string, string>>(r.applicant ?? {}) ?? {};
    return {
      id: r.id, status: r.status, createdAt: r.createdAt.toISOString(),
      name: `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || "Applicant",
      email: a.email ?? "", phone: a.phone ?? "",
      income: a.grossMonthlyIncome ?? "", coApplicant: !!r.coApplicant,
    };
  });
  const count = (s: string) => items.filter((i) => i.status === s).length;
  return json({ items, stats: { total: items.length, new: count("NEW"), approved: count("APPROVED"), declined: count("DECLINED") } });
});
