"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, DollarSign, Tag, ChevronRight, ShieldCheck, BadgeCheck, Wrench } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { VehicleCard } from "./VehicleCard";
import { siteTheme } from "./theme";

const DEFAULT_WHY = [
  { title: "Hand-picked inventory", body: "Every vehicle is selected for quality, then priced to the live market." },
  { title: "Inspected & reconditioned", body: "Multi-point inspection before any car reaches our lot." },
  { title: "Simple financing", body: "Get pre-qualified in minutes — options for every credit situation." },
];

function SearchBar({ slug, accent, makes, preview }: { slug: string; accent: string; makes: string[]; preview?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState({ make: "", model: "", year: "", body: "" });
  const set = (k: keyof typeof q, v: string) => setQ((p) => ({ ...p, [k]: v }));
  const go = (extra?: Record<string, string>) => {
    if (preview) return;
    const params = new URLSearchParams();
    Object.entries({ ...q, ...extra }).forEach(([k, v]) => v && params.set(k, v));
    router.push(`/site/${slug}/inventory${params.toString() ? `?${params}` : ""}`);
  };
  const sel = "h-11 rounded-lg border border-black/12 bg-white px-3 text-[14px] outline-none";
  const years = Array.from({ length: 30 }, (_, i) => 2026 - i);
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-lg sm:p-5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        <select value={q.make} onChange={(e) => set("make", e.target.value)} className={sel}><option value="">Any make</option>{makes.map((m) => <option key={m}>{m}</option>)}</select>
        <input value={q.model} onChange={(e) => set("model", e.target.value)} placeholder="Model" className={sel} />
        <select value={q.year} onChange={(e) => set("year", e.target.value)} className={sel}><option value="">Any year</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
        <select value={q.body} onChange={(e) => set("body", e.target.value)} className={sel}><option value="">Any style</option>{["Sedan", "SUV", "Truck", "Coupe", "Van", "Hatchback"].map((b) => <option key={b}>{b}</option>)}</select>
        <button onClick={() => go()} className="h-11 rounded-lg text-[14px] font-semibold text-white" style={{ background: accent }}>Search</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[["Under $15k", { maxPrice: "15000" }], ["Under $20k", { maxPrice: "20000" }], ["Under $30k", { maxPrice: "30000" }], ["Trucks", { body: "Truck" }], ["SUVs", { body: "SUV" }]].map(([label, extra]) => (
          <button key={label as string} onClick={() => go(extra as Record<string, string>)} className="rounded-full border border-black/10 px-3 py-1 text-[12.5px] font-medium text-[#475569] hover:border-black/20">{label as string}</button>
        ))}
      </div>
    </div>
  );
}

