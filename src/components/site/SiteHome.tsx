"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ArrowRight, ShieldCheck, BadgeCheck, Wrench, Car, Star, Truck, ChevronDown } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { cn } from "@/lib/cn";
import { VehicleCard } from "./VehicleCard";

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

function useHome(config: SiteConfig, vehicles: SiteVehicle[]) {
  const accent = accentOf(config.primaryColor);
  const link = (p: string) => p;
  const makes = [...new Set(vehicles.map((v) => v.make))].sort().slice(0, 24);
  const bodies = [...new Set(vehicles.map((v) => v.body).filter(Boolean))];
  const why = config.whyUs.length ? config.whyUs : DEFAULT_WHY;
  const reviews = config.reviews.length ? config.reviews : REVIEWS;
  const show = (k: string) => config.sections?.[k] !== false;
  return { accent, link, makes, bodies, why, reviews, show };
}

/* ── shared search bar (styled per template) ── */
function SearchBar({ config, accent, variant, preview }: { config: SiteConfig; accent: string; variant: "soft" | "sharp" | "line"; preview?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState({ make: "", model: "", body: "", maxPrice: "" });
  const set = (k: keyof typeof q, v: string) => setQ((p) => ({ ...p, [k]: v }));
  const go = () => { if (preview) return; const p = new URLSearchParams(); Object.entries(q).forEach(([k, v]) => v && p.set(k, v)); router.push(`/site/${config.slug}/inventory${p.toString() ? `?${p}` : ""}`); };
  const rounded = variant === "sharp" ? "rounded-none" : variant === "line" ? "rounded-none border-b" : "rounded-lg";
  const wrap = variant === "sharp" ? "bg-[#0a0a0a] p-2 border border-white/15" : variant === "line" ? "bg-transparent" : "rounded-2xl bg-white p-3 shadow-xl sm:p-4";
  const sel = cn("h-12 border border-black/12 bg-white px-3 text-[14px] text-[#0f172a] outline-none", rounded, variant === "line" && "border-x-0 border-t-0 bg-transparent text-white placeholder:text-white/60");
  return (
    <div className={wrap}>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <select value={q.make} onChange={(e) => set("make", e.target.value)} className={sel}><option value="">Any make</option>{["Toyota", "Honda", "Ford", "Chevrolet", "Tesla", "Jeep", "BMW", "Ram"].map((m) => <option key={m}>{m}</option>)}</select>
        <input value={q.model} onChange={(e) => set("model", e.target.value)} placeholder="Model" className={sel} />
        <select value={q.body} onChange={(e) => set("body", e.target.value)} className={sel}><option value="">Any type</option>{["Sedan", "SUV", "Truck", "Coupe", "Van", "Hatchback"].map((b) => <option key={b}>{b}</option>)}</select>
        <select value={q.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} className={sel}><option value="">Any price</option>{["15000", "20000", "30000", "45000", "60000"].map((p) => <option key={p} value={p}>Under ${(+p).toLocaleString()}</option>)}</select>
        <button onClick={go} className={cn("col-span-2 inline-flex h-12 items-center justify-center gap-2 font-semibold text-white lg:col-span-1", variant === "sharp" ? "rounded-none font-display uppercase tracking-[0.08em]" : variant === "line" ? "rounded-none uppercase tracking-[0.16em] text-[12px]" : "rounded-lg text-[14px]")} style={{ background: accent }}><Search className="h-4 w-4" />Search</button>
      </div>
    </div>
  );
}

/* ═══════════════════════ MODERN — light, friendly, CarMax-style ═══════════════════════ */
function HomeModern({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, link, bodies, why, reviews, show } = useHome(config, vehicles);
  const featured = vehicles.slice(0, 8);
  const C = "max-w-[1200px]";
  return (
    <>
      <section className="w-full border-b border-black/5 bg-gradient-to-b from-[#eef3f8] to-white">
        <div className={`mx-auto ${C} px-5 pb-8 pt-16`}>
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>{config.dealershipName}</p>
              <h1 className="mt-3 text-[38px] font-extrabold leading-[1.03] tracking-tight text-[#0f172a] sm:text-[52px]">{config.headline}</h1>
              {config.intro && <p className="mt-4 max-w-[46ch] text-[15.5px] leading-relaxed text-[#475569]">{config.intro}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={link(`/site/${config.slug}/inventory`)} className="rounded-xl px-7 py-3.5 text-[14px] font-semibold text-white" style={{ background: accent }}>{config.ctaLabel}</Link>
                <Link href={link(`/site/${config.slug}/financing`)} className="rounded-xl border border-black/15 px-7 py-3.5 text-[14px] font-semibold text-[#0f172a]">Get pre-qualified</Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-xl">
              {config.heroImageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={config.heroImageUrl} alt="" className="h-[300px] w-full object-cover" />
                : <div className="grid h-[300px] place-items-center"><p className="text-[54px] font-extrabold" style={{ color: accent }}>{vehicles.length}</p></div>}
            </div>
          </div>
          <div className="relative z-10 mt-8"><SearchBar config={config} accent={accent} variant="soft" preview={preview} /></div>
        </div>
      </section>

      {show("shopByType") && bodies.length > 0 && (
        <section className={`mx-auto ${C} px-5 py-12`}>
          <h2 className="mb-5 text-[24px] font-bold tracking-tight text-[#0f172a]">Shop by type</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {bodies.slice(0, 6).map((b) => { const Icon = BODY_ICONS[b] ?? Car; const n = vehicles.filter((v) => v.body === b).length; return (
              <Link key={b} href={link(`/site/${config.slug}/inventory?body=${encodeURIComponent(b)}`)} className="flex flex-col items-center gap-2 rounded-2xl border border-black/10 bg-white p-5 text-center transition hover:shadow-md"><Icon className="h-7 w-7" style={{ color: accent }} strokeWidth={1.5} /><span className="text-[13.5px] font-semibold text-[#0f172a]">{b}</span><span className="text-[11.5px] text-[#94a3b8]">{n} available</span></Link>
            ); })}
          </div>
        </section>
      )}

      <section className={`mx-auto ${C} px-5 py-6`}>
        <div className="mb-7 flex items-end justify-between"><h2 className="text-[24px] font-bold tracking-tight text-[#0f172a]">Featured inventory</h2><Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>View all<ChevronRight className="h-4 w-4" /></Link></div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} variant="soft" preview={preview} />)}</div>}
      </section>

      <section className="w-full bg-[#f8fafc] py-16"><div className={`mx-auto ${C} px-5`}>
        <h2 className="text-[24px] font-bold tracking-tight text-[#0f172a]">How it works</h2>
        <div className="mt-7 grid gap-6 sm:grid-cols-3">
          {[["Browse", "Filter our live inventory and find your match."], ["Get pre-qualified", "Apply online in minutes — all credit welcome."], ["Drive home", "Pick it up or we deliver. Simple."]].map(([t, b], i) => (
            <div key={t} className="rounded-2xl border border-black/8 bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-full text-[15px] font-bold text-white" style={{ background: accent }}>{i + 1}</span><p className="mt-3 text-[16px] font-semibold text-[#0f172a]">{t}</p><p className="mt-1 text-[13.5px] text-[#475569]">{b}</p></div>
          ))}
        </div>
      </div></section>

      {show("financing") && <CtaBand config={config} accent={accent} rounded="rounded-xl" />}
      {show("whyUs") && <WhyGrid config={config} accent={accent} why={why} rounded="rounded-2xl" heading="text-[24px] font-bold tracking-tight" />}
      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="cards" />}
      {show("about") && <AboutSplit config={config} accent={accent} vehicles={vehicles} />}
    </>
  );
}

