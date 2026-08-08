import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, requireAdmin, setupProgress, mergedWebsite, hasDraft } from "@/lib/server/website";

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

  if (status === "DRAFT") {
    // Unpublish: hide the site, keep any staged draft intact.
    const updated = await prisma.website.update({ where: { dealershipId }, data: { status: "DRAFT" } });
    return json({ ...updated, hasDraft: hasDraft(updated), setup: setupProgress(mergedWebsite(updated)) });
  }

  // Publish: validate against the staged view, then materialize draft → live and clear it.
  const view = mergedWebsite(w);
  if (!(view.phone && view.address && view.city)) {
    throw new HttpError(400, "Add your dealership contact details before publishing.");
  }
  const draft = (w.draft ?? {}) as Record<string, unknown>;
  const data = { ...draft, draft: Prisma.DbNull, status: "PUBLISHED", publishedAt: new Date() } as unknown as Prisma.WebsiteUpdateInput;

  const updated = await prisma.website.update({ where: { dealershipId }, data });
  return json({ ...updated, hasDraft: false, setup: setupProgress(updated) });
});
