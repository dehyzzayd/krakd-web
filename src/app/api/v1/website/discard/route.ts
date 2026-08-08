import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { ensureWebsite, requireAdmin, setupProgress, mergedWebsite } from "@/lib/server/website";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/v1/website/discard → drop all staged edits, reverting the builder to the
 * currently-published site. Admin only. */
export const POST = route(async (req: NextRequest) => {
  const principal = await requireAuth(req);
  requireAdmin(principal);
  const { dealershipId } = principal;
  await ensureWebsite(dealershipId);

  const updated = await prisma.website.update({ where: { dealershipId }, data: { draft: Prisma.DbNull } });
  return json({ ...updated, hasDraft: false, setup: setupProgress(mergedWebsite(updated)) });
});