/* ═══════════════════════ BOLD — dark, inventory-first, condensed ═══════════════════════ */
function HomeBold({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, link, makes, why, reviews, show } = useHome(config, vehicles);
  const featured = vehicles.slice(0, 8);
  const C = "max-w-[1320px]";
  const heroImg = config.heroImageUrl;
  return (
    <>
      <section className="relative w-full overflow-hidden" style={{ background: "#0a0a0a" }}>
        {heroImg && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,8,10,0.92) 0%, rgba(8,8,10,0.55) 45%, rgba(8,8,10,0.15) 100%)" }} /></>}
        <div className={`relative mx-auto flex ${C} min-h-[560px] flex-col justify-center px-5 pt-20 pb-16 sm:min-h-[680px]`}>
          <p className="font-display text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: accent }}>{config.dealershipName}</p>
          <h1 className="mt-3 max-w-[16ch] font-display text-[52px] font-bold uppercase leading-[0.9] text-white sm:text-[86px]">{config.headline}</h1>
          {config.intro && <p className="mt-5 max-w-[54ch] text-[16px] text-white/85 sm:text-[18px]">{config.intro}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={link(`/site/${config.slug}/inventory`)} className="bg-white px-8 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>{config.ctaLabel}</Link>
            <Link href={link(`/site/${config.slug}/financing`)} className="border border-white/50 px-8 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/10">Get approved</Link>
          </div>
        </div>
        <div className={`relative mx-auto ${C} px-5 pb-6`}><SearchBar config={config} accent={accent} variant="sharp" preview={preview} /></div>
      </section>

      {/* inventory FIRST */}
      <section className={`mx-auto ${C} px-5 py-14`}>
        <div className="mb-7 flex items-end justify-between border-b-2 border-[#0a0a0a] pb-3"><h2 className="font-display text-[34px] font-bold uppercase tracking-tight text-[#0a0a0a]">In stock now</h2><Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-1 font-display text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>View all<ArrowRight className="h-4 w-4" /></Link></div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} variant="sharp" preview={preview} />)}</div>}
      </section>

      {/* dark stat strip */}
      {show("trustBar") && <section className="w-full" style={{ background: "#0a0a0a" }}><div className={`mx-auto ${C} grid grid-cols-2 gap-6 px-5 py-10 lg:grid-cols-4`}>
        {[[`${vehicles.length}`, "In stock"], ["All credit", "Financing"], ["Inspected", "Every unit"], ["Trade-ins", "Welcome"]].map(([big, small]) => (
          <div key={small}><p className="font-display text-[34px] font-bold uppercase leading-none text-white">{big}</p><p className="mt-1 font-display text-[12px] uppercase tracking-[0.16em] text-white/50">{small}</p></div>
        ))}
      </div></section>}

      {/* shop by make — bold outlined */}
      {show("shopByType") && makes.length > 0 && <section className={`mx-auto ${C} px-5 py-14`}>
        <h2 className="mb-5 font-display text-[30px] font-bold uppercase tracking-tight text-[#0a0a0a]">Shop by make</h2>
        <div className="flex flex-wrap gap-2.5">{makes.map((m) => <Link key={m} href={link(`/site/${config.slug}/inventory?make=${encodeURIComponent(m)}`)} className="border-2 border-[#0a0a0a] px-5 py-2.5 font-display text-[14px] font-semibold uppercase tracking-wide text-[#0a0a0a] transition hover:bg-[#0a0a0a] hover:text-white">{m}</Link>)}</div>
      </section>}

      {show("financing") && <section className="w-full" style={{ background: `linear-gradient(120deg, ${accent} 0%, #0a0a0a 100%)` }}><div className={`mx-auto ${C} px-5 py-16 text-center`}>
        <h2 className="font-display text-[36px] font-bold uppercase tracking-tight text-white sm:text-[52px]">Get approved today</h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-[15px] text-white/85">{config.financingText || "Good credit, bad credit, or building it — we finance every situation. Won't touch your credit score."}</p>
        <Link href={link(`/site/${config.slug}/financing`)} className="mt-6 inline-block bg-white px-9 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: accent }}>Start now</Link>
      </div></section>}

      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="dark" />}
      {show("whyUs") && <WhyGrid config={config} accent={accent} why={why} rounded="rounded-none" heading="font-display text-[30px] font-bold uppercase tracking-tight" />}
    </>
  );
}

