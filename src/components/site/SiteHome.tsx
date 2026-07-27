"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ArrowRight, ArrowUpRight, ShieldCheck, BadgeCheck, Wrench, Car, Star, Truck, ChevronDown } from "lucide-react";
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

function useHome(config: SiteConfig, vehicles: SiteVehicle[], preview?: boolean) {
  const accent = accentOf(config.primaryColor);
  const link = (p: string) => (preview ? "#" : p);
  const makes = [...new Set(vehicles.map((v) => v.make))].sort().slice(0, 24);
  const bodies = [...new Set(vehicles.map((v) => v.body).filter(Boolean))];
  const why = config.whyUs.length ? config.whyUs : DEFAULT_WHY;
  const reviews = config.reviews.length ? config.reviews : REVIEWS;
  const show = (k: string) => config.sections?.[k] !== false;
  return { accent, link, makes, bodies, why, reviews, show };
}

function SearchBar({ config, accent, variant, preview }: { config: SiteConfig; accent: string; variant: "soft" | "sharp"; preview?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState({ make: "", model: "", body: "", maxPrice: "" });
  const set = (k: keyof typeof q, v: string) => setQ((p) => ({ ...p, [k]: v }));
  const go = () => { if (preview) return; const p = new URLSearchParams(); Object.entries(q).forEach(([k, v]) => v && p.set(k, v)); router.push(`/site/${config.slug}/inventory${p.toString() ? `?${p}` : ""}`); };
  const sharp = variant === "sharp";
  const sel = cn("h-12 border border-black/12 bg-white px-3 text-[14px] text-[#0f172a] outline-none", sharp ? "rounded-none" : "rounded-xl");
  return (
    <div className={sharp ? "border border-white/15 bg-[#0a0a0a] p-2" : "rounded-3xl bg-white p-3 shadow-xl sm:p-4"}>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <select value={q.make} onChange={(e) => set("make", e.target.value)} className={sel}><option value="">Any make</option>{["Toyota", "Honda", "Ford", "Chevrolet", "Tesla", "Jeep", "BMW", "Ram", "Nissan", "GMC"].map((m) => <option key={m}>{m}</option>)}</select>
        <input value={q.model} onChange={(e) => set("model", e.target.value)} placeholder="Model" className={sel} />
        <select value={q.body} onChange={(e) => set("body", e.target.value)} className={sel}><option value="">Any type</option>{["Sedan", "SUV", "Truck", "Coupe", "Van", "Hatchback"].map((b) => <option key={b}>{b}</option>)}</select>
        <select value={q.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} className={sel}><option value="">Any price</option>{["15000", "20000", "30000", "45000", "60000"].map((p) => <option key={p} value={p}>Under ${(+p).toLocaleString()}</option>)}</select>
        <button onClick={go} className={cn("col-span-2 inline-flex h-12 items-center justify-center gap-2 font-semibold text-white lg:col-span-1", sharp ? "rounded-none font-display uppercase tracking-[0.08em]" : "rounded-xl text-[14px]")} style={{ background: accent }}><Search className="h-4 w-4" />Search</button>
      </div>
    </div>
  );
}

function Empty() { return <div className="rounded-2xl border border-dashed border-black/10 py-16 text-center text-[14px] text-[#64748b]">Fresh inventory is on the way. Check back soon.</div>; }

/* ═══════════════════════ MODERN — bright, rounded, bento ═══════════════════════ */
function HomeModern({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, link, bodies, why, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 8);
  const C = "max-w-[1200px]";
  const heroImg = config.heroImageUrl;
  return (
    <>
      {/* bento hero */}
      <section className={`mx-auto ${C} px-5 pt-10`}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] p-8 text-white lg:col-span-2 lg:p-11" style={{ background: `linear-gradient(140deg, ${accent}, ${accent}cc)` }}>
            <div className="relative z-10">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">{config.dealershipName}</p>
              <h1 className="mt-3 max-w-[15ch] text-[38px] font-extrabold leading-[1.02] tracking-tight sm:text-[54px]">{config.headline}</h1>
              {config.intro && <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-white/85">{config.intro}</p>}
            </div>
            <div className="relative z-10 mt-8 flex flex-wrap gap-3">
              <Link href={link(`/site/${config.slug}/inventory`)} className="rounded-full bg-white px-6 py-3 text-[14px] font-semibold" style={{ color: accent }}>{config.ctaLabel}</Link>
              <Link href={link(`/site/${config.slug}/financing`)} className="rounded-full border border-white/50 px-6 py-3 text-[14px] font-semibold text-white hover:bg-white/10">Get pre-qualified</Link>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-sm">
              {heroImg
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={heroImg} alt="" className="h-[180px] w-full object-cover" />
                : <div className="grid h-[180px] place-items-center bg-[#eef3f8]"><Car className="h-10 w-10 text-[#94a3b8]" /></div>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[24px] bg-[#0f172a] p-5 text-white"><p className="text-[34px] font-extrabold leading-none">{vehicles.length}</p><p className="mt-1 text-[12px] text-white/60">in stock</p></div>
              <Link href={link(`/site/${config.slug}/financing`)} className="flex flex-col justify-between rounded-[24px] border border-black/8 bg-white p-5 transition hover:shadow-md"><span className="text-[13px] font-semibold text-[#0f172a]">Financing</span><span className="mt-6 inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: accent }}>Apply<ArrowUpRight className="h-4 w-4" /></span></Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-4"><SearchBar config={config} accent={accent} variant="soft" preview={preview} /></div>
      </section>

      {show("shopByType") && bodies.length > 0 && (
        <section className={`mx-auto ${C} px-5 py-12`}>
          <div className="flex flex-wrap gap-2.5">
            {bodies.slice(0, 8).map((b) => { const Icon = BODY_ICONS[b] ?? Car; const n = vehicles.filter((v) => v.body === b).length; return (
              <Link key={b} href={link(`/site/${config.slug}/inventory?body=${encodeURIComponent(b)}`)} className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#0f172a] transition hover:border-black/25"><Icon className="h-4 w-4" style={{ color: accent }} strokeWidth={2} />{b}<span className="text-[11.5px] text-[#94a3b8]">{n}</span></Link>
            ); })}
          </div>
        </section>
      )}

      <section className={`mx-auto ${C} px-5 py-4`}>
        <div className="mb-7 flex items-end justify-between"><h2 className="text-[26px] font-bold tracking-tight text-[#0f172a]">Featured</h2><Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>View all<ChevronRight className="h-4 w-4" /></Link></div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} variant="soft" preview={preview} />)}</div>}
      </section>

      <section className={`mx-auto ${C} px-5 py-14`}>
        <div className="grid gap-4 sm:grid-cols-3">
          {[["Browse", "Filter our live inventory and find your match."], ["Get pre-qualified", "Apply online in minutes — all credit welcome."], ["Drive home", "Pick it up, or we deliver. Simple."]].map(([t, b], i) => (
            <div key={t} className="rounded-[24px] border border-black/8 bg-white p-7"><span className="grid h-10 w-10 place-items-center rounded-full text-[15px] font-bold text-white" style={{ background: accent }}>{i + 1}</span><p className="mt-4 text-[16px] font-semibold text-[#0f172a]">{t}</p><p className="mt-1 text-[13.5px] text-[#475569]">{b}</p></div>
          ))}
        </div>
      </section>

      {show("financing") && (
        <section className={`mx-auto ${C} px-5 pb-4`}>
          <div className="flex flex-col items-start gap-5 rounded-[28px] p-8 text-white md:flex-row md:items-center md:p-11" style={{ background: `linear-gradient(140deg, ${accent}, #0f172a)` }}>
            <div className="flex-1"><h2 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Get pre-qualified in minutes.</h2><p className="mt-2 max-w-[58ch] text-[14.5px] text-white/85">{config.financingText || "All credit welcome. Won't affect your score."}</p></div>
            <Link href={link(`/site/${config.slug}/financing`)} className="shrink-0 rounded-full bg-white px-8 py-4 text-[14px] font-semibold" style={{ color: accent }}>Start now</Link>
          </div>
        </section>
      )}

      {show("whyUs") && <WhyGrid config={config} accent={accent} why={why} rounded="rounded-[24px]" heading="text-[26px] font-bold tracking-tight" />}
      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="cards" />}
      {show("about") && <AboutSplit config={config} accent={accent} vehicles={vehicles} />}
    </>
  );
}

