import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/server/admin";
import { json, route, HttpError } from "@/lib/server/http";
import { registrarConfigured, registerDomain, attachToProject, MARKUP_CENTS } from "@/lib/server/registrar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/admin/domains → domains bought through Krakd, awaiting registration or
 * in progress. Shows the customer price, our cost, and margin. Platform admin only. */
export const GET = route(async (req: NextRequest) => {
  await requirePlatformAdmin(req);
  const rows = await prisma.website.findMany({
    where: { domainProvider: "krakd", domainStatus: { in: ["PENDING_PURCHASE", "PROVISIONING"] } },
    select: { dealershipId: true, domain: true, domainStatus: true, domainPriceCents: true, updatedAt: true, dealership: { select: { name: true } } },
    orderBy: { updatedAt: "asc" },
  });
  const items = rows.map((r) => ({
    dealershipId: r.dealershipId,
    dealership: r.dealership?.name ?? "—",
    domain: r.domain,
    status: r.domainStatus,
    priceCents: r.domainPriceCents ?? 0,           // what the customer paid
    costCents: Math.max(0, (r.domainPriceCents ?? 0) - MARKUP_CENTS), // what we pay the registrar
    marginCents: Math.min(r.domainPriceCents ?? 0, MARKUP_CENTS),
    requestedAt: r.updatedAt,
  }));
  return json({ items, registrarConfigured: registrarConfigured() });
});

const registerSchema = z.object({ dealershipId: z.string().uuid() });

/* POST /api/v1/admin/domains → register a paid, pending domain with the registrar and
 * attach it to the project. Platform admin only. */
export const POST = route(async (req: NextRequest) => {
  await requirePlatformAdmin(req);
  const parsed = registerSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, "dealershipId is required");
  const { dealershipId } = parsed.data;

  const w = await prisma.website.findUnique({ where: { dealershipId } });
  if (!w?.domain || w.domainStatus !== "PENDING_PURCHASE") throw new HttpError(409, "No domain awaiting registration for this dealer.");

  const costCents = Math.max(0, (w.domainPriceCents ?? 0) - MARKUP_CENTS);
  const renewsAt = new Date();
  renewsAt.setFullYear(renewsAt.getFullYear() + 1);

  let status: "PROVISIONING" | "LIVE" = "LIVE"; // sim → straight to live
  if (registrarConfigured()) {
    await registerDomain(w.domain, costCents);   // buy at the registrar (real money)
    const r = await attachToProject(w.domain);   // routing + SSL
    status = r.verified ? "LIVE" : "PROVISIONING";
  }

  const updated = await prisma.website.update({ where: { dealershipId }, data: { domainStatus: status, domainRenewsAt: renewsAt } });
  return json({ ok: true, website: updated });
});
