"use client";

import { useEffect, useState } from "react";
import { apiFetch, getToken } from "@/lib/api";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { SiteHome } from "@/components/site/SiteHome";
import { accentOf, type SiteConfig, type SiteVehicle } from "@/lib/server/site";

/* Standalone site preview rendered inside the admin's iframe.
 * Being in an iframe means CSS media queries respond to the FRAME width, so the
 * mobile breakpoints (hamburger, single-column) fire correctly — unlike an inline
 * scaled div, which keys off the real desktop viewport and overflows. */
export default function WebsitePreview() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [vehicles, setVehicles] = useState<SiteVehicle[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    type W = Partial<SiteConfig> & { slug: string; primaryColor: string };
    type Inv = { id: string; year: number; make: string; model: string; trim: string; body?: string; price: number; mileage: number; color?: string; drivetrain?: string; fuel?: string; vin: string; image: string | null; photos?: number; status?: string };
    Promise.all([
      apiFetch<W>("/website"),
      apiFetch<{ items: Inv[] }>("/inventory").catch(() => ({ items: [] as Inv[] })),
    ]).then(([w, inv]) => {
      const override = new URLSearchParams(window.location.search).get("template");
      const tpl = (["MODERN","INVENTORY_FIRST","PREMIUM","CLASSIC","SPORT","MINIMAL","AURORA","QUIET","VELOCITY"].includes(override ?? "") ? override : (w.template as string)) as SiteConfig["template"];
      setConfig({
        slug: w.slug, dealershipName: (w.dealershipName as string) || "Your dealership", vertical: (w.vertical as string) || "AUTOMOTIVE", template: tpl || "MODERN",
        logoUrl: w.logoUrl ?? null, heroImageUrl: w.heroImageUrl ?? null, primaryColor: w.primaryColor, headerStyle: (w.headerStyle as string) || "auto", logoScale: (w.logoScale as string) || "md",
        headline: w.headline || "", intro: w.intro || "", ctaLabel: w.ctaLabel || "Browse inventory",
        aboutText: w.aboutText || "", financingText: w.financingText || "", tradeInText: w.tradeInText || "",
        whyUs: w.whyUs || [], staff: w.staff || [], reviews: w.reviews || [],
        phone: w.phone ?? null, email: w.email ?? null, address: w.address ?? null, city: w.city ?? null, state: w.state ?? null, zip: w.zip ?? null,
        hours: w.hours || [], socials: w.socials || {}, sections: w.sections || {},
        pages: w.pages || [], nav: w.nav || [], sidebar: w.sidebar || [], vdpButtonLabel: w.vdpButtonLabel ?? null, vdpButtonUrl: w.vdpButtonUrl ?? null,
        layout: w.layout || [],
        tree: w.tree || [],
      });
      setVehicles((inv.items || []).filter((v) => v.status !== "SOLD").map((v) => ({
        id: v.id, year: v.year, make: v.make, model: v.model, trim: v.trim, body: v.body ?? "",
        price: v.price, mileage: v.mileage, color: v.color ?? "", drivetrain: v.drivetrain ?? "", fuel: v.fuel ?? "",
        transmission: "", vin: v.vin, image: v.image, photos: v.image ? [v.image] : [], photoCount: typeof v.photos === "number" ? v.photos : (v.image ? 1 : 0),
        title: null, subtitle: null, attributes: {},
      })));
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  if (!ready) return <div className="grid min-h-screen place-items-center text-[13px] text-[#94a3b8]">Loading preview…</div>;
  if (!config) return <div className="grid min-h-screen place-items-center text-[13px] text-[#94a3b8]">Sign in to preview your site.</div>;

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[#0f172a]" style={{ ["--accent" as string]: accentOf(config.primaryColor) }}>
      <SiteHeader config={config} />
      <SiteHome config={config} vehicles={vehicles} preview />
      <SiteFooter config={config} />
    </div>
  );
}
