import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, setupProgress } from "@/lib/server/website";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicUrl(req: NextRequest, slug: string, domain: string | null, status: string) {
  if (domain && status === "LIVE") return `https://${domain}`;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}/site/${slug}`;
}

/* GET /api/v1/website → the dealer's website config, live count + setup progress */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const w = await ensureWebsite(dealershipId);
  const liveVehicles = await prisma.vehicle.count({ where: { dealershipId, status: { not: "SOLD" } } });
  return json({ ...w, liveVehicles, setup: setupProgress(w), publicUrl: publicUrl(req, w.slug, w.domain, w.domainStatus) });
});

const ASSET_MAX = 1_500_000; // ~1.5MB data URL cap for an uploaded logo/hero
const asset = z.string().max(ASSET_MAX, "Image is too large — use one under ~1MB").optional();

const patchSchema = z.object({
  template: z.enum(["MODERN", "INVENTORY_FIRST", "PREMIUM"]).optional(),
  logoUrl: asset,
  heroImageUrl: asset,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #2b6ba4").optional(),
  headerStyle: z.enum(["auto", "light", "dark", "accent"]).optional(),
  headline: z.string().max(120).optional(),
  intro: z.string().max(400).optional(),
  ctaLabel: z.string().max(40).optional(),
  aboutText: z.string().max(2000).optional(),
  financingText: z.string().max(1000).optional(),
  tradeInText: z.string().max(1000).optional(),
  whyUs: z.array(z.object({ title: z.string(), body: z.string() })).max(6).optional(),
  staff: z.array(z.object({ name: z.string(), role: z.string(), photoUrl: z.string().max(ASSET_MAX).optional() })).max(24).optional(),
  reviews: z.array(z.object({ name: z.string(), rating: z.number().int().min(1).max(5), body: z.string() })).max(24).optional(),
  pages: z.array(z.object({ id: z.string(), slug: z.string(), title: z.string(), body: z.string(), inNav: z.boolean().optional(), showSidebar: z.boolean().optional() })).max(20).optional(),
  nav: z.array(z.object({ id: z.string(), label: z.string(), type: z.enum(["home", "inventory", "financing", "about", "contact", "page", "link"]), value: z.string().optional(), visible: z.boolean().optional() })).max(20).optional(),
  sidebar: z.array(z.object({ id: z.string(), type: z.enum(["contactForm", "address", "hours", "phone", "pages", "text"]), title: z.string().optional(), body: z.string().optional() })).max(12).optional(),
  vdpButtonLabel: z.string().max(40).optional(),
  vdpButtonUrl: z.string().max(300).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  hours: z.array(z.object({ day: z.string(), open: z.string(), close: z.string() })).optional(),
  socials: z.record(z.string(), z.string()).optional(),
  sections: z.record(z.string(), z.boolean()).optional(),
});

/* PATCH /api/v1/website → update template, branding and homepage content */
export const PATCH = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  await ensureWebsite(dealershipId);
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const { hours, socials, whyUs, staff, reviews, sections, pages, nav, sidebar, ...rest } = parsed.data;
  const data: Prisma.WebsiteUpdateInput = {
    ...rest,
    ...(hours ? { hours: hours as unknown as Prisma.InputJsonValue } : {}),
    ...(socials ? { socials: socials as unknown as Prisma.InputJsonValue } : {}),
    ...(whyUs ? { whyUs: whyUs as unknown as Prisma.InputJsonValue } : {}),
    ...(staff ? { staff: staff as unknown as Prisma.InputJsonValue } : {}),
    ...(reviews ? { reviews: reviews as unknown as Prisma.InputJsonValue } : {}),
    ...(sections ? { sections: sections as unknown as Prisma.InputJsonValue } : {}),
    ...(pages ? { pages: pages as unknown as Prisma.InputJsonValue } : {}),
    ...(nav ? { nav: nav as unknown as Prisma.InputJsonValue } : {}),
    ...(sidebar ? { sidebar: sidebar as unknown as Prisma.InputJsonValue } : {}),
  };
  const w = await prisma.website.update({ where: { dealershipId }, data });
  return json({ ...w, setup: setupProgress(w), publicUrl: publicUrl(req, w.slug, w.domain, w.domainStatus) });
});
