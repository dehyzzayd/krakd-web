import Link from "next/link";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { ArrowUpRight, Check, Phone, ShieldCheck, HardHat, Ruler } from "lucide-react";

/* Contractor flagship — bold, industrial-refined, photography-forward. Big
 * Oswald display, charcoal + one brand accent, huge project imagery, a clear
 * process, trust signals and a "Request a quote" spine. Built for a builder. */

const money = (n: number) => (n ? `$${n.toLocaleString()}` : "");
const DISP = { fontFamily: "var(--font-display), 'Oswald', sans-serif" } as const;
const SERVICE_BLURB: Record<string, string> = {
  "Custom home": "Ground-up builds designed and delivered to your brief.",
  Renovation: "Whole-home transformations, taken back to the studs and rebuilt right.",
  Addition: "Seamless additions that live like they were always there.",
  Kitchen: "Kitchens engineered for how you actually cook and gather.",
  Bathroom: "Spa-grade baths, waterproofed and finished to last.",
  Commercial: "Tenant build-outs and commercial work delivered on schedule.",
  Outdoor: "Decks, patios and outdoor living built for Texas summers.",
};

export function ContractorHome({ config, vehicles, preview }: { config: SiteConfig; vehicles: SiteVehicle[]; preview?: boolean }) {
  const accent = accentOf(config.primaryColor);
  const ink = "#17150f";
  const paper = "#f4f1ea";
  const link = (p: string) => (preview ? "#" : p);
  const cover = config.heroImageUrl || vehicles[0]?.image || "";
  const cityState = [config.city, config.state].filter(Boolean).join(", ");
  const projects = vehicles.slice(0, 5);
  const services = (() => {
    const found = [...new Set(vehicles.map((v) => String(v.attributes?.serviceType ?? "")).filter(Boolean))];
    const base = found.length >= 3 ? found : ["Custom home", "Renovation", "Addition", "Kitchen", "Bathroom", "Outdoor"];
    return base.slice(0, 6);
  })();
  const why = config.whyUs.length ? config.whyUs : [];
  const C = "max-w-[1280px]";

  return (
    <div style={{ background: paper, color: ink }}>
      {/* ─── HERO ─── */}
      <section className="relative min-h-[86vh] w-full overflow-hidden" style={{ background: ink }}>
        {cover && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" /><div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(15,13,9,0.55) 0%, rgba(15,13,9,0.15) 40%, rgba(15,13,9,0.85) 100%)` }} /></>}
        <div className={`relative mx-auto flex ${C} min-h-[86vh] flex-col justify-end px-6 pb-16 pt-32`}>
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-white/70" style={DISP}><span className="h-px w-8" style={{ background: accent }} />{cityState || "Texas"} · Licensed & insured</p>
          <h1 className="mt-5 max-w-[16ch] text-[52px] font-bold uppercase leading-[0.92] tracking-[-0.01em] text-white sm:text-[92px]" style={DISP}>{config.headline}</h1>
          {config.intro && <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-white/80 sm:text-[18px]">{config.intro}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={link(`/site/${config.slug}/contact`)} className="inline-flex items-center gap-2 px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white" style={{ ...DISP, background: accent }}>Request a quote <ArrowUpRight className="h-4 w-4" /></Link>
            <Link href={link(`/site/${config.slug}/inventory`)} className="border border-white/40 px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-white/10" style={DISP}>See our work</Link>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section style={{ background: ink }} className="border-t border-white/10">
        <div className={`mx-auto grid ${C} grid-cols-2 gap-6 px-6 py-6 text-white sm:grid-cols-4`}>
          {[[<ShieldCheck key="a" className="h-5 w-5" />, "Licensed & insured"], [<HardHat key="b" className="h-5 w-5" />, `${vehicles.length}+ projects built`], [<Ruler key="c" className="h-5 w-5" />, "Free, itemized estimates"], [<Check key="d" className="h-5 w-5" />, "On time, on budget"]].map(([ic, t], i) => (
            <div key={i} className="flex items-center gap-3"><span style={{ color: accent }}>{ic}</span><span className="text-[13px] font-medium text-white/85">{t}</span></div>
          ))}
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className={`mx-auto ${C} px-6 py-20 sm:py-24`}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ ...DISP, color: accent }}>What we build</p>
            <h2 className="mt-2 text-[34px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[52px]" style={DISP}>Services</h2>
          </div>
          <Link href={link(`/site/${config.slug}/contact`)} className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ ...DISP, color: ink }}>Not sure? Ask us →</Link>
        </div>
        <div className="grid gap-px overflow-hidden rounded-lg sm:grid-cols-2 lg:grid-cols-3" style={{ background: "rgba(0,0,0,0.1)" }}>
          {services.map((s, i) => (
            <Link key={s} href={link(`/site/${config.slug}/inventory?serviceType=${encodeURIComponent(s)}`)} className="group flex flex-col justify-between bg-[#f4f1ea] p-7 transition hover:bg-white">
              <span className="text-[13px] font-semibold" style={{ ...DISP, color: accent }}>{String(i + 1).padStart(2, "0")}</span>
              <div className="mt-10">
                <h3 className="text-[22px] font-bold uppercase leading-tight" style={DISP}>{s}{!/s$/.test(s) ? "s" : ""}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#5a5344]">{SERVICE_BLURB[s] ?? "Delivered by our in-house crews, start to finish."}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── FEATURED WORK ─── */}
      {projects.length > 0 && (
        <section style={{ background: ink }}>
          <div className={`mx-auto ${C} px-6 py-20 sm:py-24`}>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ ...DISP, color: accent }}>Recent builds</p>
                <h2 className="mt-2 text-[34px] font-bold uppercase leading-none tracking-[-0.01em] text-white sm:text-[52px]" style={DISP}>Selected work</h2>
              </div>
              <Link href={link(`/site/${config.slug}/inventory`)} className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/80 hover:text-white" style={DISP}>View all projects →</Link>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {projects.map((v, i) => (
                <Link key={v.id} href={link(`/site/${config.slug}/inventory/${v.id}`)} className={`group relative block overflow-hidden ${i === 0 ? "lg:col-span-2" : ""}`}>
                  <div className={`relative ${i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"} overflow-hidden bg-white/5`}>
                    {v.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={v.image} alt={v.title ?? ""} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                      : <div className="h-full w-full" />}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(15,13,9,0.85))" }} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ ...DISP, color: accent }}>{String(v.attributes?.serviceType ?? "Project")}</p>
                      <h3 className="mt-1 text-[22px] font-bold uppercase leading-tight text-white sm:text-[28px]" style={DISP}>{v.title}</h3>
                      <p className="text-[13px] text-white/70">{[String(v.attributes?.location ?? v.subtitle ?? ""), v.attributes?.sqft ? `${Number(v.attributes.sqft).toLocaleString()} sqft` : ""].filter(Boolean).join("  ·  ")}</p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition group-hover:translate-x-1" style={{ background: accent }}><ArrowUpRight className="h-5 w-5" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── PROCESS ─── */}
      <section className={`mx-auto ${C} px-6 py-20 sm:py-24`}>
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ ...DISP, color: accent }}>How we work</p>
        <h2 className="mt-2 text-[34px] font-bold uppercase leading-none tracking-[-0.01em] sm:text-[52px]" style={DISP}>The process</h2>
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {["Consult", "Estimate & design", "Build", "Handover"].map((t, i) => {
            const body = ["We walk the site, understand the goal, and scope the work.", "A clear, itemized quote and a plan you sign off on.", "One dedicated crew, tidy sites, and updates the whole way.", "A final walkthrough and a build you're proud to show off."][i];
            return (
              <div key={t} className="border-t-2 pt-5" style={{ borderColor: ink }}>
                <span className="text-[44px] font-bold leading-none" style={{ ...DISP, color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-[18px] font-bold uppercase" style={DISP}>{t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#5a5344]">{body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── WHY US ─── */}
      {why.length > 0 && (
        <section style={{ background: "#ebe7dd" }}>
          <div className={`mx-auto ${C} grid gap-10 px-6 py-20 lg:grid-cols-3`}>
            {why.slice(0, 3).map((w) => (
              <div key={w.title}><h3 className="text-[19px] font-bold uppercase" style={DISP}>{w.title}</h3><p className="mt-3 text-[14px] leading-relaxed text-[#5a5344]">{w.body}</p></div>
            ))}
          </div>
        </section>
      )}

      {/* ─── REVIEWS ─── */}
      {config.reviews.length > 0 && (
        <section className={`mx-auto ${C} px-6 py-20 sm:py-24`}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ ...DISP, color: accent }}>Homeowners on us</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {config.reviews.slice(0, 3).map((r) => (
              <blockquote key={r.name} className="border-t-2 pt-5" style={{ borderColor: ink }}>
                <p className="text-[15px] leading-relaxed text-[#3a352b]">&ldquo;{r.body}&rdquo;</p>
                <cite className="mt-4 block text-[12px] font-semibold uppercase not-italic tracking-[0.1em]" style={{ ...DISP, color: ink }}>{r.name}</cite>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* ─── QUOTE CTA ─── */}
      <section style={{ background: accent }}>
        <div className={`mx-auto flex ${C} flex-col items-start justify-between gap-8 px-6 py-16 lg:flex-row lg:items-center`}>
          <h2 className="max-w-[20ch] text-[34px] font-bold uppercase leading-[0.95] tracking-[-0.01em] text-white sm:text-[56px]" style={DISP}>Got a project? Let&apos;s scope it.</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={link(`/site/${config.slug}/contact`)} className="bg-white px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ ...DISP, color: ink }}>Request a quote</Link>
            {config.phone && <a href={`tel:${config.phone}`} className="inline-flex items-center gap-2 border border-white/60 px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-white" style={DISP}><Phone className="h-4 w-4" />{config.phone}</a>}
          </div>
        </div>
      </section>
    </div>
  );
}