/* ═══════════════════════ BOLD — black, industrial, ticker ═══════════════════════ */
function HomeBold({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, link, makes, why, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 8);
  const C = "max-w-[1320px]";
  const heroImg = config.heroImageUrl;
  const ticker = ["In stock now", "All-credit financing", "Trade-ins welcome", "Multi-point inspected", "Drive home today"];
  return (
    <>
      <section className="relative w-full overflow-hidden" style={{ background: "#0a0a0a" }}>
        {heroImg && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,8,10,0.92) 0%, rgba(8,8,10,0.5) 50%, rgba(8,8,10,0.1) 100%)" }} /></>}
        <div className={`relative mx-auto flex ${C} min-h-[560px] flex-col justify-center px-5 pt-16 pb-14 sm:min-h-[660px]`}>
          <p className="font-display text-[12px] font-semibold uppercase tracking-[0.3em]" style={{ color: accent }}>{config.dealershipName}</p>
          <h1 className="mt-3 max-w-[15ch] font-display text-[54px] font-bold uppercase leading-[0.88] text-white sm:text-[92px]">{config.headline}</h1>
          {config.intro && <p className="mt-5 max-w-[52ch] text-[16px] text-white/85 sm:text-[18px]">{config.intro}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={link(`/site/${config.slug}/inventory`)} className="bg-white px-8 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>{config.ctaLabel}</Link>
            <Link href={link(`/site/${config.slug}/financing`)} className="border border-white/50 px-8 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/10">Get approved</Link>
          </div>
        </div>
      </section>

      {/* marquee ticker */}
      <div className="w-full overflow-hidden py-3" style={{ background: accent }}>
        <div className="marquee">
          {[0, 1].map((rep) => <span key={rep} className="inline-flex items-center">{ticker.map((t) => <span key={t} className="inline-flex items-center font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-white"><span className="px-6">{t}</span><span className="opacity-50">/</span></span>)}</span>)}
        </div>
      </div>

      {/* search strip */}
      <section className={`mx-auto ${C} px-5 py-8`}><SearchBar config={config} accent={accent} variant="sharp" preview={preview} /></section>

      {/* inventory FIRST — dense */}
      <section className={`mx-auto ${C} px-5 pb-14`}>
        <div className="mb-6 flex items-end justify-between border-b-2 border-[#0a0a0a] pb-3"><h2 className="font-display text-[34px] font-bold uppercase tracking-tight text-[#0a0a0a]">Inventory</h2><Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-1 font-display text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>View all<ArrowRight className="h-4 w-4" /></Link></div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} variant="sharp" preview={preview} />)}</div>}
      </section>

      {show("trustBar") && <section className="w-full border-y border-white/10" style={{ background: "#0a0a0a" }}><div className={`mx-auto ${C} grid grid-cols-2 divide-x divide-white/10 lg:grid-cols-4`}>
        {[[`${vehicles.length}`, "In stock"], ["All", "Credit levels"], ["100%", "Inspected"], ["Fast", "Approvals"]].map(([big, small]) => (
          <div key={small} className="px-5 py-10"><p className="font-display text-[40px] font-bold uppercase leading-none text-white">{big}</p><p className="mt-2 font-display text-[12px] uppercase tracking-[0.18em] text-white/50">{small}</p></div>
        ))}
      </div></section>}

      {show("shopByType") && makes.length > 0 && <section className={`mx-auto ${C} px-5 py-14`}>
        <h2 className="mb-5 font-display text-[30px] font-bold uppercase tracking-tight text-[#0a0a0a]">Shop by make</h2>
        <div className="flex flex-wrap gap-2.5">{makes.map((m) => <Link key={m} href={link(`/site/${config.slug}/inventory?make=${encodeURIComponent(m)}`)} className="border-2 border-[#0a0a0a] px-5 py-2.5 font-display text-[14px] font-semibold uppercase tracking-wide text-[#0a0a0a] transition hover:bg-[#0a0a0a] hover:text-white">{m}</Link>)}</div>
      </section>}

      {show("financing") && <section className="w-full" style={{ background: `linear-gradient(120deg, ${accent} 0%, #0a0a0a 100%)` }}><div className={`mx-auto ${C} px-5 py-16 text-center`}>
        <h2 className="font-display text-[38px] font-bold uppercase tracking-tight text-white sm:text-[56px]">Get approved today</h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-[15px] text-white/85">{config.financingText || "Good credit, bad credit, or building it — we finance every situation. Won't touch your credit score."}</p>
        <Link href={link(`/site/${config.slug}/financing`)} className="mt-6 inline-block bg-white px-9 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.1em]" style={{ color: accent }}>Start now</Link>
      </div></section>}

      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="dark" />}
    </>
  );
}

