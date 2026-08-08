import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";
import { stripeConfigured } from "@/lib/server/billing";
import { syncPlatformFromStripe } from "@/lib/server/stripe";
import { PLANS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/account/gate → whether the dashboard should be paywalled for this user.
 * Gated when billing is live, the user isn't Krakd staff, and their subscription is
 * INACTIVE or CANCELED (never paid / lapsed). ACTIVE, TRIALING and PAST_DUE keep
 * access (PAST_DUE is nudged, not locked, so a failed charge doesn't lock them out). */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId, role } = await requireAuth(req);

  if (!stripeConfigured() || role === "PLATFORM_ADMIN") {
    return json({ gated: false, status: "ACTIVE", role, plans: PLANS });
  }

  try { await syncPlatformFromStripe(dealershipId); } catch { /* best-effort */ }
  const sub = await prisma.subscription.findUnique({ where: { dealershipId }, select: { status: true } });
  const status = sub?.status ?? "INACTIVE";
  const gated = status === "INACTIVE" || status === "CANCELED";

  return json({ gated, status, role, plans: PLANS });
});
