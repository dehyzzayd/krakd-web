"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ArrowRight, ArrowUpRight, ShieldCheck, BadgeCheck, Wrench, Car, Star, Truck, ChevronDown } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { cn } from "@/lib/cn";
import { VehicleCard } from "./VehicleCard";
import { vertical as verticalDef } from "./verticals";
import { EditorialHome } from "./EditorialHome";
import { BrokerageHome } from "./BrokerageHome";
import { ContractorHome } from "./ContractorHome";
import { CustomSections } from "./CustomSections";
import { NodeRenderer } from "./NodeRenderer";

const REVIEWS = [
  { name: "Jordan M.", body: "Easiest car-buying experience I've had. No pressure, straight numbers, in and out in an hour.", rating: 5 },
  { name: "Alicia R.", body: "They got me financed when two other dealers couldn't. The team actually listened.", rating: 5 },
  { name: "Devon P.", body: "Truck was exactly as described and the price beat everything nearby. Would buy again.", rating: 5 },
];
const BODY_ICONS: Record<string, typeof Car> = { Truck, SUV: Car, Sedan: Car, Coupe: Car, Van: Truck, Hatchback: Car };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function useHome(config: SiteConfig, vehicles: SiteVehicle[], preview?: boolean) {
  const accent = accentOf(config.primaryColor);
  const def = verticalDef(config.vertical);
  const m = def.market;
  const link = (p: string) => (preview ? "#" : p);
  const makes = [...new Set(vehicles.map((v) => v.make).filter(Boolean))].sort().slice(0, 24);
  const bodies = [...new Set(vehicles.map((v) => v.body).filter(Boolean))];
  const why = config.whyUs.length ? config.whyUs : m.defaultWhy;
  const reviews = config.reviews.length ? config.reviews : REVIEWS;
  // financing marketing bands only render for verticals that use them (automotive); other verticals keep the Financing page
  const show = (k: string) => (k === "financing" ? config.sections?.[k] !== false && m.showFinanceBands : config.sections?.[k] !== false);
  const auto = (config.vertical ?? "AUTOMOTIVE") === "AUTOMOTIVE";
  return { accent, def, m, auto, link, makes, bodies, why, reviews, show };
}

