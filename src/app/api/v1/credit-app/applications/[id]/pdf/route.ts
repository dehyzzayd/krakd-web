import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/http";
import { buildCreditPdf } from "@/lib/server/creditPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/credit-app/applications/[id]/pdf → a real PDF of the application */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { dealershipId } = await requireAuth(req);
    const { id } = await ctx.params;
    const r = await prisma.creditApplication.findFirst({
      where: { id, dealershipId },
      include: { dealership: { select: { name: true, brandColor: true, logoUrl: true } } },
    });
    if (!r) throw new HttpError(404, "Application not found");

    const doc = buildCreditPdf(
      { applicant: (r.applicant ?? {}) as Record<string, string>, coApplicant: (r.coApplicant ?? null) as Record<string, string> | null, status: r.status, createdAt: r.createdAt },
      { name: r.dealership.name, brandColor: r.dealership.brandColor, logoUrl: r.dealership.logoUrl },
    );
    const bytes = doc.output("arraybuffer");
    const applicant = (r.applicant ?? {}) as Record<string, string>;
    const name = `${applicant.firstName ?? "credit"}-${applicant.lastName ?? "application"}`.replace(/[^a-z0-9-]/gi, "").toLowerCase();

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${name || "credit-application"}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return Response.json({ message: e instanceof Error ? e.message : "Failed to generate PDF" }, { status });
  }
}