/* ═══════════════════════ LUXE — cinematic, editorial, spacious ═══════════════════════ */
function HomeLuxe({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, link, why, reviews, show } = useHome(config, vehicles);
  const featured = vehicles.slice(0, 6);
  const C = "max-w-[1180px]";
  const heroImg = config.heroImageUrl;
  return (
    <>
      <section className="relative flex min-h-[86vh] w-full items-center justify-center overflow-hidden" style={{ background: "#0b0b0d" }}>
        {heroImg && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,13,0.9) 0%, rgba(11,11,13,0.35) 45%, rgba(11,11,13,0.55) 100%)" }} /></>}
        <div className={`relative mx-auto ${C} px-5 text-center`}>
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.4em]" style={{ color: accent }}>{config.dealershipName}</p>
          <h1 className="mx-auto mt-5 max-w-[18ch] font-display text-[44px] font-light uppercase leading-[1.05] tracking-[0.06em] text-white sm:text-[68px]">{config.headline}</h1>
          {config.intro && <p className="mx-auto mt-6 max-w-[58ch] text-[15px] font-light leading-relaxed text-white/80 sm:text-[17px]">{config.intro}</p>}
          <Link href={link(`/site/${config.slug}/inventory`)} className="mt-9 inline-block border border-white/60 px-10 py-4 font-display text-[12px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-[#0b0b0d]">{config.ctaLabel}</Link>
        </div>
        <ChevronDown className="absolute bottom-6 left-1/2 h-6 w-6 -translate-x-1/2 text-white/50" />
      </section>

      {/* editorial statement */}
      <section className={`mx-auto ${C} px-5 py-24 text-center`}>
        <p className="font-display text-[12px] font-medium uppercase tracking-[0.3em]" style={{ color: accent }}>The collection</p>
        <p className="mx-auto mt-5 max-w-[42ch] text-[26px] font-light leading-[1.4] text-[#0b0b0d] sm:text-[32px]">{config.aboutText ? config.aboutText.split(". ")[0] + "." : `A considered selection of exceptional vehicles, presented by ${config.dealershipName}.`}</p>
      </section>

      {/* the collection — large editorial cards */}
      <section className={`mx-auto ${C} px-5 pb-8`}>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">{featured.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} variant="editorial" preview={preview} />)}</div>}
        <div className="mt-10 text-center"><Link href={link(`/site/${config.slug}/inventory`)} className="inline-block border border-[#0b0b0d] px-10 py-4 font-display text-[12px] font-medium uppercase tracking-[0.2em] text-[#0b0b0d] transition hover:bg-[#0b0b0d] hover:text-white">View the full collection</Link></div>
      </section>

      {/* full-bleed statement band */}
      <section className="relative w-full overflow-hidden py-28" style={{ background: "#0b0b0d" }}>
        {heroImg && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" /><div className="absolute inset-0 bg-[#0b0b0d]/70" /></>}
        <div className={`relative mx-auto ${C} px-5 text-center`}>
          <p className="mx-auto max-w-[40ch] font-display text-[24px] font-light uppercase leading-[1.5] tracking-[0.08em] text-white sm:text-[30px]">Where the search for something exceptional ends.</p>
          <Link href={link(`/site/${config.slug}/financing`)} className="mt-8 inline-block px-10 py-4 font-display text-[12px] font-medium uppercase tracking-[0.2em] text-[#0b0b0d]" style={{ background: "#fff" }}>Arrange financing</Link>
        </div>
      </section>

      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="editorial" />}

      {/* visit — spacious */}
      {show("about") && <section className={`mx-auto ${C} px-5 py-24 text-center`}>
        <p className="font-display text-[12px] font-medium uppercase tracking-[0.3em]" style={{ color: accent }}>Visit</p>
        <h2 className="mx-auto mt-4 max-w-[20ch] font-display text-[30px] font-light uppercase tracking-[0.1em] text-[#0b0b0d]">{config.dealershipName}</h2>
        <p className="mx-auto mt-4 max-w-[50ch] text-[14.5px] font-light leading-relaxed text-[#475569]">{config.aboutText || `Experience our collection in person. Our team is on hand to make every detail effortless.`}</p>
        <Link href={link(`/site/${config.slug}/contact`)} className="mt-7 inline-block border border-[#0b0b0d] px-10 py-4 font-display text-[12px] font-medium uppercase tracking-[0.2em] text-[#0b0b0d] transition hover:bg-[#0b0b0d] hover:text-white">Make an enquiry</Link>
      </section>}
    </>
  );
}

