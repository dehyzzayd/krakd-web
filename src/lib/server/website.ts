import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/server/http";
import type { Principal } from "@/lib/server/auth";
import type { Prisma, Website } from "@prisma/client";

/** URL-safe slug from a dealership name. */
export function slugify(input: string): string {
  return input.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "dealer";
}

/** Domain/publish actions are admin-only (account owner or manager). */
export function requireAdmin(p: Principal) {
  if (!["OWNER", "MANAGER", "PLATFORM_ADMIN"].includes(p.role)) {
    throw new HttpError(403, "Only an admin can manage the website domain and publishing.");
  }
}

/** Fetch the dealer's Website, creating it (with a unique slug) on first access. */
export async function ensureWebsite(dealershipId: string): Promise<Website> {
  const existing = await prisma.website.findUnique({ where: { dealershipId } });
  if (existing) return existing;

  const dealer = await prisma.dealership.findUnique({
    where: { id: dealershipId },
    select: { name: true, phone: true, email: true, addressLine1: true, city: true, state: true, postalCode: true, brandColor: true, logoUrl: true, hours: true },
  });

  // unique slug: base, then base-2, base-3, …
  const base = slugify(dealer?.name ?? "dealer");
  let slug = base;
  for (let i = 2; await prisma.website.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  const brand = dealer?.brandColor && /^#[0-9a-fA-F]{6}$/.test(dealer.brandColor) ? dealer.brandColor : null;
  const dealerHours = Array.isArray(dealer?.hours) ? dealer.hours : [];

  return prisma.website.create({
    data: {
      dealershipId, slug,
      headline: `Welcome to ${dealer?.name ?? "our business"}.`,
      phone: dealer?.phone ?? null,
      email: dealer?.email ?? null,
      address: dealer?.addressLine1 ?? null,
      city: dealer?.city ?? null,
      state: dealer?.state ?? null,
      zip: dealer?.postalCode ?? null,
      // start the new site on-brand, inheriting the global Settings brand
      ...(brand ? { primaryColor: brand } : {}),
      ...(dealer?.logoUrl ? { logoUrl: dealer.logoUrl } : {}),
      ...(dealerHours.length ? { hours: dealerHours as unknown as Prisma.InputJsonValue } : {}),
    },
  });
}

/** Editable fields that can be staged in `draft`. Mirrors the PATCH schema — these are
 *  the only keys the builder writes, and the only ones publish materializes to live. */
export const DRAFTABLE_KEYS = [
  "template", "logoUrl", "heroImageUrl", "primaryColor", "headerStyle", "logoScale",
  "headline", "intro", "ctaLabel", "aboutText", "financingText", "tradeInText",
  "whyUs", "staff", "reviews", "pages", "nav", "sidebar", "sections",
  "vdpButtonLabel", "vdpButtonUrl", "phone", "email", "address", "city", "state", "zip",
  "hours", "socials",
] as const;

export type DraftPatch = Partial<Record<(typeof DRAFTABLE_KEYS)[number], unknown>>;

/** The website as the builder should see it: live fields overlaid with staged draft. */
export function mergedWebsite(w: Website): Website {
  const d = (w.draft ?? null) as DraftPatch | null;
  if (!d) return w;
  return { ...w, ...(d as Partial<Website>) };
}

/** Whether there are staged edits not yet published. */
export function hasDraft(w: Website): boolean {
  const d = (w.draft ?? null) as DraftPatch | null;
  return !!d && Object.keys(d).length > 0;
}

/** Guided-setup checklist derived from the current record. */
export function setupProgress(w: Website) {
  const details = Boolean(w.phone && w.address && w.city);
  const domain = w.domainStatus === "LIVE";
  const steps = { template: true, details, domain, published: w.status === "PUBLISHED" };
  const done = Object.values(steps).filter(Boolean).length;
  return { steps, done, total: 4 };
}
