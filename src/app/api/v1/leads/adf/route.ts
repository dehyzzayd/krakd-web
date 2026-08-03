import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/http";
import { buildAdf, type AdfLead } from "@/lib/server/adf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const first = (arr: unknown) => (Array.isArray(arr) && arr[0] ? (arr[0] as Record<string, string>).value ?? "" : "");

/* GET /api/v1/leads/adf[?id=<leadId>] → the dealer's leads as ADF (XML) for CRM/DMS import */
export async function GET(req: NextRequest) {
  try {
    const { dealershipId } = await requireAuth(req);
    const id = new URL(req.url).searchParams.get("id");

    const [dealer, rows] = await Promise.all([
      prisma.dealership.findUnique({ where: { id: dealershipId }, select: { name: true } }),
      prisma.lead.findMany({
        where: { dealershipId, ...(id ? { id } : {}) },
        orderBy: { createdAt: "desc" },
        include: { vehicle: { select: { year: true, make: true, model: true, trim: true, vin: true, stockNumber: true, priceCents: true } } },
      }),
    ]);
    if (id && rows.length === 0) throw new HttpError(404, "Lead not found");

    const leads: AdfLead[] = rows.map((l) => ({
      firstName: l.firstName,
      lastName: l.lastName ?? "",
      email: first(l.emails),
      phone: first(l.phones),
      source: l.source ?? "Krakd",
      createdAt: l.createdAt,
      status: l.status,
      vehicle: l.vehicle ? { ...l.vehicle, stock: l.vehicle.stockNumber } : null,
    }));

    const xml = buildAdf(leads, dealer?.name ?? "Dealership");
    const filename = id ? `lead-${rows[0].firstName}-${rows[0].lastName ?? ""}.adf.xml`.replace(/[^a-z0-9.-]/gi, "-").toLowerCase() : "krakd-leads.adf.xml";
    return new Response(xml, {
      status: 200,
      headers: { "content-type": "application/xml; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "no-store" },
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return Response.json({ message: e instanceof Error ? e.message : "Export failed" }, { status });
  }
}