export function SiteHome({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const C = ui.container;
  const makes = [...new Set(vehicles.map((v) => v.make))].sort().slice(0, 24);
  const featured = vehicles.slice(0, ui.card === "feature" ? 6 : 8);
  const why = config.whyUs.length ? config.whyUs : DEFAULT_WHY;
  const whyIcons = [ShieldCheck, BadgeCheck, Wrench];

  const heroImg = config.heroImageUrl;

  const featuredSection = (
    <section className={`mx-auto ${C} px-5 py-6`}>
      <div className="mb-6 flex items-end justify-between">
        <h2 className={ui.heading}>Our inventory</h2>
        <Link href={preview ? "#" : `/site/${config.slug}/inventory`} className="inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>View all<ChevronRight className="h-4 w-4" /></Link>
      </div>
      {featured.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 py-16 text-center text-[14px] text-[#64748b]">Fresh inventory is on the way. Check back soon.</div>
      ) : (
        <div className={`grid grid-cols-1 gap-5 ${ui.featuredCols}`}>{featured.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} variant={ui.card} preview={preview} />)}</div>
      )}
    </section>
  );

  const makesSection = makes.length > 0 && (
    <section className={`mx-auto ${C} px-5 py-12`}>
      <h2 className={`mb-5 ${ui.heading}`}>Shop by make</h2>
      <div className="flex flex-wrap gap-2.5">
        {makes.map((m) => <Link key={m} href={preview ? "#" : `/site/${config.slug}/inventory?make=${encodeURIComponent(m)}`} className={`border border-black/10 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#334155] transition hover:border-black/25 ${ui.chip}`}>{m}</Link>)}
      </div>
    </section>
  );

  return (
    <>
      {/* hero — distinct per template */}
      {ui.hero === "split" ? (
        <section className="w-full border-b border-black/5 bg-[#f8fafc]">
          <div className={`mx-auto grid ${C} items-center gap-8 px-5 py-16 lg:grid-cols-2`}>
            <div>
              <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-tight sm:text-[44px]">{config.headline}</h1>
              {config.intro && <p className="mt-4 max-w-[46ch] text-[15px] text-[#475569]">{config.intro}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={preview ? "#" : `/site/${config.slug}/inventory`} className="rounded-lg px-6 py-3 text-[14px] font-semibold text-white" style={{ background: accent }}>{config.ctaLabel}</Link>
                <Link href={preview ? "#" : `/site/${config.slug}/financing`} className="rounded-lg border border-black/15 px-6 py-3 text-[14px] font-semibold" style={{ color: accent }}>Get financing</Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
              {heroImg
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={heroImg} alt="" className="h-full max-h-[320px] w-full object-cover" />
                : <div className="p-8 text-center"><p className="text-[44px] font-extrabold tracking-tight" style={{ color: accent }}>{vehicles.length}</p><p className="text-[13.5px] font-medium text-[#64748b]">vehicles available right now</p></div>}
            </div>
          </div>
        </section>
      ) : ui.hero === "search" ? (
        <section className="w-full text-white" style={{ background: `linear-gradient(120deg, ${accent} 0%, #1e293b 100%)` }}>
          <div className={`mx-auto ${C} px-5 py-14 text-center`}>
            <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[38px]">{config.headline}</h1>
            {config.intro && <p className="mx-auto mt-2 max-w-[54ch] text-[14.5px] text-white/85">{config.intro}</p>}
          </div>
        </section>
      ) : (
        <section className="relative w-full overflow-hidden" style={heroImg ? undefined : { background: `linear-gradient(120deg, ${accent} 0%, #0f172a 100%)` }}>
          {heroImg && <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(15,23,42,0.88), rgba(15,23,42,0.55))" }} />
          </>}
          <div className={`relative mx-auto ${C} px-5 py-24 text-white sm:py-32`}>
            <h1 className="max-w-[16ch] text-[38px] font-extrabold leading-[1.03] tracking-tight sm:text-[60px]">{config.headline}</h1>
            {config.intro && <p className="mt-5 max-w-[56ch] text-[16px] text-white/85 sm:text-[18px]">{config.intro}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={preview ? "#" : `/site/${config.slug}/inventory`} className="rounded-lg bg-white px-7 py-3.5 text-[14px] font-semibold" style={{ color: accent }}>{config.ctaLabel}</Link>
              <Link href={preview ? "#" : `/site/${config.slug}/financing`} className="rounded-lg border border-white/40 px-7 py-3.5 text-[14px] font-semibold text-white hover:bg-white/10">Get financing</Link>
            </div>
          </div>
        </section>
      )}

      {/* search bar */}
      <section className={`mx-auto ${C} px-5 ${ui.hero === "split" ? "py-8" : "-mt-8"}`}><SearchBar slug={config.slug} accent={accent} makes={makes} preview={preview} /></section>

      {/* inventory-first templates lead with inventory */}
      {ui.inventoryFirst ? <>{featuredSection}{makesSection}</> : <>{makesSection}{featuredSection}</>}

      {/* three info cards */}
      <section className={`mx-auto ${C} px-5 py-12`}>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { Icon: Car, title: "Browse inventory", body: "Every vehicle we have, updated live.", href: `/site/${config.slug}/inventory`, cta: "Shop now" },
            { Icon: Tag, title: "Sell us your car", body: config.tradeInText || "Get a fair, fast offer on your trade.", href: `/site/${config.slug}/contact`, cta: "Get an offer" },
            { Icon: DollarSign, title: "Financing", body: config.financingText || "Pre-qualify in minutes — all credit welcome.", href: `/site/${config.slug}/financing`, cta: "Apply now" },
          ].map((c) => (
            <Link key={c.title} href={preview ? "#" : c.href} className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm transition hover:shadow-md">
              <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: accent }}><c.Icon className="h-5 w-5" /></span>
              <p className="mt-4 text-[16px] font-semibold">{c.title}</p>
              <p className="mt-1 line-clamp-2 text-[13.5px] text-[#64748b]">{c.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: accent }}>{c.cta}<ChevronRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* why choose us */}
      <section className="w-full bg-[#f8fafc] py-14">
        <div className={`mx-auto ${C} px-5`}>
          <h2 className={ui.heading}>Why {config.dealershipName}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {why.slice(0, 3).map((w, i) => {
              const Icon = whyIcons[i % whyIcons.length];
              return (
                <div key={i}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: accent }}><Icon className="h-5 w-5" /></span>
                  <p className="mt-3 text-[16px] font-semibold">{w.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#475569]">{w.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* welcome / about */}
      <section className={`mx-auto ${C} px-5 py-14`}>
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className={ui.heading}>Welcome to {config.dealershipName}</h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[#475569]">{config.aboutText || `At ${config.dealershipName}, we make buying your next vehicle simple and honest. Browse our live inventory, get pre-qualified online, and drive home with confidence.`}</p>
            <Link href={preview ? "#" : `/site/${config.slug}/about`} className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>About us<ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-8 text-center shadow-sm">
            <p className="text-[40px] font-extrabold tracking-tight" style={{ color: accent }}>{vehicles.length}</p>
            <p className="text-[13.5px] font-medium text-[#64748b]">vehicles available right now</p>
            <Link href={preview ? "#" : `/site/${config.slug}/inventory`} className="mt-4 inline-block rounded-lg px-5 py-2.5 text-[13.5px] font-semibold text-white" style={{ background: accent }}>Browse inventory</Link>
          </div>
        </div>
      </section>
    </>
  );
}