/* ── shared building blocks ── */
function Empty() { return <div className="rounded-2xl border border-dashed border-black/10 py-16 text-center text-[14px] text-[#64748b]">Fresh inventory is on the way. Check back soon.</div>; }

function CtaBand({ config, accent, rounded }: { config: SiteConfig; accent: string; rounded: string }) {
  return (
    <section className="w-full" style={{ background: `linear-gradient(120deg, ${accent} 0%, #0f172a 100%)` }}>
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-5 py-14 md:flex-row md:items-center">
        <div className="flex-1"><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">Financing</p><h2 className="mt-2 text-[26px] font-bold tracking-tight text-white sm:text-[30px]">Get pre-qualified in minutes.</h2><p className="mt-2 max-w-[60ch] text-[14.5px] text-white/85">{config.financingText || "Good credit, bad credit, or building it — we work with lenders for every situation. It won't affect your credit score."}</p></div>
        <Link href={`/site/${config.slug}/financing`} className={cn("shrink-0 bg-white px-8 py-4 text-[14px] font-semibold", rounded)} style={{ color: accent }}>Start now</Link>
      </div>
    </section>
  );
}

function WhyGrid({ config, accent, why, rounded, heading }: { config: SiteConfig; accent: string; why: { title: string; body: string }[]; rounded: string; heading: string }) {
  const icons = [ShieldCheck, BadgeCheck, Wrench];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16">
      <h2 className={cn(heading, "text-[#0f172a]")}>Why {config.dealershipName}</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {why.slice(0, 3).map((w, i) => { const Icon = icons[i % icons.length]; return (
          <div key={i} className={cn("border border-black/8 bg-white p-6", rounded)}><span className={cn("grid h-12 w-12 place-items-center text-white", rounded)} style={{ background: accent }}><Icon className="h-6 w-6" /></span><p className="mt-4 text-[16.5px] font-semibold text-[#0f172a]">{w.title}</p><p className="mt-1.5 text-[13.5px] leading-relaxed text-[#475569]">{w.body}</p></div>
        ); })}
      </div>
    </section>
  );
}