function SearchBar({ config, vehicles, accent, variant, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; accent: string; variant: "soft" | "sharp"; preview?: boolean }) {
  const router = useRouter();
  const def = verticalDef(config.vertical);
  const checks = def.facets.filter((f) => f.kind === "check").slice(0, 2);
  const maxFacet = def.facets.find((f) => f.kind === "max") as Extract<(typeof def.facets)[number], { kind: "max" }> | undefined;
  const [q, setQ] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setQ((p) => ({ ...p, [k]: v }));
  const go = () => { if (preview) return; const p = new URLSearchParams(); Object.entries(q).forEach(([k, v]) => v && p.set(k, v)); router.push(`/site/${config.slug}/inventory${p.toString() ? `?${p}` : ""}`); };
  const optsFor = (f: (typeof checks)[number]) => [...new Set(vehicles.map((v) => f.value(v)).filter(Boolean))].sort();
  const sharp = variant === "sharp";
  const sel = cn("h-12 border border-black/12 bg-white px-3 text-[14px] text-[#0f172a] outline-none", sharp ? "rounded-none" : "rounded-xl");
  return (
    <div className={sharp ? "border border-white/15 bg-[#0a0a0a] p-2" : "rounded-3xl bg-white p-3 shadow-xl sm:p-4"}>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <input value={q.q ?? ""} onChange={(e) => set("q", e.target.value)} placeholder={def.searchPlaceholder.replace("Search ", "").replace("…", "")} className={sel} />
        {checks.map((f) => (
          <select key={f.key} value={q[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className={cn(sel, "capitalize")}>
            <option value="">Any {f.label.toLowerCase()}</option>
            {optsFor(f).map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        {maxFacet && (
          <select value={q[maxFacet.key] ?? ""} onChange={(e) => set(maxFacet.key, e.target.value)} className={sel}><option value="">Any price</option>{maxFacet.steps.map((p) => <option key={p} value={p}>Under {maxFacet.fmt(p)}</option>)}</select>
        )}
        <button onClick={go} className={cn("col-span-2 inline-flex h-12 items-center justify-center gap-2 font-semibold text-white lg:col-span-1", sharp ? "rounded-none font-display uppercase tracking-[0.08em]" : "rounded-xl text-[14px]")} style={{ background: accent }}><Search className="h-4 w-4" />Search</button>
      </div>
    </div>
  );
}

function Empty() { return <div className="rounded-2xl border border-dashed border-black/10 py-16 text-center text-[14px] text-[#64748b]">Fresh listings are on the way. Check back soon.</div>; }

/* ═══════════════════════ MODERN — bright, rounded, bento ═══════════════════════ */
function HomeModern({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, def, m, link, bodies, why, reviews, show } = useHome(config, vehicles, preview);
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
              <Link href={link(`/site/${config.slug}/${m.heroSecondary.to}`)} className="rounded-full border border-white/50 px-6 py-3 text-[14px] font-semibold text-white hover:bg-white/10">{m.heroSecondary.label}</Link>
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
              <div className="rounded-[24px] bg-[#0f172a] p-5 text-white"><p className="text-[34px] font-extrabold leading-none">{vehicles.length}</p><p className="mt-1 text-[12px] text-white/60">{def.dash.units} live</p></div>
              <Link href={link(`/site/${config.slug}/${m.heroSecondary.to}`)} className="flex flex-col justify-between rounded-[24px] border border-black/8 bg-white p-5 transition hover:shadow-md"><span className="text-[13px] font-semibold text-[#0f172a]">{m.financeNav}</span><span className="mt-6 inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: accent }}>Apply<ArrowUpRight className="h-4 w-4" /></span></Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-4"><SearchBar config={config} vehicles={vehicles} accent={accent} variant="soft" preview={preview} /></div>
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
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="soft" preview={preview} />)}</div>}
      </section>

      <section className={`mx-auto ${C} px-5 py-14`}>
        <div className="grid gap-4 sm:grid-cols-3">
          {m.steps.map((st, i) => (
            <div key={st.t} className="rounded-[24px] border border-black/8 bg-white p-7"><span className="grid h-10 w-10 place-items-center rounded-full text-[15px] font-bold text-white" style={{ background: accent }}>{i + 1}</span><p className="mt-4 text-[16px] font-semibold text-[#0f172a]">{st.t}</p><p className="mt-1 text-[13.5px] text-[#475569]">{st.b}</p></div>
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
  const { accent, def, m, auto, link, makes, why, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 8);
  const C = "max-w-[1320px]";
  const heroImg = config.heroImageUrl;
  const ticker = m.ticker;
  const trust: [string, string][] = auto
    ? [[`${vehicles.length}`, "In stock"], ["All", "Credit levels"], ["100%", "Inspected"], ["Fast", "Approvals"]]
    : [[`${vehicles.length}`, `Live ${def.plural}`], ...m.stats];
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
            <Link href={link(`/site/${config.slug}/${m.heroSecondary.to}`)} className="border border-white/50 px-8 py-4 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/10">{auto ? "Get approved" : m.financeBtn}</Link>
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
      <section className={`mx-auto ${C} px-5 py-8`}><SearchBar config={config} vehicles={vehicles} accent={accent} variant="sharp" preview={preview} /></section>

      {/* inventory FIRST — dense */}
      <section className={`mx-auto ${C} px-5 pb-14`}>
        <div className="mb-6 flex items-end justify-between border-b-2 border-[#0a0a0a] pb-3"><h2 className="font-display text-[34px] font-bold uppercase tracking-tight text-[#0a0a0a]">{cap(def.plural)}</h2><Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-1 font-display text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>View all<ArrowRight className="h-4 w-4" /></Link></div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="sharp" preview={preview} />)}</div>}
      </section>

      {show("trustBar") && <section className="w-full border-y border-white/10" style={{ background: "#0a0a0a" }}><div className={`mx-auto ${C} grid grid-cols-2 divide-x divide-white/10 lg:grid-cols-4`}>
        {trust.map(([big, small]) => (
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HomeLuxe({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, def, link, reviews, show } = useHome(config, vehicles, preview);
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
        <p className="max-w-[24ch] font-serif text-[34px] font-light leading-[1.25] sm:text-[52px]">{config.aboutText ? config.aboutText.split(". ")[0] + "." : `A considered selection of exceptional ${def.plural}.`}</p>
      </section>

      {/* horizontal-scroll collection */}
      <section className="pb-6">
        <div className={`mx-auto ${C} mb-6 flex items-center justify-between px-6`}>
          <p className="font-serif text-[24px] font-light italic">Now showing</p>
          <Link href={link(`/site/${config.slug}/inventory`)} className="font-display text-[12px] font-medium uppercase tracking-[0.2em]" style={{ color: accent }}>Full collection →</Link>
        </div>
        {featured.length === 0 ? <div className={`mx-auto ${C} px-6`}><Empty /></div> : (
          <div className="hscroll flex gap-6 overflow-x-auto px-6 pb-4" style={{ scrollSnapType: "x mandatory" }}>
            {featured.map((v) => <div key={v.id} className="w-[320px] shrink-0 sm:w-[380px]" style={{ scrollSnapAlign: "start" }}><VehicleCard vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="editorial" preview={preview} /></div>)}
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
  const def = verticalDef(config.vertical);
  const auto = (config.vertical ?? "AUTOMOTIVE") === "AUTOMOTIVE";
  const makes = [...new Set(vehicles.map((v) => v.make).filter(Boolean))];
  const fallbackAbout = auto
    ? `At ${config.dealershipName}, we make buying your next vehicle simple and honest.`
    : `At ${config.dealershipName}, we make finding your next ${def.noun} simple and personal.`;
  const stats: [string, string][] = auto
    ? [[`${vehicles.length}`, "In stock"], [`${makes.length}`, "Brands"], ["100%", "Inspected"], ["5★", "Rated"]]
    : [[`${vehicles.length}`, `Live ${def.plural}`], ...def.market.stats];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16"><div className="grid items-center gap-10 lg:grid-cols-2">
      <div><p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>Who we are</p><h2 className="mt-1 text-[26px] font-bold tracking-tight text-[#0f172a]">Welcome to {config.dealershipName}</h2><p className="mt-4 text-[14.5px] leading-relaxed text-[#475569]">{config.aboutText || fallbackAbout}</p><Link href={`/site/${config.slug}/about`} className="mt-6 inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: accent }}>More about us<ChevronRight className="h-4 w-4" /></Link></div>
      <div className="grid grid-cols-2 gap-4">{stats.map(([b, s]) => <div key={s} className="rounded-[24px] border border-black/8 bg-white p-6 text-center"><p className="text-[34px] font-bold" style={{ color: accent }}>{b}</p><p className="mt-1 text-[12.5px] font-medium text-[#64748b]">{s}</p></div>)}</div>
    </div></section>
  );
}

/* ═══════════════════════ CLASSIC — corporate franchise, blue, boxy ═══════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HomeClassic({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, def, m, auto, link, makes, why, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 8);
  const C = "max-w-[1280px]"; const navy = "#10233f";
  const heroImg = config.heroImageUrl;
  const chips = auto ? ["New", "Used", "Certified"] : ["Browse all", "Newest", "Featured"];
  const trust: [string, string][] = auto
    ? [[`${vehicles.length}`, "Vehicles in stock"], ["All credit", "Financing"], ["Inspected", "Every vehicle"], ["Trade-ins", "Top dollar"]]
    : [[`${vehicles.length}`, `Live ${def.plural}`], ...m.stats];
  return (
    <>
      <section className="relative w-full overflow-hidden" style={{ background: navy }}>
        {heroImg && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" /><div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(16,35,63,0.95), rgba(16,35,63,0.6))" }} /></>}
        <div className={`relative mx-auto ${C} px-5 py-16`}>
          <div className="flex flex-wrap gap-2">{chips.map((t) => <Link key={t} href={link(`/site/${config.slug}/inventory`)} className="rounded-md bg-white/10 px-4 py-1.5 text-[12.5px] font-bold uppercase tracking-wide text-white hover:bg-white/20">{t}</Link>)}</div>
          <h1 className="mt-4 max-w-[18ch] text-[34px] font-bold leading-[1.05] text-white sm:text-[48px]">{config.headline}</h1>
          {config.intro && <p className="mt-3 max-w-[52ch] text-[15px] text-white/80">{config.intro}</p>}
          <div className="relative z-10 mt-6"><SearchBar config={config} vehicles={vehicles} accent={accent} variant="soft" preview={preview} /></div>
        </div>
      </section>
      {show("trustBar") && <section className="w-full border-b border-black/8 bg-white"><div className={`mx-auto ${C} grid grid-cols-2 gap-4 px-5 py-6 lg:grid-cols-4`}>
        {trust.map(([b, s]) => (
          <div key={s} className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-white" style={{ background: accent }}><BadgeCheck className="h-5 w-5" /></span><div><p className="text-[15px] font-bold text-[#0f172a]">{b}</p><p className="text-[11.5px] text-[#64748b]">{s}</p></div></div>
        ))}
      </div></section>}
      <section className={`mx-auto ${C} px-5 py-12`}>
        <div className="mb-6 flex items-end justify-between"><h2 className="text-[24px] font-bold tracking-tight text-[#0f172a]">{auto ? "Featured vehicles" : `Featured ${def.plural}`}</h2><Link href={link(`/site/${config.slug}/inventory`)} className="text-[13.5px] font-bold uppercase tracking-wide" style={{ color: accent }}>View all →</Link></div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="soft" preview={preview} />)}</div>}
      </section>
      {show("shopByType") && makes.length > 0 && <section className="w-full bg-[#f1f5f9] py-12"><div className={`mx-auto ${C} px-5`}><h2 className="mb-5 text-[22px] font-bold tracking-tight text-[#0f172a]">Shop by make</h2><div className="flex flex-wrap gap-2.5">{makes.map((m) => <Link key={m} href={link(`/site/${config.slug}/inventory?make=${encodeURIComponent(m)}`)} className="rounded-md border border-black/12 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#0f172a] hover:border-black/30">{m}</Link>)}</div></div></section>}
      {show("financing") && <section className={`mx-auto ${C} grid gap-4 px-5 py-12 md:grid-cols-2`}>
        {[["Value your trade", "Get a real number in minutes.", `/site/${config.slug}/contact`], ["Get pre-approved", config.financingText || "All credit welcome — apply online.", `/site/${config.slug}/financing`]].map(([t, b, href]) => (
          <Link key={t} href={link(href)} className="rounded-lg border border-black/10 p-7 transition hover:shadow-md" style={{ background: navy }}><p className="text-[20px] font-bold text-white">{t}</p><p className="mt-1.5 text-[13.5px] text-white/75">{b}</p><span className="mt-4 inline-block rounded-md px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-white" style={{ background: accent }}>Start →</span></Link>
        ))}
      </section>}
      {show("whyUs") && <WhyGrid config={config} accent={accent} why={why} rounded="rounded-lg" heading="text-[24px] font-bold tracking-tight" />}
      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="cards" />}
      {show("about") && <AboutSplit config={config} accent={accent} vehicles={vehicles} />}
    </>
  );
}

/* ═══════════════════════ SPORT — charcoal, angular, italic ═══════════════════════ */
function HomeSport({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, def, m, auto, link, makes, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 6);
  const C = "max-w-[1320px]"; const char = "#141416";
  const heroImg = config.heroImageUrl;
  const trust: [string, string][] = auto
    ? [[`${vehicles.length}`, "In the lineup"], ["Certified", "Inspection"], ["All credit", "Financing"], ["Trade", "Welcome"]]
    : [[`${vehicles.length}`, `Live ${def.plural}`], ...m.stats];
  return (
    <>
      <section className="relative w-full overflow-hidden" style={{ background: char }}>
        {heroImg && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0" style={{ background: "linear-gradient(75deg, rgba(20,20,22,0.95) 30%, rgba(20,20,22,0.3) 100%)" }} /></>}
        <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: accent }} />
        <div className={`relative mx-auto flex ${C} min-h-[560px] flex-col justify-center px-5 py-16 sm:min-h-[640px]`}>
          <p className="font-display text-[12px] font-semibold uppercase italic tracking-[0.24em]" style={{ color: accent }}>{config.dealershipName}</p>
          <h1 className="mt-3 max-w-[14ch] font-display text-[52px] font-bold uppercase italic leading-[0.9] text-white sm:text-[88px]">{config.headline}</h1>
          {config.intro && <p className="mt-5 max-w-[50ch] text-[16px] text-white/80 sm:text-[18px]">{config.intro}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={link(`/site/${config.slug}/inventory`)} className="px-8 py-4 font-display text-[13px] font-semibold uppercase italic tracking-[0.1em] text-white" style={{ background: accent }}>View the lineup</Link>
            <Link href={link(`/site/${config.slug}/financing`)} className="border border-white/40 px-8 py-4 font-display text-[13px] font-semibold uppercase italic tracking-[0.1em] text-white hover:bg-white/10">Finance</Link>
          </div>
        </div>
      </section>
      {show("trustBar") && <section className="w-full" style={{ background: accent }}><div className={`mx-auto ${C} grid grid-cols-2 gap-6 px-5 py-6 text-white lg:grid-cols-4`}>
        {trust.map(([b, s]) => <div key={s}><p className="font-display text-[26px] font-bold uppercase italic leading-none">{b}</p><p className="mt-1 font-display text-[11px] uppercase tracking-[0.16em] text-white/70">{s}</p></div>)}
      </div></section>}
      <section className={`mx-auto ${C} px-5 py-14`}>
        <h2 className="mb-6 font-display text-[34px] font-bold uppercase italic tracking-tight text-[#141416]">{auto ? "The lineup" : cap(def.plural)}</h2>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="sharp" preview={preview} />)}</div>}
        <div className="mt-8"><Link href={link(`/site/${config.slug}/inventory`)} className="inline-block px-8 py-3.5 font-display text-[13px] font-semibold uppercase italic tracking-[0.1em] text-white" style={{ background: char }}>See all {def.plural}</Link></div>
      </section>
      {show("shopByType") && makes.length > 0 && <section className="w-full py-14" style={{ background: char }}><div className={`mx-auto ${C} px-5`}><h2 className="mb-5 font-display text-[28px] font-bold uppercase italic tracking-tight text-white">By make</h2><div className="flex flex-wrap gap-2.5">{makes.map((m) => <Link key={m} href={link(`/site/${config.slug}/inventory?make=${encodeURIComponent(m)}`)} className="border border-white/25 px-5 py-2.5 font-display text-[14px] font-semibold uppercase italic text-white transition hover:bg-white hover:text-[#141416]">{m}</Link>)}</div></div></section>}
      {show("financing") && <section className="w-full" style={{ background: `linear-gradient(75deg, ${char} 40%, ${accent})` }}><div className={`mx-auto ${C} px-5 py-16`}><h2 className="max-w-[16ch] font-display text-[38px] font-bold uppercase italic tracking-tight text-white sm:text-[52px]">{config.financingText ? "Financing, handled." : "Own it. Today."}</h2><Link href={link(`/site/${config.slug}/financing`)} className="mt-6 inline-block bg-white px-9 py-4 font-display text-[13px] font-semibold uppercase italic tracking-[0.1em] text-[#141416]">Get approved</Link></div></section>}
      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="dark" />}
    </>
  );
}

/* ═══════════════════════ MINIMAL — airy, hairlines, whitespace ═══════════════════════ */
function HomeMinimal({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, def, auto, link, makes, why, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 6);
  const C = "max-w-[1160px]";
  const heroImg = config.heroImageUrl;
  const rule = "border-t border-black/10";
  return (
    <div className="bg-white">
      <section className={`mx-auto ${C} px-6 pb-14 pt-20`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.24em]" style={{ color: accent }}>{config.dealershipName}</p>
        <h1 className="mt-5 max-w-[20ch] text-[40px] font-medium leading-[1.06] tracking-[-0.02em] text-[#111] sm:text-[60px]">{config.headline}</h1>
        {config.intro && <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-[#555]">{config.intro}</p>}
        <div className="mt-7 flex flex-wrap items-center gap-6">
          <Link href={link(`/site/${config.slug}/inventory`)} className="border-b-2 pb-1 text-[13px] font-medium uppercase tracking-[0.16em] text-[#111]" style={{ borderColor: accent }}>{config.ctaLabel} →</Link>
          <Link href={link(`/site/${config.slug}/financing`)} className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#999] hover:text-[#111]">Financing</Link>
        </div>
      </section>
      {heroImg && <section className={`mx-auto ${C} px-6`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={heroImg} alt="" className="h-[280px] w-full object-cover sm:h-[440px]" /></section>}
      <section className={`mx-auto ${C} ${rule} mt-14 px-6 py-14`}>
        <div className="mb-8 flex items-baseline justify-between"><div className="flex items-baseline gap-4"><span className="text-[12px] tracking-[0.2em] text-[#999]">01</span><h2 className="text-[24px] font-medium tracking-tight text-[#111]">{auto ? "Selected inventory" : `Selected ${def.plural}`}</h2></div><Link href={link(`/site/${config.slug}/inventory`)} className="text-[12px] uppercase tracking-[0.16em] hover:opacity-60" style={{ color: accent }}>All →</Link></div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="sharp" preview={preview} />)}</div>}
      </section>
      {show("shopByType") && makes.length > 0 && <section className={`mx-auto ${C} ${rule} px-6 py-14`}><div className="flex items-baseline gap-4"><span className="text-[12px] tracking-[0.2em] text-[#999]">02</span><h2 className="text-[24px] font-medium tracking-tight text-[#111]">Browse</h2></div><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">{makes.map((m) => <Link key={m} href={link(`/site/${config.slug}/inventory?make=${encodeURIComponent(m)}`)} className="text-[15px] font-medium text-[#555] transition hover:text-[#111]">{m}</Link>)}</div></section>}
      {show("whyUs") && <section className={`mx-auto ${C} ${rule} px-6 py-14`}><div className="flex items-baseline gap-4"><span className="text-[12px] tracking-[0.2em] text-[#999]">03</span><h2 className="text-[24px] font-medium tracking-tight text-[#111]">Why {config.dealershipName}</h2></div><div className="mt-8 grid gap-10 sm:grid-cols-3">{why.slice(0, 3).map((wy, i) => <div key={i}><p className="text-[14px] font-semibold text-[#111]">{wy.title}</p><p className="mt-2 text-[13.5px] leading-relaxed text-[#666]">{wy.body}</p></div>)}</div></section>}
      {show("reviews") && <section className={`mx-auto ${C} ${rule} px-6 py-16 text-center`}><p className="mx-auto max-w-[44ch] text-[22px] font-medium leading-[1.4] text-[#111]">“{reviews[0].body}”</p><p className="mt-5 text-[12px] uppercase tracking-[0.2em] text-[#999]">— {reviews[0].name}</p></section>}
      {show("financing") && <section className={`mx-auto ${C} ${rule} px-6 py-16`}><div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><h2 className="text-[26px] font-medium tracking-tight text-[#111]">Get pre-qualified in minutes.</h2><Link href={link(`/site/${config.slug}/financing`)} className="border-b-2 pb-1 text-[13px] font-medium uppercase tracking-[0.16em] text-[#111]" style={{ borderColor: accent }}>Start →</Link></div></section>}
    </div>
  );
}

/* ═══════════════════════ AURORA — dark navy, lowercase display, lime + purple ═══════════════════════ */
function HomeAurora({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, def, m, auto, link, why, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 6);
  const C = "max-w-[1240px]"; const purple = "#6d5ce7"; const navy = "#161227";
  const words = config.headline.trim().split(" ");
  const lead = words.slice(0, -1).join(" "); const last = words.slice(-1)[0] ?? "";
  const bodyCount = (b: string) => vehicles.filter((v) => v.body === b).length;
  const attrCounts = (key: string): [string, number][] => {
    const mp = new Map<string, number>();
    for (const v of vehicles) { const k = String((v.attributes as Record<string, unknown> | undefined)?.[key] ?? ""); if (k) mp.set(k, (mp.get(k) ?? 0) + 1); }
    return [...mp.entries()];
  };
  const cats: [string, number][] = auto
    ? [["SUV", bodyCount("SUV")], ["Sedan", bodyCount("Sedan")], ["Truck", bodyCount("Truck")], ["EV", vehicles.filter((v) => v.fuel.toLowerCase().includes("electric")).length], ["Under $35k", vehicles.filter((v) => v.price > 0 && v.price <= 35000).length], ["In stock", vehicles.length]]
    : attrCounts("propertyType");
  const energy: [string, number][] = auto
    ? [["Electric", vehicles.filter((v) => v.fuel.toLowerCase().includes("electric")).length], ["Hybrid", vehicles.filter((v) => v.fuel.toLowerCase().includes("hybrid")).length], ["Gas", vehicles.filter((v) => !/electric|hybrid/i.test(v.fuel)).length]]
    : [];
  return (
    <div style={{ background: navy }}>
      {/* hero */}
      <section className="relative w-full overflow-hidden">
        <div className={`relative mx-auto grid ${C} items-center gap-8 px-5 py-16 lg:grid-cols-2`}>
          <div className="relative z-10">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>{auto ? "Curated cars · Clear numbers" : `Curated ${def.plural} · Clear numbers`}</p>
            <h1 className="mt-4 text-[46px] font-extrabold lowercase leading-[0.98] tracking-tight text-white sm:text-[68px]">{lead} <span style={{ color: accent }}>{last}</span></h1>
            {config.intro && <p className="mt-4 max-w-[44ch] text-[15px] text-white/70">{config.intro}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={link(`/site/${config.slug}/inventory`)} className="rounded-full px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em]" style={{ background: accent, color: navy }}>{config.ctaLabel}</Link>
              <Link href={link(`/site/${config.slug}/${m.heroSecondary.to}`)} className="rounded-full border border-white/25 px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-white hover:bg-white/10">{auto ? "Value my car" : m.heroSecondary.label}</Link>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute -left-10 top-1/2 hidden aspect-square w-[420px] -translate-y-1/2 rounded-full border-2 lg:block" style={{ borderColor: accent, opacity: 0.35 }} />
            <div className="relative overflow-hidden rounded-3xl bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {config.heroImageUrl ? <img src={config.heroImageUrl} alt="" className="aspect-[16/12] w-full object-cover" /> : <div className="grid aspect-[16/12] place-items-center"><Car className="h-14 w-14 text-white/30" /></div>}
            </div>
            <div className="absolute right-4 top-4 grid h-28 w-28 place-items-center rounded-full text-center" style={{ background: accent, color: navy }}><div><p className="text-[26px] font-extrabold leading-none">{vehicles.length}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide">{auto ? "Cars ready" : `${def.dash.units} ready`}</p></div></div>
          </div>
        </div>
        <div className={`relative z-10 mx-auto ${C} px-5 pb-4`}><SearchBar config={config} vehicles={vehicles} accent={purple} variant="soft" preview={preview} /></div>
      </section>

      {/* just arrived — light */}
      <section className="w-full bg-[#f3f3f7] py-16">
        <div className={`mx-auto ${C} px-5`}>
          <span className="inline-block rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide" style={{ background: accent, color: navy }}>Just arrived</span>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><h2 className="text-[32px] font-extrabold tracking-tight text-[#161227] sm:text-[44px]">{auto ? "Fresh roads. Fresh choices." : "Fresh finds. Clear choices."}</h2><Link href={link(`/site/${config.slug}/inventory`)} className="text-[13px] font-bold uppercase tracking-wide" style={{ color: purple }}>{auto ? "View every vehicle" : `View all ${def.plural}`} →</Link></div>
          {featured.length === 0 ? <div className="mt-8"><Empty /></div> : <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={purple} v={v} variant="soft" preview={preview} />)}</div>}
          {show("shopByType") && energy.length > 0 && <div className="mt-8 rounded-3xl p-8" style={{ background: navy }}>
            <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: accent }}>Shop by energy</p>
            <div className="mt-4 grid grid-cols-3 gap-4">{energy.map(([label, n]) => <Link key={label} href={link(`/site/${config.slug}/inventory`)} className="rounded-2xl bg-white/5 p-5 transition hover:bg-white/10"><p className="text-[26px] font-extrabold text-white">{label}</p><p className="mt-1 text-[15px] font-bold" style={{ color: accent }}>{n}</p></Link>)}</div>
          </div>}
        </div>
      </section>

      {/* category band */}
      {show("trustBar") && cats.length > 0 && <section className="w-full py-8" style={{ background: purple }}><div className={`mx-auto ${C} grid grid-cols-3 gap-4 px-5 text-white sm:grid-cols-6`}>{cats.map(([label, n]) => <Link key={label} href={link(`/site/${config.slug}/inventory?propertyType=${encodeURIComponent(auto ? "" : label)}`)} className="text-center hover:opacity-80"><p className="text-[13px] font-bold uppercase tracking-wide capitalize">{label}</p><p className="text-[15px] font-extrabold">{n}</p></Link>)}</div></section>}

      {show("whyUs") && <section className={`mx-auto ${C} px-5 py-16`}><h2 className="text-[30px] font-extrabold tracking-tight text-white">Why {config.dealershipName}</h2><div className="mt-8 grid gap-6 sm:grid-cols-3">{why.slice(0, 3).map((wy, i) => <div key={i} className="rounded-3xl bg-white/5 p-6"><p className="text-[16.5px] font-bold text-white">{wy.title}</p><p className="mt-2 text-[13.5px] leading-relaxed text-white/60">{wy.body}</p></div>)}</div></section>}
      {show("reviews") && <section className="w-full py-16" style={{ background: navy }}><div className={`mx-auto ${C} px-5`}><div className="grid gap-5 sm:grid-cols-3">{reviews.map((r) => <div key={r.name} className="rounded-3xl bg-white/5 p-6"><div className="flex" style={{ color: accent }}>{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />)}</div><p className="mt-3 text-[14px] leading-relaxed text-white/85">“{r.body}”</p><p className="mt-3 text-[12.5px] font-bold text-white">{r.name}</p></div>)}</div></div></section>}
    </div>
  );
}

/* ═══════════════════════ QUIET — warm off-white, teal, calm/premium ═══════════════════════ */
function HomeQuiet({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, m, auto, link, why, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 4);
  const C = "max-w-[1240px]"; const ink = "#14171a"; const cream = "#f5f3ee";
  return (
    <div style={{ background: cream, color: ink }}>
      <section className="w-full">
        <div className={`mx-auto grid ${C} items-center gap-10 px-5 py-16 lg:grid-cols-2`}>
          <div>
            <p className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}><span className="h-px w-8" style={{ background: accent }} />A quieter way to buy</p>
            <h1 className="mt-5 max-w-[14ch] text-[40px] font-extrabold leading-[1.02] tracking-tight sm:text-[58px]">{config.headline}</h1>
            {config.intro && <p className="mt-5 max-w-[46ch] text-[15.5px] leading-relaxed text-[#4a4f55]">{config.intro}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={link(`/site/${config.slug}/inventory`)} className="rounded-md px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.05em] text-white" style={{ background: ink }}>{config.ctaLabel} →</Link>
              <Link href={link(`/site/${config.slug}/${m.heroSecondary.to}`)} className="rounded-md border border-black/20 px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.05em]">{auto ? "Value my trade" : m.heroSecondary.label}</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-6 text-[12.5px] font-bold text-[#4a4f55]"><span>✓ No-surprise pricing</span><span>✓ 7-day exchange</span></div>
          </div>
          <div className="overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {config.heroImageUrl ? <img src={config.heroImageUrl} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-black/5"><Car className="h-14 w-14 text-black/20" /></div>}
          </div>
        </div>
        <div className={`mx-auto ${C} px-5 pb-8`}><SearchBar config={config} vehicles={vehicles} accent={accent} variant="soft" preview={preview} /></div>
      </section>

      <section className={`mx-auto ${C} px-5 py-14`}>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>Freshly inspected</p><h2 className="mt-1 text-[30px] font-extrabold tracking-tight sm:text-[38px]">New to {config.dealershipName}</h2></div>
          <Link href={link(`/site/${config.slug}/inventory`)} className="text-[13px] font-bold uppercase tracking-wide" style={{ color: accent }}>View all {vehicles.length} vehicles →</Link>
        </div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="soft" preview={preview} />)}</div>}
      </section>

      <section className="w-full py-16" style={{ background: ink }}>
        <div className={`mx-auto grid ${C} gap-10 px-5 lg:grid-cols-[1fr_1.1fr]`}>
          <div><p className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>The {config.dealershipName} standard</p><h2 className="mt-4 text-[34px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[46px]">All the confidence.<br />None of the pressure.</h2></div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[["150-point inspection", "Digital condition report"], ["Real numbers first", "Price, payment, taxes and fees"], ["7-day exchange", "Time to make the right choice"]].map(([t, b], i) => (
              <div key={t} className="border-t border-white/15 pt-5"><p className="text-[14.5px] font-bold text-white">{t}</p><p className="mt-1.5 text-[12.5px] text-white/60">{b}</p><span className="mt-4 inline-grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold" style={{ background: accent, color: ink }}>{`0${i + 1}`}</span></div>
            ))}
          </div>
        </div>
      </section>

      {show("whyUs") && <WhyGrid config={config} accent={accent} why={why} rounded="rounded-xl" heading="text-[28px] font-extrabold tracking-tight" />}
      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="cards" />}
      {show("about") && <AboutSplit config={config} accent={accent} vehicles={vehicles} />}
    </div>
  );
}

