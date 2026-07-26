"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ShieldCheck, BadgeCheck, Wrench, Banknote, Car, Star, Truck, CircleGauge } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { VehicleCard } from "./VehicleCard";
import { siteTheme, type TplUI } from "./theme";

const DEFAULT_WHY = [
  { title: "Hand-picked inventory", body: "Every vehicle is selected for quality and priced to the live market — never over sticker." },
  { title: "Inspected & reconditioned", body: "A rigorous multi-point inspection and full reconditioning before any car hits the lot." },
  { title: "Financing for everyone", body: "Get pre-qualified in minutes with lenders for every credit situation — all online." },
];
const REVIEWS = [
  { name: "Jordan M.", body: "Easiest car-buying experience I've had. No pressure, straight numbers, in and out in an hour.", rating: 5 },
  { name: "Alicia R.", body: "They got me financed when two other dealers couldn't. The team actually listened.", rating: 5 },
  { name: "Devon P.", body: "Truck was exactly as described and the price beat everything nearby. Would buy again.", rating: 5 },
];
const BODY_ICONS: Record<string, typeof Car> = { Truck, SUV: Car, Sedan: Car, Coupe: Car, Van: Truck, Hatchback: Car };

function SearchBar({ slug, accent, makes, ui, preview }: { slug: string; accent: string; makes: string[]; ui: TplUI; preview?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState({ make: "", model: "", body: "", maxPrice: "" });
  const set = (k: keyof typeof q, v: string) => setQ((p) => ({ ...p, [k]: v }));
  const go = (extra?: Record<string, string>) => {
    if (preview) return;
    const params = new URLSearchParams();
    Object.entries({ ...q, ...extra }).forEach(([k, v]) => v && params.set(k, v));
    router.push(`/site/${slug}/inventory${params.toString() ? `?${params}` : ""}`);
  };
  const sel = "h-12 rounded-lg border border-black/12 bg-white px-3 text-[14px] text-[#0f172a] outline-none focus:border-black/30";
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-3 shadow-xl sm:p-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <select value={q.make} onChange={(e) => set("make", e.target.value)} className={sel}><option value="">Any make</option>{makes.map((m) => <option key={m}>{m}</option>)}</select>
        <input value={q.model} onChange={(e) => set("model", e.target.value)} placeholder="Model" className={sel} />
        <select value={q.body} onChange={(e) => set("body", e.target.value)} className={sel}><option value="">Any type</option>{["Sedan", "SUV", "Truck", "Coupe", "Van", "Hatchback"].map((b) => <option key={b}>{b}</option>)}</select>
        <select value={q.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} className={sel}><option value="">Any price</option>{["15000", "20000", "30000", "45000", "60000"].map((p) => <option key={p} value={p}>Under ${(+p).toLocaleString()}</option>)}</select>
        <button onClick={() => go()} className={`inline-flex h-12 items-center justify-center gap-2 text-white ${ui.btnRadius} ${ui.btnCase}`} style={{ background: accent }}><Search className="h-4 w-4" />Search</button>
      </div>
    </div>
  );
}