function Reviews({ config, accent, reviews, variant }: { config: SiteConfig; accent: string; reviews: { name: string; rating: number; body: string }[]; variant: "cards" | "dark" | "editorial" }) {
  if (variant === "dark") return (
    <section className="w-full py-16" style={{ background: "#0a0a0a" }}><div className="mx-auto max-w-[1320px] px-5">
      <div className="mb-6 flex items-center gap-3"><div className="flex" style={{ color: accent }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5" fill="currentColor" strokeWidth={0} />)}</div><p className="font-display text-[14px] font-semibold uppercase tracking-wide text-white">Rated by our customers</p></div>
      <div className="grid gap-5 sm:grid-cols-3">{reviews.map((r) => <div key={r.name} className="border border-white/15 p-6"><p className="text-[14px] leading-relaxed text-white/85">“{r.body}”</p><p className="mt-3 font-display text-[12.5px] font-semibold uppercase tracking-wide text-white">{r.name}</p></div>)}</div>
    </div></section>
  );
  if (variant === "editorial") return (
    <section className="mx-auto max-w-[820px] px-5 py-24 text-center">
      <div className="flex justify-center" style={{ color: accent }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />)}</div>
      <p className="mx-auto mt-6 max-w-[46ch] text-[22px] font-light leading-[1.5] text-[#0b0b0d]">“{reviews[0].body}”</p>
      <p className="mt-5 font-display text-[12px] font-medium uppercase tracking-[0.2em] text-[#64748b]">— {reviews[0].name}</p>
    </section>
  );
  return (
    <section className="w-full bg-[#f8fafc] py-16"><div className="mx-auto max-w-[1200px] px-5">
      <div className="flex items-center gap-3"><div className="flex" style={{ color: accent }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5" fill="currentColor" strokeWidth={0} />)}</div><p className="text-[14px] font-semibold text-[#0f172a]">Loved by our customers</p></div>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">{reviews.map((r) => <div key={r.name} className="rounded-2xl border border-black/8 bg-white p-6"><div className="flex" style={{ color: accent }}>{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />)}</div><p className="mt-3 text-[14px] leading-relaxed text-[#334155]">“{r.body}”</p><p className="mt-3 text-[12.5px] font-semibold text-[#0f172a]">{r.name}</p></div>)}</div>
    </div></section>
  );
}

function AboutSplit({ config, accent, vehicles }: { config: SiteConfig; accent: string; vehicles: SiteVehicle[] }) {
  const makes = [...new Set(vehicles.map((v) => v.make))];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16"><div className="grid items-center gap-10 lg:grid-cols-2">
      <div><p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>Who we are</p><h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#0f172a]">Welcome to {config.dealershipName}</h2><p className="mt-4 text-[14.5px] leading-relaxed text-[#475569]">{config.aboutText || `At ${config.dealershipName}, we make buying your next vehicle simple and honest.`}</p><Link href={`/site/${config.slug}/about`} className="mt-6 inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>More about us<ChevronRight className="h-4 w-4" /></Link></div>
      <div className="grid grid-cols-2 gap-4">{[[`${vehicles.length}`, "In stock"], [`${makes.length}`, "Brands"], ["100%", "Inspected"], ["5★", "Rated"]].map(([b, s]) => <div key={s} className="rounded-2xl border border-black/8 bg-white p-6 text-center"><p className="text-[34px] font-bold" style={{ color: accent }}>{b}</p><p className="mt-1 text-[12.5px] font-medium text-[#64748b]">{s}</p></div>)}</div>
    </div></section>
  );
}

export function SiteHome({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  if (config.template === "INVENTORY_FIRST") return <HomeBold config={config} vehicles={vehicles} preview={preview} />;
  if (config.template === "PREMIUM") return <HomeLuxe config={config} vehicles={vehicles} preview={preview} />;
  return <HomeModern config={config} vehicles={vehicles} preview={preview} />;
}