/* ═══════════════════════ VELOCITY — high-energy powersports / adventure ═══════════════════════ */
const VINK = "#0c0e10";
function HomeVelocity({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const { accent, def, m, auto, link, bodies, why, reviews, show } = useHome(config, vehicles, preview);
  const featured = vehicles.slice(0, 8);
  const C = "max-w-[1320px]";
  const heroImg = config.heroImageUrl;
  const stats: [string, string][] = auto
    ? [[`${vehicles.length}`, "In stock"], ["0%", "Down options"], ["All", "Credit welcome"]]
    : [[`${vehicles.length}`, `Live ${def.plural}`], ...m.stats.slice(0, 2)];
  const cats = bodies.slice(0, 6);

  return (
    <>
      {/* HERO — split, dark, angled accent */}
      <section className="relative w-full overflow-hidden" style={{ background: VINK }}>
        <div className="absolute inset-y-0 right-0 hidden w-[46%] lg:block" style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)" }}>
          {heroImg /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={heroImg} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: `linear-gradient(150deg, ${accent}, ${VINK})` }} />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(12,14,16,0.95) 0%, rgba(12,14,16,0.2) 40%, transparent 100%)" }} />
        </div>
        <span className="absolute left-0 top-0 h-1.5 w-1/2" style={{ background: accent }} />
        <div className={`relative mx-auto flex ${C} min-h-[560px] flex-col justify-center px-5 pb-16 pt-20 sm:min-h-[640px]`}>
          <p className="flex items-center gap-2 font-display text-[12px] font-semibold uppercase tracking-[0.3em]" style={{ color: accent }}><span className="inline-block h-3 w-6 -skew-x-12" style={{ background: accent }} />{config.dealershipName}</p>
          <h1 className="mt-4 max-w-[16ch] font-display text-[52px] font-bold uppercase italic leading-[0.86] text-white sm:text-[86px]">{config.headline}</h1>
          {config.intro && <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-white/75 sm:text-[17px]">{config.intro}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={link(`/site/${config.slug}/inventory`)} className="-skew-x-12 px-9 py-4 font-display text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition hover:brightness-110" style={{ background: accent }}><span className="inline-block skew-x-12">{config.ctaLabel}</span></Link>
            <Link href={link(`/site/${config.slug}/${m.heroSecondary.to}`)} className="-skew-x-12 border-2 border-white/30 px-9 py-4 font-display text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white/10"><span className="inline-block skew-x-12">{auto ? "Get financed" : m.financeBtn}</span></Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map(([big, small]) => <div key={small}><p className="font-display text-[30px] font-bold italic leading-none text-white">{big}</p><p className="mt-1 font-display text-[11px] uppercase tracking-[0.2em] text-white/45">{small}</p></div>)}
          </div>
        </div>
      </section>

      {/* capability bar */}
      <div className="w-full" style={{ background: accent }}><div className={`mx-auto ${C} flex flex-wrap items-center justify-center gap-x-10 gap-y-2 px-5 py-3.5`}>
        {(m.ticker ?? ["Financing for every rider", "Trade-ins welcome", "Ride today"]).slice(0, 4).map((t) => <span key={t} className="inline-flex items-center gap-2 font-display text-[12.5px] font-semibold uppercase tracking-[0.12em] text-white"><ArrowUpRight className="h-4 w-4" />{t}</span>)}
      </div></div>

      {/* search */}
      <section className="w-full" style={{ background: VINK }}><div className={`mx-auto ${C} px-5 py-8`}><SearchBar config={config} vehicles={vehicles} accent={accent} variant="sharp" preview={preview} /></div></section>

      {/* explore the lineup — category tiles */}
      {show("shopByType") && cats.length > 0 && (
        <section className={`mx-auto ${C} px-5 py-14`}>
          <div className="mb-6 flex items-end justify-between"><h2 className="font-display text-[32px] font-bold uppercase italic tracking-tight text-[#0c0e10] sm:text-[40px]">Explore the lineup</h2></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cats.map((b) => { const n = vehicles.filter((v) => v.body === b).length; return (
              <Link key={b} href={link(`/site/${config.slug}/inventory?body=${encodeURIComponent(b)}`)} className="group relative overflow-hidden border-2 border-[#0c0e10] p-4 transition hover:bg-[#0c0e10]">
                <span className="absolute right-0 top-0 h-8 w-8 -translate-y-4 translate-x-4 rotate-45" style={{ background: accent }} />
                <p className="font-display text-[15px] font-bold uppercase italic text-[#0c0e10] transition group-hover:text-white">{b}</p>
                <p className="mt-1 font-display text-[11px] uppercase tracking-wide text-[#0c0e10]/50 transition group-hover:text-white/60">{n} available</p>
              </Link>
            ); })}
          </div>
        </section>
      )}

      {/* featured inventory */}
      <section className={`mx-auto ${C} px-5 pb-14`}>
        <div className="mb-6 flex items-end justify-between border-b-2 border-[#0c0e10] pb-3"><h2 className="font-display text-[30px] font-bold uppercase italic tracking-tight text-[#0c0e10]">Fresh {def.plural}</h2><Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-1 font-display text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>View all<ArrowRight className="h-4 w-4" /></Link></div>
        {featured.length === 0 ? <Empty /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="sharp" preview={preview} />)}</div>}
      </section>

      {/* why us — angled dark band */}
      {show("whyUs") && why.length > 0 && (
        <section className="w-full" style={{ background: VINK, clipPath: "polygon(0 4%, 100% 0, 100% 96%, 0 100%)" }}>
          <div className={`mx-auto ${C} px-5 py-20`}>
            <div className="grid gap-8 lg:grid-cols-3">
              {why.slice(0, 3).map((w, i) => (
                <div key={i} className="border-l-2 pl-5" style={{ borderColor: accent }}>
                  <p className="font-display text-[13px] font-bold italic" style={{ color: accent }}>0{i + 1}</p>
                  <p className="mt-2 font-display text-[19px] font-bold uppercase italic text-white">{w.title}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/60">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* financing CTA */}
      {show("financing") && (
        <section className="w-full" style={{ background: accent }}><div className={`mx-auto ${C} flex flex-col items-center gap-5 px-5 py-16 text-center`}>
          <h2 className="max-w-[20ch] font-display text-[38px] font-bold uppercase italic leading-[0.9] text-white sm:text-[58px]">Financing for every rider</h2>
          <p className="max-w-[54ch] text-[15px] text-white/85">{config.financingText || "Good credit, rebuilding, or first-time buyer — get pre-qualified in minutes without touching your score."}</p>
          <Link href={link(`/site/${config.slug}/financing`)} className="-skew-x-12 bg-[#0c0e10] px-10 py-4 font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-white transition hover:brightness-125"><span className="inline-block skew-x-12">Get pre-qualified</span></Link>
        </div></section>
      )}

      {show("reviews") && <Reviews config={config} accent={accent} reviews={reviews} variant="dark" />}
    </>
  );
}

function HomeInner({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  // Some verticals are structurally their own thing — construction gets a bespoke site regardless of template.
  if (config.vertical === "CONSTRUCTION") return <ContractorHome config={config} vehicles={vehicles} preview={preview} />;
  switch (config.template) {
    case "VELOCITY": return <HomeVelocity config={config} vehicles={vehicles} preview={preview} />;
    case "INVENTORY_FIRST": return <HomeBold config={config} vehicles={vehicles} preview={preview} />;
    case "PREMIUM": return <EditorialHome config={config} vehicles={vehicles} />;
    case "CLASSIC": return <BrokerageHome config={config} vehicles={vehicles} preview={preview} />;
    case "SPORT": return <HomeSport config={config} vehicles={vehicles} preview={preview} />;
    case "MINIMAL": return <HomeMinimal config={config} vehicles={vehicles} preview={preview} />;
    case "AURORA": return <HomeAurora config={config} vehicles={vehicles} preview={preview} />;
    case "QUIET": return <HomeQuiet config={config} vehicles={vehicles} preview={preview} />;
    default: return <HomeModern config={config} vehicles={vehicles} preview={preview} />;
  }
}

export function SiteHome({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  return (
    <>
      <HomeInner config={config} vehicles={vehicles} preview={preview} />
      <CustomSections config={config} preview={preview} />
      {config.tree?.length ? <NodeRenderer nodes={config.tree} accent={accentOf(config.primaryColor)} vehicles={vehicles} slug={config.slug} vertical={config.vertical} /> : null}
    </>
  );
}
