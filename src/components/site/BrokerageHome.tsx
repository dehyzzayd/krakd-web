import Link from "next/link";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { vertical as verticalDef } from "./verticals";
import { VehicleCard } from "./VehicleCard";
import { Star, ArrowRight, Phone, MapPin } from "lucide-react";

/* Brokerage flagship — modeled on the corporate, credibility-first structure of
 * real Texas brokerages: positioning hero + multi-CTA, a proof stat band, "the
 * difference" pull-quote, a how-we-help trio, a coverage/neighborhoods grid,
 * the team, reviews, and a closing conversion band. Confident, not editorial. */

const money = (n: number) => (n ? `$${n.toLocaleString()}` : "Call");
const DISP = { fontFamily: "var(--font-display), 'Oswald', sans-serif" } as const;

export function BrokerageHome({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const accent = accentOf(config.primaryColor);
  const navy = "#0f1b2d";
  const def = verticalDef(config.vertical);
  const link = (p: string) => (preview ? "#" : p);
  const featured = vehicles.slice(0, 6);
  const cover = config.heroImageUrl || vehicles[0]?.image || "";
  const cityState = [config.city, config.state].filter(Boolean).join(", ");
  const hoods = [...new Set(vehicles.map((v) => String(v.attributes?.neighborhood ?? "")).filter(Boolean))];
  const avg = config.reviews.length ? (config.reviews.reduce((s, r) => s + r.rating, 0) / config.reviews.length).toFixed(1) : "5.0";
  const C = "max-w-[1240px]";

  const stats: [string, string][] = [
    [`${vehicles.length}`, `Active ${def.plural}`],
    [hoods.length ? `${hoods.length}` : `${new Set(vehicles.map((v) => v.subtitle).filter(Boolean)).size || "—"}`, "Neighborhoods"],
    [config.staff.length ? `${config.staff.length}` : "Local", config.staff.length ? "Local agents" : "Expertise"],
    [`${avg}★`, `${config.reviews.length || 0} reviews`],
  ];
  const help = [
    { t: `Browse ${def.plural}`, b: `Explore every available ${def.noun} and save the ones you love.`, cta: "Start your search", href: `/site/${config.slug}/inventory` },
    { t: "Sell with confidence", b: "Real pricing, sharp marketing and a team that runs the whole process.", cta: "Request a consult", href: `/site/${config.slug}/contact` },
    { t: def.bookingLabel === "Viewing" ? "Book a viewing" : `Book ${/^[aeiou]/i.test(def.bookingLabel) ? "an" : "a"} ${def.bookingLabel.toLowerCase()}`, b: "Pick a time that works and we'll take it from there.", cta: "See availability", href: `/site/${config.slug}/book` },
  ];

  return (
    <div className="bg-white text-[#0f1b2d]">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden" style={{ background: navy }}>
        {cover && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" /><div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${navy} 8%, ${navy}d9 45%, ${navy}80 100%)` }} /></>}
        <div className={`relative mx-auto ${C} px-6 py-24 sm:py-32`}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/60" style={DISP}>{cityState || "Texas"} · Est. {def.noun} experts</p>
          <h1 className="mt-5 max-w-[18ch] text-[42px] font-bold leading-[1.02] tracking-[-0.02em] text-white sm:text-[64px]">{config.headline}</h1>
          {config.intro && <p className="mt-5 max-w-[54ch] text-[16px] leading-relaxed text-white/75">{config.intro}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-[14px] font-semibold text-white" style={{ background: accent }}>{config.ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
            <Link href={link(`/site/${config.slug}/contact`)} className="rounded-md border border-white/25 px-6 py-3.5 text-[14px] font-semibold text-white transition hover:bg-white/10">Sell your {def.noun}</Link>
            <Link href={link(`/site/${config.slug}/book`)} className="rounded-md border border-white/25 px-6 py-3.5 text-[14px] font-semibold text-white transition hover:bg-white/10">Book a {def.bookingLabel.toLowerCase()}</Link>
          </div>
        </div>
      </section>

      {/* ─── STAT BAND ─── */}
      <section className="border-b border-black/8 bg-[#f6f8fb]">
        <div className={`mx-auto ${C} grid grid-cols-2 divide-x divide-black/8 px-6 lg:grid-cols-4`}>
          {stats.map(([v, l], i) => (
            <div key={l} className={`py-8 ${i % 2 === 1 ? "pl-6" : ""} lg:px-8 lg:text-left`}>
              <p className="text-[38px] font-bold leading-none tracking-[-0.03em]" style={{ color: navy }}>{v}</p>
              <p className="mt-2 text-[12.5px] font-semibold uppercase tracking-wide text-[#64748b]" style={DISP}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── THE DIFFERENCE (pull-quote) ─── */}
      <section className={`mx-auto ${C} px-6 py-20 sm:py-24`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ ...DISP, color: accent }}>The {config.dealershipName} difference</p>
            <p className="mt-4 max-w-[42ch] text-[26px] font-semibold leading-[1.3] tracking-[-0.01em] sm:text-[32px]">
              {config.aboutText ? config.aboutText.split(". ").slice(0, 2).join(". ") + "." : `We didn't build ${config.dealershipName} to be second best — we built it to be the name you trust with the biggest decisions.`}
            </p>
          </div>
          {config.staff[0] && (
            <figure className="flex flex-col justify-center rounded-2xl p-8 text-white" style={{ background: navy }}>
              <p className="text-[18px] font-medium leading-relaxed">&ldquo;{config.reviews[0]?.body ?? "Every client, every deal, treated like it's the only one that matters."}&rdquo;</p>
              <figcaption className="mt-5 flex items-center gap-3">
                {config.staff[0].photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={config.staff[0].photoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                  : <span className="h-11 w-11 rounded-full bg-white/15" />}
                <span><span className="block text-[14px] font-semibold">{config.staff[0].name}</span><span className="block text-[12px] text-white/60">{config.staff[0].role}</span></span>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* ─── HOW WE HELP ─── */}
      <section className="border-y border-black/8 bg-[#f6f8fb]">
        <div className={`mx-auto ${C} px-6 py-20`}>
          <h2 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">How can we help?</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {help.map((h) => (
              <div key={h.t} className="flex flex-col rounded-2xl border border-black/8 bg-white p-7 transition hover:shadow-md">
                <h3 className="text-[19px] font-bold" style={{ color: navy }}>{h.t}</h3>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#475569]">{h.b}</p>
                <Link href={link(h.href)} className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: accent }}>{h.cta} <ArrowRight className="h-4 w-4" /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED ─── */}
      {featured.length > 0 && (
        <section className={`mx-auto ${C} px-6 py-20`}>
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-[28px] font-bold capitalize tracking-[-0.02em] sm:text-[34px]">Featured {def.plural}</h2>
            <Link href={link(`/site/${config.slug}/inventory`)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: accent }}>View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant="soft" preview={preview} />)}</div>
        </section>
      )}

      {/* ─── COVERAGE / NEIGHBORHOODS ─── */}
      {hoods.length > 0 && (
        <section className="border-y border-black/8 bg-[#f6f8fb]">
          <div className={`mx-auto ${C} px-6 py-20`}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ ...DISP, color: accent }}>Where we work</p>
            <h2 className="mt-2 text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">Neighborhoods we know inside out.</h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {hoods.map((h) => {
                const n = vehicles.filter((v) => String(v.attributes?.neighborhood) === h).length;
                return <Link key={h} href={link(`/site/${config.slug}/inventory`)} className="flex items-center justify-between rounded-lg border border-black/8 bg-white px-4 py-3.5 transition hover:border-black/20"><span className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: navy }}><MapPin className="h-4 w-4" style={{ color: accent }} />{h}</span><span className="text-[12px] text-[#94a3b8]">{n}</span></Link>;
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── THE TEAM ─── */}
      {config.staff.length > 0 && (
        <section className={`mx-auto ${C} px-6 py-20`}>
          <div className="mb-8"><p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ ...DISP, color: accent }}>The team</p><h2 className="mt-2 text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">Local experts in your corner.</h2></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {config.staff.slice(0, 6).map((s) => (
              <div key={s.name} className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                <div className="aspect-[4/3] bg-[#eef2f7]">{s.photoUrl && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.photoUrl} alt={s.name} className="h-full w-full object-cover" /></>}</div>
                <div className="p-5">
                  <div className="flex" style={{ color: accent }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />)}</div>
                  <h3 className="mt-2 text-[17px] font-bold" style={{ color: navy }}>{s.name}</h3>
                  <p className="text-[12.5px] uppercase tracking-wide text-[#64748b]" style={DISP}>{s.role}</p>
                  {config.phone && <a href={`tel:${config.phone}`} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: accent }}><Phone className="h-3.5 w-3.5" />{config.phone}</a>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── REVIEWS ─── */}
      {config.reviews.length > 0 && (
        <section className="border-y border-black/8 bg-[#f6f8fb]">
          <div className={`mx-auto ${C} px-6 py-20`}>
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <div className="flex" style={{ color: accent }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5" fill="currentColor" strokeWidth={0} />)}</div>
              <p className="text-[16px] font-bold" style={{ color: navy }}>{avg} / 5</p>
              <p className="text-[13.5px] text-[#64748b]">from {config.reviews.length} verified clients</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {config.reviews.slice(0, 3).map((r) => (
                <blockquote key={r.name} className="rounded-2xl border border-black/8 bg-white p-6">
                  <div className="flex" style={{ color: accent }}>{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />)}</div>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#334155]">&ldquo;{r.body}&rdquo;</p>
                  <cite className="mt-3 block text-[13px] font-semibold not-italic" style={{ color: navy }}>{r.name}</cite>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CLOSING CTA ─── */}
      <section style={{ background: navy }}>
        <div className={`mx-auto ${C} grid items-center gap-8 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_auto]`}>
          <h2 className="max-w-[20ch] text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[46px]">Ready to make your move with {config.dealershipName}?</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={link(`/site/${config.slug}/inventory`)} className="rounded-md px-7 py-4 text-[14px] font-semibold text-white" style={{ background: accent }}>Browse {def.plural}</Link>
            <Link href={link(`/site/${config.slug}/contact`)} className="rounded-md border border-white/25 px-7 py-4 text-[14px] font-semibold text-white transition hover:bg-white/10">Talk to us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
