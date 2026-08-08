import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { ensureWebsite, setupProgress, mergedWebsite, hasDraft } from "@/lib/server/website";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicUrl(req: NextRequest, slug: string, domain: string | null, status: string) {
  if (domain && status === "LIVE") return `https://${domain}`;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}/site/${slug}`;
}

/* GET /api/v1/website → the dealer's website config (live fields overlaid with any
 * staged draft), live count, setup progress, and whether there are unpublished edits. */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const w = await ensureWebsite(dealershipId);
  const view = mergedWebsite(w);
  const liveVehicles = await prisma.vehicle.count({ where: { dealershipId, status: { not: "SOLD" } } });
  const { draft: _draft, ...rest } = view;
  return json({ ...rest, hasDraft: hasDraft(w), setup: setupProgress(view), publicUrl: publicUrl(req, w.slug, w.domain, w.domainStatus) });
});

const ASSET_MAX = 1_500_000; // ~1.5MB data URL cap for an uploaded logo/hero
const asset = z.string().max(ASSET_MAX, "Image is too large — use one under ~1MB").optional();

const patchSchema = z.object({
  template: z.enum(["MODERN","INVENTORY_FIRST","PREMIUM","CLASSIC","SPORT","MINIMAL","AURORA","QUIET","VELOCITY"]).optional(),
  logoUrl: asset,
  heroImageUrl: asset,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #2b6ba4").optional(),
  headerStyle: z.enum(["auto", "light", "dark", "accent"]).optional(),
  logoScale: z.enum(["sm", "md", "lg", "xl"]).optional(),
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
  layout: z.array(z.object({
    id: z.string(),
    type: z.enum(["richText", "imageText", "cta", "stats", "faq"]),
    heading: z.string().max(200).optional(),
    body: z.string().max(4000).optional(),
    align: z.enum(["left", "center"]).optional(),
    image: z.string().max(ASSET_MAX).optional(),
    buttonLabel: z.string().max(60).optional(),
    buttonUrl: z.string().max(500).optional(),
    imageRight: z.boolean().optional(),
    items: z.array(z.object({ value: z.string().max(40).optional(), label: z.string().max(120).optional(), q: z.string().max(300).optional(), a: z.string().max(2000).optional() })).max(20).optional(),
  })).max(30).optional(),
});

/* PATCH /api/v1/website → stage edits into the draft overlay (NOT the live site).
 * Edits accumulate in `draft` and only reach the public site when the dealer Publishes.
 * The response returns the merged (draft-applied) view so the builder shows staged state. */
export const PATCH = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const w = await ensureWebsite(dealershipId);
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  // Merge the incoming partial into the existing draft (plain JSON — same keys as the columns).
  const prevDraft = (w.draft ?? {}) as Record<string, unknown>;
  const nextDraft = { ...prevDraft, ...parsed.data };

  const updated = await prisma.website.update({
    where: { dealershipId },
    data: { draft: nextDraft as unknown as Prisma.InputJsonValue },
  });
  const view = mergedWebsite(updated);
  const { draft: _draft, ...rest } = view;
  return json({ ...rest, hasDraft: hasDraft(updated), setup: setupProgress(view), publicUrl: publicUrl(req, updated.slug, updated.domain, updated.domainStatus) });
});