export function SiteHome({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const C = ui.container;
  const link = (p: string) => (preview ? "#" : p);
  const makes = [...new Set(vehicles.map((v) => v.make))].sort().slice(0, 24);
  const bodies = [...new Set(vehicles.map((v) => v.body).filter(Boolean))];
  const featured = vehicles.slice(0, ui.card === "editorial" ? 6 : 8);
  const why = config.whyUs.length ? config.whyUs : DEFAULT_WHY;
  const whyIcons = [ShieldCheck, BadgeCheck, Wrench];
  const heroImg = config.heroImageUrl;
  const dark = ui.hero !== "light";

  const featuredSection = (
    <section className={`mx-auto ${C} px-5 py-14`}>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className={`${ui.eyebrow}`} style={{ color: accent }}>In stock now</p>
          <h2 className={`mt-1 ${ui.display} ${ui.h2}`}>Featured inventory</h2>
        </div>
        <Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>View all<ChevronRight className="h-4 w-4" /></Link>
      </div>
      {featured.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 py-16 text-center text-[14px] text-[#64748b]">Fresh inventory is on the way. Check back soon.</div>
      ) : (
        <div className={`grid grid-cols-1 gap-5 ${ui.featuredCols}`}>{featured.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} variant={ui.card} preview={preview} />)}</div>
      )}
    </section>
  );

  const bodySection = bodies.length > 0 && (
    <section className={`mx-auto ${C} px-5 py-6`}>
      <h2 className={`mb-5 ${ui.display} ${ui.h2}`}>Shop by type</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {bodies.slice(0, 6).map((b) => {
          const Icon = BODY_ICONS[b] ?? Car;
          const n = vehicles.filter((v) => v.body === b).length;
          return (
            <Link key={b} href={link(`/site/${config.slug}/inventory?body=${encodeURIComponent(b)}`)} className={`flex flex-col items-center gap-2 border border-black/10 bg-white p-5 text-center transition hover:border-black/25 hover:shadow-md ${ui.cardRadius}`}>
              <Icon className="h-7 w-7" style={{ color: accent }} strokeWidth={1.5} />
              <span className="text-[13.5px] font-semibold text-[#0f172a]">{b}</span>
              <span className="text-[11.5px] text-[#94a3b8]">{n} available</span>
            </Link>
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      {/* ── HERO ── */}
      {ui.hero === "light" ? (
        <section className="w-full border-b border-black/5 bg-gradient-to-b from-[#f1f5f9] to-white">
          <div className={`mx-auto ${C} px-5 pb-6 pt-16`}>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className={ui.eyebrow} style={{ color: accent }}>{config.dealershipName}</p>
                <h1 className={`mt-3 ${ui.display} ${ui.h1} text-[#0f172a]`}>{config.headline}</h1>
                {config.intro && <p className="mt-4 max-w-[48ch] text-[15.5px] leading-relaxed text-[#475569]">{config.intro}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={link(`/site/${config.slug}/inventory`)} className={`px-7 py-3.5 text-white ${ui.btnRadius} ${ui.btnCase}`} style={{ background: accent }}>{config.ctaLabel}</Link>
                  <Link href={link(`/site/${config.slug}/financing`)} className={`border border-black/15 px-7 py-3.5 text-[#0f172a] ${ui.btnRadius} ${ui.btnCase}`}>Get pre-qualified</Link>
                </div>
              </div>
              <div className={`overflow-hidden ${ui.cardRadius} border border-black/8 bg-white shadow-lg`}>
                {heroImg
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={heroImg} alt="" className="h-full max-h-[360px] w-full object-cover" />
                  : <div className="p-10 text-center"><p className="text-[52px] font-extrabold" style={{ color: accent }}>{vehicles.length}</p><p className="text-[14px] font-medium text-[#64748b]">vehicles ready to drive</p></div>}
              </div>
            </div>
            <div className="relative z-10 mt-8"><SearchBar slug={config.slug} accent={accent} makes={makes} ui={ui} preview={preview} /></div>
          </div>
        </section>
      ) : (
        <section className="relative w-full overflow-hidden" style={heroImg ? undefined : { background: `linear-gradient(120deg, ${accent} 0%, ${ui.band} 85%)` }}>
          {heroImg && <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: ui.hero === "cinematic" ? "linear-gradient(0deg, rgba(11,11,13,0.92), rgba(11,11,13,0.35))" : "linear-gradient(110deg, rgba(10,10,10,0.88), rgba(10,10,10,0.45))" }} />
          </>}
          <div className={`relative mx-auto ${C} px-5 ${ui.hero === "cinematic" ? "py-28 text-center sm:py-40" : "py-24 sm:py-32"}`}>
            <div className={ui.hero === "cinematic" ? "mx-auto max-w-[820px]" : "max-w-[760px]"}>
              <p className={ui.eyebrow} style={{ color: accent }}>{config.dealershipName}</p>
              <h1 className={`mt-3 ${ui.display} ${ui.h1} text-white`}>{config.headline}</h1>
              {config.intro && <p className={`mt-5 text-[16px] leading-relaxed text-white/85 sm:text-[18px] ${ui.hero === "cinematic" ? "mx-auto max-w-[60ch]" : "max-w-[56ch]"}`}>{config.intro}</p>}
              <div className={`mt-8 flex flex-wrap gap-3 ${ui.hero === "cinematic" ? "justify-center" : ""}`}>
                <Link href={link(`/site/${config.slug}/inventory`)} className={`bg-white px-8 py-4 ${ui.btnRadius} ${ui.btnCase}`} style={{ color: accent }}>{config.ctaLabel}</Link>
                <Link href={link(`/site/${config.slug}/financing`)} className={`border border-white/40 px-8 py-4 text-white hover:bg-white/10 ${ui.btnRadius} ${ui.btnCase}`}>Get pre-qualified</Link>
              </div>
            </div>
          </div>
          <div className={`relative z-10 mx-auto ${C} px-5 ${ui.hero === "cinematic" ? "pb-10" : "-mt-8 pb-2"}`}><SearchBar slug={config.slug} accent={accent} makes={makes} ui={ui} preview={preview} /></div>
        </section>
      )}

      {/* ── TRUST BAR ── */}
      <section className="w-full" style={{ background: ui.band }}>
        <div className={`mx-auto ${C} grid grid-cols-2 gap-6 px-5 py-8 lg:grid-cols-4`}>
          {[
            { Icon: Car, big: `${vehicles.length}`, small: "Vehicles in stock" },
            { Icon: Banknote, big: "All credit", small: "Financing available" },
            { Icon: ShieldCheck, big: "Inspected", small: "Multi-point checked" },
            { Icon: BadgeCheck, big: "Trade-ins", small: "Welcome & valued" },
          ].map((s) => (
            <div key={s.small} className="flex items-center gap-3">
              <s.Icon className="h-8 w-8 shrink-0" style={{ color: accent }} strokeWidth={1.5} />
              <div><p className={`${ui.display} text-[19px] font-bold leading-none text-white`}>{s.big}</p><p className="mt-1 text-[12px] text-white/60">{s.small}</p></div>
            </div>
          ))}
        </div>
      </section>

      {ui.inventoryFirst ? <>{featuredSection}{bodySection}</> : <>{bodySection}{featuredSection}</>}

      {/* ── FINANCING BAND ── */}
      <section className="w-full" style={{ background: `linear-gradient(120deg, ${accent} 0%, ${ui.band} 100%)` }}>
        <div className={`mx-auto ${C} flex flex-col items-start gap-5 px-5 py-14 md:flex-row md:items-center`}>
          <div className="flex-1">
            <p className={ui.eyebrow + " text-white/70"}>Financing</p>
            <h2 className={`mt-2 ${ui.display} ${ui.h2} text-white`}>Get pre-qualified in minutes.</h2>
            <p className="mt-2 max-w-[60ch] text-[14.5px] text-white/85">{config.financingText || "Good credit, bad credit, or building it — we work with lenders for every situation. It won't affect your credit score."}</p>
          </div>
          <Link href={link(`/site/${config.slug}/financing`)} className={`shrink-0 bg-white px-8 py-4 ${ui.btnRadius} ${ui.btnCase}`} style={{ color: accent }}>Start now</Link>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className={`mx-auto ${C} px-5 py-16`}>
        <p className={ui.eyebrow} style={{ color: accent }}>The difference</p>
        <h2 className={`mt-1 ${ui.display} ${ui.h2} text-[#0f172a]`}>Why {config.dealershipName}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {why.slice(0, 3).map((w, i) => {
            const Icon = whyIcons[i % whyIcons.length];
            return (
              <div key={i} className={`border border-black/8 bg-white p-6 ${ui.cardRadius}`}>
                <span className={`grid h-12 w-12 place-items-center text-white ${ui.cardRadius}`} style={{ background: accent }}><Icon className="h-6 w-6" /></span>
                <p className="mt-4 text-[16.5px] font-semibold text-[#0f172a]">{w.title}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#475569]">{w.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="w-full bg-[#f8fafc] py-16">
        <div className={`mx-auto ${C} px-5`}>
          <div className="flex items-center gap-3">
            <div className="flex" style={{ color: accent }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5" fill="currentColor" strokeWidth={0} />)}</div>
            <p className="text-[14px] font-semibold text-[#0f172a]">Loved by our customers</p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {REVIEWS.map((r) => (
              <div key={r.name} className={`border border-black/8 bg-white p-6 ${ui.cardRadius}`}>
                <div className="flex" style={{ color: accent }}>{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />)}</div>
                <p className="mt-3 text-[14px] leading-relaxed text-[#334155]">“{r.body}”</p>
                <p className="mt-3 text-[12.5px] font-semibold text-[#0f172a]">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className={`mx-auto ${C} px-5 py-16`}>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className={ui.eyebrow} style={{ color: accent }}>Who we are</p>
            <h2 className={`mt-1 ${ui.display} ${ui.h2} text-[#0f172a]`}>Welcome to {config.dealershipName}</h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-[#475569]">{config.aboutText || `At ${config.dealershipName}, we make buying your next vehicle simple and honest. Browse our live inventory, get pre-qualified online, and drive home with confidence.`}</p>
            <Link href={link(`/site/${config.slug}/about`)} className="mt-6 inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>More about us<ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className={`grid grid-cols-2 gap-4`}>
            {[[`${vehicles.length}`, "In stock"], [`${makes.length}`, "Brands"], ["100%", "Inspected"], ["5★", "Rated"]].map(([b, s]) => (
              <div key={s} className={`border border-black/8 bg-white p-6 text-center ${ui.cardRadius}`}>
                <p className={`${ui.display} text-[34px] font-bold`} style={{ color: accent }}>{b}</p>
                <p className="mt-1 text-[12.5px] font-medium text-[#64748b]">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
