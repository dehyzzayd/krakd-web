import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, requireAdmin, setupProgress } from "@/lib/server/website";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ status: z.enum(["PUBLISHED", "DRAFT"]).default("PUBLISHED") });

/* POST /api/v1/website/publish → take the site live (or back to draft). Admin only. */
export const POST = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  requireAdmin(principal);
  const { dealershipId } = principal;
  const w = await ensureWebsite(dealershipId);
  const { status } = bodySchema.parse(await req.json().catch(() => ({})));

  if (status === "PUBLISHED") {
    // guided setup must be far enough along to publish
    if (!(w.phone && w.address && w.city)) {
      throw new HttpError(400, "Add your dealership contact details before publishing.");
    }
  }

  const updated = await prisma.website.update({
    where: { dealershipId },
    data: { status, publishedAt: status === "PUBLISHED" ? new Date() : w.publishedAt },
  });
  return json({ ...updated, setup: setupProgress(updated) });
});