/* ═══════════════════════ LUXE — ivory, serif, editorial gallery ═══════════════════════ */
const IVORY = "#f4f0e8";
const INK = "#191713";
function LuxeIndex({ n, label, accent }: { n: string; label: string; accent: string }) {
  return <div className="mb-6 flex items-center gap-4"><span className="font-display text-[13px] tracking-[0.3em]" style={{ color: accent }}>{n}</span><span className="h-px flex-1" style={{ background: "#00000022" }} /><span className="font-display text-[12px] uppercase tracking-[0.3em] text-[#191713]/70">{label}</span></div>;
}
function HomeLuxe({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, link, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 8);
  const C = "max-w-[1240px]";
  const heroImg = config.heroImageUrl;
  return (
    <div style={{ background: IVORY, color: INK }}>
      {/* cinematic hero with serif headline */}
      <section className="relative flex min-h-[88vh] w-full items-end overflow-hidden" style={{ background: INK }}>
        {heroImg && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,18,14,0.9) 0%, rgba(20,18,14,0.2) 55%, rgba(20,18,14,0.4) 100%)" }} /></>}
        <div className={`relative mx-auto ${C} w-full px-6 pb-16`}>
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.42em]" style={{ color: accent }}>{config.dealershipName}</p>
          <h1 className="mt-5 max-w-[16ch] font-serif text-[46px] font-light leading-[1.04] text-[#f4f0e8] sm:text-[76px]">{config.headline}</h1>
          {config.intro && <p className="mt-6 max-w-[52ch] font-serif text-[16px] font-light italic leading-relaxed text-white/80 sm:text-[19px]">{config.intro}</p>}
          <Link href={link(`/site/${config.slug}/inventory`)} className="mt-8 inline-block border border-[#f4f0e8]/60 px-10 py-4 font-display text-[12px] font-medium uppercase tracking-[0.22em] text-[#f4f0e8] transition hover:bg-[#f4f0e8] hover:text-[#191713]">{config.ctaLabel}</Link>
        </div>
        <ChevronDown className="absolute bottom-6 left-1/2 h-6 w-6 -translate-x-1/2 text-white/40" />
      </section>

      {/* statement */}
      <section className={`mx-auto ${C} px-6 py-28`}>
        <LuxeIndex n="01" label="The Collection" accent={accent} />
        <p className="max-w-[24ch] font-serif text-[34px] font-light leading-[1.25] sm:text-[52px]">{config.aboutText ? config.aboutText.split(". ")[0] + "." : `A considered selection of exceptional vehicles.`}</p>
      </section>

      {/* horizontal-scroll collection */}
      <section className="pb-6">
        <div className={`mx-auto ${C} mb-6 flex items-center justify-between px-6`}>
          <p className="font-serif text-[24px] font-light italic">Now showing</p>
          <Link href={link(`/site/${config.slug}/inventory`)} className="font-display text-[12px] font-medium uppercase tracking-[0.2em]" style={{ color: accent }}>Full collection →</Link>
        </div>
        {featured.length === 0 ? <div className={`mx-auto ${C} px-6`}><Empty /></div> : (
          <div className="hscroll flex gap-6 overflow-x-auto px-6 pb-4" style={{ scrollSnapType: "x mandatory" }}>
            {featured.map((v) => <div key={v.id} className="w-[320px] shrink-0 sm:w-[380px]" style={{ scrollSnapAlign: "start" }}><VehicleCard slug={config.slug} accent={accent} v={v} variant="editorial" preview={preview} /></div>)}
          </div>
        )}
      </section>

      {/* full-bleed statement band */}
      <section className="relative my-16 w-full overflow-hidden py-32" style={{ background: INK }}>
        {heroImg && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /><div className="absolute inset-0 bg-[#191713]/70" /></>}
        <div className={`relative mx-auto ${C} px-6 text-center`}>
          <p className="mx-auto max-w-[26ch] font-serif text-[30px] font-light leading-[1.35] text-[#f4f0e8] sm:text-[44px]">Where the search for something exceptional ends.</p>
          {show("financing") && <Link href={link(`/site/${config.slug}/financing`)} className="mt-10 inline-block px-10 py-4 font-display text-[12px] font-medium uppercase tracking-[0.22em]" style={{ background: accent, color: "#fff" }}>Arrange financing</Link>}
        </div>
      </section>

      {show("reviews") && (
        <section className={`mx-auto max-w-[780px] px-6 py-16 text-center`}>
          <LuxeIndex n="02" label="Testimonial" accent={accent} />
          <p className="mx-auto font-serif text-[26px] font-light leading-[1.4] sm:text-[34px]">“{reviews[0].body}”</p>
          <p className="mt-6 font-display text-[12px] font-medium uppercase tracking-[0.24em] text-[#191713]/60">— {reviews[0].name}</p>
        </section>
      )}

      {show("about") && (
        <section className={`mx-auto ${C} px-6 pb-28 pt-8`}>
          <LuxeIndex n="03" label="Visit" accent={accent} />
          <div className="grid items-end gap-8 lg:grid-cols-2">
            <h2 className="font-serif text-[34px] font-light leading-[1.15] sm:text-[46px]">{config.dealershipName}</h2>
            <div>
              <p className="text-[14.5px] font-light leading-relaxed text-[#191713]/75">{config.aboutText || "Experience our collection in person. Our team is on hand to make every detail effortless."}</p>
              <Link href={link(`/site/${config.slug}/contact`)} className="mt-6 inline-block border border-[#191713] px-10 py-4 font-display text-[12px] font-medium uppercase tracking-[0.22em] transition hover:bg-[#191713] hover:text-[#f4f0e8]">Make an enquiry</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ── shared blocks (Modern) ── */
function WhyGrid({ config, accent, why, rounded, heading }: { config: SiteConfig; accent: string; why: { title: string; body: string }[]; rounded: string; heading: string }) {
  const icons = [ShieldCheck, BadgeCheck, Wrench];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16">
      <h2 className={cn(heading, "text-[#0f172a]")}>Why {config.dealershipName}</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {why.slice(0, 3).map((w, i) => { const Icon = icons[i % icons.length]; return (
          <div key={i} className={cn("border border-black/8 bg-white p-7", rounded)}><span className={cn("grid h-12 w-12 place-items-center text-white", rounded)} style={{ background: accent }}><Icon className="h-6 w-6" /></span><p className="mt-4 text-[16.5px] font-semibold text-[#0f172a]">{w.title}</p><p className="mt-1.5 text-[13.5px] leading-relaxed text-[#475569]">{w.body}</p></div>
        ); })}
      </div>
    </section>
  );
}
function Reviews({ config, accent, reviews, variant }: { config: SiteConfig; accent: string; reviews: { name: string; rating: number; body: string }[]; variant: "cards" | "dark" }) {
  void config;
  if (variant === "dark") return (
    <section className="w-full py-16" style={{ background: "#0a0a0a" }}><div className="mx-auto max-w-[1320px] px-5">
      <div className="mb-6 flex items-center gap-3"><div className="flex" style={{ color: accent }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5" fill="currentColor" strokeWidth={0} />)}</div><p className="font-display text-[14px] font-semibold uppercase tracking-wide text-white">Rated by our customers</p></div>
      <div className="grid gap-5 sm:grid-cols-3">{reviews.map((r) => <div key={r.name} className="border border-white/15 p-6"><p className="text-[14px] leading-relaxed text-white/85">“{r.body}”</p><p className="mt-3 font-display text-[12.5px] font-semibold uppercase tracking-wide text-white">{r.name}</p></div>)}</div>
    </div></section>
  );
  return (
    <section className="w-full bg-[#f8fafc] py-16"><div className="mx-auto max-w-[1200px] px-5">
      <div className="flex items-center gap-3"><div className="flex" style={{ color: accent }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5" fill="currentColor" strokeWidth={0} />)}</div><p className="text-[14px] font-semibold text-[#0f172a]">Loved by our customers</p></div>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">{reviews.map((r) => <div key={r.name} className="rounded-[24px] border border-black/8 bg-white p-7"><div className="flex" style={{ color: accent }}>{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />)}</div><p className="mt-3 text-[14px] leading-relaxed text-[#334155]">“{r.body}”</p><p className="mt-3 text-[12.5px] font-semibold text-[#0f172a]">{r.name}</p></div>)}</div>
    </div></section>
  );
}
function AboutSplit({ config, accent, vehicles }: { config: SiteConfig; accent: string; vehicles: SiteVehicle[] }) {
  const makes = [...new Set(vehicles.map((v) => v.make))];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16"><div className="grid items-center gap-10 lg:grid-cols-2">
      <div><p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>Who we are</p><h2 className="mt-1 text-[26px] font-bold tracking-tight text-[#0f172a]">Welcome to {config.dealershipName}</h2><p className="mt-4 text-[14.5px] leading-relaxed text-[#475569]">{config.aboutText || `At ${config.dealershipName}, we make buying your next vehicle simple and honest.`}</p><Link href={`/site/${config.slug}/about`} className="mt-6 inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>More about us<ChevronRight className="h-4 w-4" /></Link></div>
      <div className="grid grid-cols-2 gap-4">{[[`${vehicles.length}`, "In stock"], [`${makes.length}`, "Brands"], ["100%", "Inspected"], ["5★", "Rated"]].map(([b, s]) => <div key={s} className="rounded-[24px] border border-black/8 bg-white p-6 text-center"><p className="text-[34px] font-bold" style={{ color: accent }}>{b}</p><p className="mt-1 text-[12.5px] font-medium text-[#64748b]">{s}</p></div>)}</div>
    </div></section>
  );
}

export function SiteHome({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  if (config.template === "INVENTORY_FIRST") return <HomeBold config={config} vehicles={vehicles} preview={preview} />;
  if (config.template === "PREMIUM") return <HomeLuxe config={config} vehicles={vehicles} preview={preview} />;
  return <HomeModern config={config} vehicles={vehicles} preview={preview} />;
}
