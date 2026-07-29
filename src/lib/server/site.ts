import { cache } from "react";
import { prisma } from "@/lib/db";

export type SiteConfig = {
  slug: string;
  dealershipName: string;
  vertical: string;
  template: "MODERN" | "INVENTORY_FIRST" | "PREMIUM" | "CLASSIC" | "SPORT" | "MINIMAL" | "AURORA" | "QUIET";
  logoUrl: string | null; heroImageUrl: string | null; primaryColor: string; headerStyle: string;
  headline: string; intro: string; ctaLabel: string;
  aboutText: string; financingText: string; tradeInText: string;
  whyUs: { title: string; body: string }[];
  staff: { name: string; role: string; photoUrl?: string }[];
  reviews: { name: string; rating: number; body: string }[];
  phone: string | null; email: string | null;
  address: string | null; city: string | null; state: string | null; zip: string | null;
  hours: { day: string; open: string; close: string }[];
  socials: Record<string, string>;
  sections: Record<string, boolean>;
  pages: CustomPage[];
  nav: NavItem[];
  sidebar: SidebarBlock[];
  vdpButtonLabel: string | null;
  vdpButtonUrl: string | null;
};

export type CustomPage = { id: string; slug: string; title: string; body: string; inNav?: boolean; showSidebar?: boolean };
export type NavItem = { id: string; label: string; type: "home" | "inventory" | "financing" | "about" | "contact" | "page" | "link"; value?: string; visible?: boolean };
export type SidebarBlock = { id: string; type: "contactForm" | "address" | "hours" | "phone" | "pages" | "text"; title?: string; body?: string };

export type SiteVehicle = {
  id: string; year: number | null; make: string; model: string; trim: string; body: string;
  price: number; mileage: number; color: string; drivetrain: string; fuel: string;
  transmission: string; vin: string; image: string | null; photos: string[]; photoCount: number;
  title: string | null; subtitle: string | null; attributes: Record<string, unknown>;
};

function mapVehicle(v: {
  id: string; year: number | null; make: string | null; model: string | null; trim: string | null; bodyType: string | null;
  priceCents: number; mileage: number; exteriorColor: string | null; drivetrain: string | null;
  fuel: string | null; transmission: string | null; vin: string | null; photoUrls: unknown;
  title?: string | null; subtitle?: string | null; attributes?: unknown;
}): SiteVehicle {
  const photos = Array.isArray(v.photoUrls) ? (v.photoUrls as string[]) : [];
  return {
    id: v.id, year: v.year, make: v.make ?? "", model: v.model ?? "", trim: v.trim ?? "", body: v.bodyType ?? "",
    price: Math.round(v.priceCents / 100), mileage: v.mileage, color: v.exteriorColor ?? "",
    drivetrain: v.drivetrain ?? "", fuel: v.fuel ?? "", transmission: v.transmission ?? "",
    vin: v.vin ?? "", image: photos[0] ?? null, photos, photoCount: photos.length,
    title: v.title ?? null, subtitle: v.subtitle ?? null,
    attributes: (v.attributes && typeof v.attributes === "object" ? v.attributes : {}) as Record<string, unknown>,
  };
}

/** Published site config by slug (null if missing/unpublished). React-cached per request. */
export const getSite = cache(async (slug: string): Promise<SiteConfig | null> => {
  const w = await prisma.website.findUnique({ where: { slug } });
  if (!w || w.status !== "PUBLISHED") return null;
  const dealer = await prisma.dealership.findUnique({ where: { id: w.dealershipId }, select: { name: true, vertical: true } });
  return {
    slug: w.slug,
    dealershipName: dealer?.name ?? "Dealership",
    vertical: dealer?.vertical ?? "AUTOMOTIVE",
    template: w.template,
    logoUrl: w.logoUrl, heroImageUrl: w.heroImageUrl, primaryColor: w.primaryColor, headerStyle: w.headerStyle,
    headline: w.headline, intro: w.intro, ctaLabel: w.ctaLabel,
    aboutText: w.aboutText ?? "", financingText: w.financingText ?? "", tradeInText: w.tradeInText ?? "",
    whyUs: (Array.isArray(w.whyUs) ? w.whyUs : []) as SiteConfig["whyUs"],
    staff: (Array.isArray(w.staff) ? w.staff : []) as SiteConfig["staff"],
    reviews: (Array.isArray(w.reviews) ? w.reviews : []) as SiteConfig["reviews"],
    phone: w.phone, email: w.email, address: w.address, city: w.city, state: w.state, zip: w.zip,
    hours: (Array.isArray(w.hours) ? w.hours : []) as SiteConfig["hours"],
    socials: (w.socials ?? {}) as Record<string, string>,
    sections: (w.sections ?? {}) as Record<string, boolean>,
    pages: (Array.isArray(w.pages) ? w.pages : []) as CustomPage[],
    nav: (Array.isArray(w.nav) ? w.nav : []) as NavItem[],
    sidebar: (Array.isArray(w.sidebar) ? w.sidebar : []) as SidebarBlock[],
    vdpButtonLabel: w.vdpButtonLabel, vdpButtonUrl: w.vdpButtonUrl,
  };
});

export const getSitePage = cache(async (slug: string, pageSlug: string): Promise<CustomPage | null> => {
  const c = await getSite(slug);
  return c?.pages.find((p) => p.slug === pageSlug) ?? null;
});

/** The dealership id behind a slug (for inventory queries). */
export const getSiteDealershipId = cache(async (slug: string): Promise<string | null> => {
  const w = await prisma.website.findUnique({ where: { slug }, select: { dealershipId: true, status: true } });
  return w && w.status === "PUBLISHED" ? w.dealershipId : null;
});

/** All live vehicles for a published site. React-cached per request. */
export const getSiteVehicles = cache(async (slug: string): Promise<SiteVehicle[]> => {
  const dealershipId = await getSiteDealershipId(slug);
  if (!dealershipId) return [];
  const rows = await prisma.vehicle.findMany({
    where: { dealershipId, status: { in: ["AVAILABLE", "RESERVED"] } },
    orderBy: { createdAt: "desc" }, take: 200,
  });
  // list view only needs the cover + count — drop the heavy per-photo array from the payload
  return rows.map(mapVehicle).map((v) => ({ ...v, photos: v.image ? [v.image] : [] }));
});

export const getSiteVehicle = cache(async (slug: string, id: string): Promise<SiteVehicle | null> => {
  const dealershipId = await getSiteDealershipId(slug);
  if (!dealershipId) return null;
  const v = await prisma.vehicle.findFirst({ where: { id, dealershipId } });
  return v ? mapVehicle(v) : null;
});

export const accentOf = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : "#2b6ba4");
