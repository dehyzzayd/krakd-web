import Link from "next/link";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { vertical as verticalDef } from "./verticals";

/* Editorial flagship — a magazine, not a SaaS page. Full-bleed photography,
 * oversized Fraunces serif, listings as a numbered index, hairline rules,
 * generous negative space. CSS-only interactions (no client JS). */

const SERIF = { fontFamily: "var(--font-serif), 'Fraunces', Georgia, serif" } as const;
const LABEL = { fontFamily: "var(--font-display), 'Oswald', sans-serif", letterSpacing: "0.28em" } as const;
const money = (n: number) => (n ? `$${n.toLocaleString()}` : "Price on request");
const two = (n: number) => String(n).padStart(2, "0");

export function EditorialHome({ config, vehicles }: { config: SiteConfig; vehicles: SiteVehicle[] }) {
  const accent = accentOf(config.primaryColor);
  const def = verticalDef(config.vertical);
  const ink = "#1a1714";
  const paper = "#f3efe7";
  const heroImg = config.heroImageUrl || vehicles[0]?.image || "";
  const featured = vehicles.slice(0, 5);
  const place = [config.city, config.state].filter(Boolean).join(", ") || "By appointment";
  const hoods = [...new Set(vehicles.map((v) => String(v.attributes?.neighborhood ?? "")).filter(Boolean))];

  const spec = (v: SiteVehicle) => def.specs(v).map((s) => s.value).join("  ·  ");

  return (
    <div style={{ background: paper, color: ink }}>
      {/* ─────────── HERO ─────────── (header comes from SiteChrome, absolute over this) */}
      <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden">
        {heroImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(15,12,10,0.42) 0%, rgba(15,12,10,0) 30%, rgba(15,12,10,0.08) 55%, rgba(15,12,10,0.72) 100%)" }} />

        {/* hero title */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-[1400px] px-6 pb-14 sm:px-10 sm:pb-20">
            <p className="mb-6 text-[11px] uppercase text-white/75" style={LABEL}>{place} — Est. representation</p>
            <h1 className="max-w-[16ch] text-[13vw] font-light leading-[0.9] tracking-[-0.02em] text-white sm:text-[9vw] lg:text-[112px]" style={SERIF}>{config.headline}</h1>
            <div className="mt-9 flex flex-wrap items-end gap-x-12 gap-y-4 border-t border-white/25 pt-6">
              <Link href={`/site/${config.slug}/inventory`} className="group inline-flex items-center gap-3 text-[12px] uppercase text-white" style={LABEL}>
                Browse all {vehicles.length} {def.plural}
                <span className="inline-block transition group-hover:translate-x-1">→</span>
              </Link>
              {config.intro && <p className="max-w-[46ch] text-[14.5px] leading-relaxed text-white/80">{config.intro}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── STATEMENT ─────────── */}
      <section className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10 sm:py-32">
        <div className="grid gap-10 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-20">
          <p className="text-[11px] uppercase text-black/40" style={LABEL}>(01)&nbsp;&nbsp;Ethos</p>
          <p className="max-w-[24ch] text-[34px] font-light leading-[1.18] tracking-[-0.01em] sm:text-[52px]" style={SERIF}>
            {config.aboutText ? config.aboutText.split(". ")[0] + "." : `A considered portfolio of the ${place.split(",")[0]} homes worth living in.`}
          </p>
        </div>
      </section>

      {/* ─────────── THE INDEX ─────────── */}
      <section className="border-t border-black/12">
        <div className="mx-auto flex max-w-[1400px] items-baseline justify-between px-6 pb-4 pt-10 sm:px-10">
          <p className="text-[11px] uppercase text-black/45" style={LABEL}>(02)&nbsp;&nbsp;Selected {def.plural}</p>
          <Link href={`/site/${config.slug}/inventory`} className="text-[11px] uppercase text-black/60 transition hover:text-black" style={LABEL}>The full index →</Link>
        </div>

        {featured.map((v, i) => {
          const flip = i % 2 === 1;
          return (
            <Link key={v.id} href={`/site/${config.slug}/inventory/${v.id}`} className="group block border-t border-black/12">
              <article className="mx-auto grid max-w-[1400px] items-center gap-x-14 gap-y-8 px-6 py-14 sm:px-10 lg:grid-cols-2 lg:py-20">
                {/* image */}
                <div className={`relative aspect-[4/3] overflow-hidden bg-black/5 ${flip ? "lg:order-2" : ""}`}>
                  {v.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={v.image} alt="" className="h-full w-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.04]" />
                    : <div className="h-full w-full" />}
                  <span className="pointer-events-none absolute -top-2 left-4 text-[120px] font-light leading-none text-white/85 mix-blend-difference sm:-top-6 sm:text-[180px]" style={SERIF}>{two(i + 1)}</span>
                </div>
                {/* text */}
                <div className={flip ? "lg:order-1" : ""}>
                  <p className="mb-4 text-[11px] uppercase text-black/40" style={LABEL}>{def.noun} {two(i + 1)} — {String(v.attributes?.neighborhood ?? v.subtitle ?? place)}</p>
                  <h2 className="text-[34px] font-light leading-[1.02] tracking-[-0.01em] sm:text-[46px]" style={SERIF}>{def.titleOf(v)}</h2>
                  <p className="mt-5 text-[13px] uppercase text-black/55" style={LABEL}>{spec(v)}</p>
                  <div className="mt-8 flex items-end justify-between border-t border-black/12 pt-5">
                    <span className="text-[24px] font-light sm:text-[30px]" style={SERIF}>{money(v.price)}</span>
                    <span className="inline-flex items-center gap-2 text-[11px] uppercase text-black/60 transition group-hover:text-black" style={LABEL}>
                      View {def.noun}<span className="inline-block transition group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </section>

      {/* ─────────── NEIGHBORHOODS ─────────── */}
      {hoods.length > 0 && (
        <section className="border-t border-black/12 py-24 sm:py-28">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
            <p className="mb-10 text-[11px] uppercase text-black/45" style={LABEL}>(03)&nbsp;&nbsp;Where we work</p>
            <div className="flex flex-col">
              {hoods.map((h, i) => (
                <Link key={h} href={`/site/${config.slug}/inventory`} className="group flex items-center justify-between border-b border-black/12 py-6 first:border-t">
                  <span className="text-[36px] font-light leading-none tracking-[-0.01em] transition group-hover:translate-x-2 sm:text-[64px]" style={SERIF}>{h}</span>
                  <span className="text-[11px] uppercase text-black/35" style={LABEL}>{two(i + 1)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── REPRESENTATION ─────────── */}
      {config.staff.length > 0 && (
        <section className="border-t border-black/12 py-24 sm:py-28">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
            <p className="mb-12 text-[11px] uppercase text-black/45" style={LABEL}>(04)&nbsp;&nbsp;Representation</p>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {config.staff.slice(0, 3).map((s) => (
                <div key={s.name}>
                  <div className="aspect-[4/5] overflow-hidden bg-black/5">
                    {s.photoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={s.photoUrl} alt={s.name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full" />}
                  </div>
                  <h3 className="mt-5 text-[24px] font-light" style={SERIF}>{s.name}</h3>
                  <p className="mt-1 text-[11px] uppercase text-black/50" style={LABEL}>{s.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── CLOSING ─────────── */}
      <section className="px-6 py-28 text-center sm:px-10 sm:py-40" style={{ background: ink, color: paper }}>
        <p className="mb-8 text-[11px] uppercase" style={{ ...LABEL, color: `${paper}66` }}>Enquiries</p>
        <h2 className="mx-auto max-w-[18ch] text-[42px] font-light leading-[1.05] tracking-[-0.01em] sm:text-[76px]" style={{ ...SERIF, color: paper }}>Let&apos;s find where you belong.</h2>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link href={`/site/${config.slug}/book`} className="border px-8 py-4 text-[11px] uppercase transition hover:opacity-80" style={{ ...LABEL, borderColor: `${paper}40`, color: paper }}>Book a viewing</Link>
          <Link href={`/site/${config.slug}/contact`} className="px-8 py-4 text-[11px] uppercase" style={{ ...LABEL, background: accent, color: "#fff" }}>Make an enquiry</Link>
        </div>
      </section>
    </div>
  );
}
