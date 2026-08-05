import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/http";
import { buildStickerPdf } from "@/lib/server/stickerPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/inventory/[id]/sticker → a print-ready window sticker PDF */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { dealershipId } = await requireAuth(req);
    const { id } = await ctx.params;
    const v = await prisma.vehicle.findFirst({
      where: { id, dealershipId },
      include: { dealership: { select: { name: true, brandColor: true, logoUrl: true, phone: true, addressLine1: true, city: true, state: true } } },
    });
    if (!v) throw new HttpError(404, "Vehicle not found");

    const d = v.dealership;
    const contact = [d.addressLine1, [d.city, d.state].filter(Boolean).join(", "), d.phone].filter(Boolean).join("   ·   ");
    const doc = buildStickerPdf(
      {
        year: v.year, make: v.make, model: v.model, trim: v.trim, vin: v.vin, stock: v.stockNumber ?? "",
        mileage: v.mileage, priceCents: v.priceCents, exteriorColor: v.exteriorColor, bodyType: v.bodyType, category: v.category,
        attributes: (v.attributes && typeof v.attributes === "object" ? v.attributes : {}) as Record<string, unknown>,
      },
      { name: d.name, brandColor: d.brandColor, logoUrl: d.logoUrl, contact },
    );
    const bytes = doc.output("arraybuffer");
    const fname = `${[v.year, v.make, v.model].filter(Boolean).join("-") || "window-sticker"}`.replace(/[^a-z0-9-]/gi, "").toLowerCase();

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${fname || "window-sticker"}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return Response.json({ message: e instanceof HttpError ? e.message : "Could not generate the sticker." }, { status });
  }
}
