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
        cardOptions: w.cardOptions || {},
        header: w.header || {},
        searchOptions: w.searchOptions || {},
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

  // Builder mode (?builder=1): highlight editable elements and report clicks to the
  // parent shell so clicking anything on the real site opens its editor.
  const [builderMode, setBuilderMode] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || new URLSearchParams(window.location.search).get("builder") !== "1") return;
    setBuilderMode(true);

    // Auto-tag editable elements by matching the live config values to the rendered DOM —
    // works across every template with no per-template markup. Leaf elements only.
    const tag = (el: Element, key: string, label: string) => { if (!el.getAttribute("data-edit")) { el.setAttribute("data-edit", key); el.setAttribute("data-edit-label", label); } };
    const autoTag = () => {
      if (!config) return;
      const textFields: [keyof SiteConfig, string][] = [["headline", "Headline"], ["intro", "Intro"], ["ctaLabel", "Button label"], ["financingText", "Financing text"], ["aboutText", "About text"]];
      const els = Array.from(document.querySelectorAll("h1,h2,h3,h4,p,a,span,button,li")) as HTMLElement[];
      for (const [key, label] of textFields) {
        const val = config[key];
        if (typeof val !== "string" || !val.trim()) continue;
        const v = val.trim();
        els.forEach((el) => { if (el.children.length === 0 && (el.textContent ?? "").trim() === v) tag(el, key, label); });
      }
      if (config.heroImageUrl) Array.from(document.querySelectorAll("img")).forEach((img) => { if (img.getAttribute("src") === config.heroImageUrl) tag(img, "heroImageUrl", "Hero image"); });
      const firstSection = document.querySelector("main > section, body section");
      if (firstSection) tag(firstSection, "section:hero", "Hero section");
      // Whole inventory section: tag the grid that contains the vehicle cards, not each card.
      const card = document.querySelector("[data-vcard]");
      if (card?.parentElement) tag(card.parentElement, "section:inventory", "Vehicle cards");
    };
    autoTag();
    const retag = setTimeout(autoTag, 300); // catch late layout

    const closestEdit = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.("[data-edit]") as HTMLElement | null;
    const onOver = (e: MouseEvent) => {
      document.querySelectorAll(".krakd-hl").forEach((x) => x.classList.remove("krakd-hl"));
      closestEdit(e.target)?.classList.add("krakd-hl");
    };
    const onClick = (e: MouseEvent) => {
      // Builder mode: NEVER navigate. Every click is captured; editable elements open their editor.
      e.preventDefault(); e.stopPropagation();
      const el = closestEdit(e.target);
      if (el) window.parent.postMessage({ type: "krakd:edit", key: el.dataset.edit, label: el.dataset.editLabel }, "*");
    };
    const onSubmit = (e: Event) => e.preventDefault();
    document.addEventListener("mouseover", onOver);
    document.addEventListener("click", onClick, true); // capture — beat <Link>/<a> navigation
    document.addEventListener("submit", onSubmit, true);
    return () => { clearTimeout(retag); document.removeEventListener("mouseover", onOver); document.removeEventListener("click", onClick, true); document.removeEventListener("submit", onSubmit, true); };
  }, [ready]);

  if (!ready) return <div className="grid min-h-screen place-items-center text-[13px] text-[#94a3b8]">Loading preview…</div>;
  if (!config) return <div className="grid min-h-screen place-items-center text-[13px] text-[#94a3b8]">Sign in to preview your site.</div>;

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[#0f172a]" style={{ ["--accent" as string]: accentOf(config.primaryColor) }}>
      {builderMode && <style>{`.krakd-hl{outline:2px solid #2b6ba4;outline-offset:2px;border-radius:4px}[data-edit]{cursor:pointer!important}`}</style>}
      <SiteHeader config={config} />
      <SiteHome config={config} vehicles={vehicles} preview />
      <SiteFooter config={config} />
    </div>
  );
}
