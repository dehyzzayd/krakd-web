"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, CalendarDays, Phone, Check } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { vertical as verticalDef, estMonthlyFor } from "./verticals";
import { LeadForm } from "./LeadForm";

const money = (n: number) => (n ? `$${n.toLocaleString()}` : "Call for price");
const DISP = { fontFamily: "var(--font-display), 'Oswald', sans-serif" } as const;

/* Brokerage VDP — Realty-Texas-style: gallery, price + key facts, "About",
 * grouped property details, location, and a sticky agent + schedule rail. */
export function BrokerageDetail({ config, vehicle, similar = [] }: { config: SiteConfig; vehicle: SiteVehicle; similar?: SiteVehicle[] }) {
  const accent = accentOf(config.primaryColor);
  const navy = "#0f1b2d";
  const def = verticalDef(config.vertical);
  const [active, setActive] = useState(0);
  const photos = vehicle.photos.length ? vehicle.photos : vehicle.image ? [vehicle.image] : [];
  const mo = def.finance?.show && vehicle.price ? estMonthlyFor(def, vehicle.price * 100) : 0;
  const title = def.titleOf(vehicle);
  const sub = def.subtitleOf(vehicle);
  const badges = def.badges(vehicle);
  const specs = def.specs(vehicle);
  const details = def.detail(vehicle).filter((d) => d.value && d.value !== "—");
  const desc = typeof vehicle.attributes?.description === "string" ? vehicle.attributes.description : "";
  const addr = [config.address, config.city, config.state].filter(Boolean).join(", ");
  const agent = config.staff[0];
  const article = /^[aeiou]/i.test(def.bookingLabel) ? "an" : "a";

  return (
    <div className="bg-[#f6f8fb]">
      <div className="mx-auto max-w-[1240px] px-6 py-6">
        <Link href={`/site/${config.slug}/inventory`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#64748b] hover:text-[#0f1b2d]"><ChevronLeft className="h-4 w-4" />All {def.plural}</Link>
      </div>

      {/* gallery */}
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#e6eaf0]">
            {photos[active]
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photos[active]} alt={title} className="h-full w-full object-cover" />
              : <div className="grid h-full place-items-center text-[14px] text-[#94a3b8]">Photos coming soon</div>}
            {badges[0] && <span className="absolute left-4 top-4 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ ...DISP, background: navy }}>{badges[0]}</span>}
          </div>
          <div className="hidden grid-rows-3 gap-2.5 lg:grid">
            {photos.slice(1, 4).map((p, i) => (
              <button key={i} onClick={() => setActive(i + 1)} className="overflow-hidden rounded-xl bg-[#e6eaf0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        {photos.length > 1 && (
          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {photos.map((p, i) => (
              <button key={i} onClick={() => setActive(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 ${i === active ? "" : "border-transparent"}`} style={{ borderColor: i === active ? accent : undefined }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* body */}
      <div className="mx-auto max-w-[1240px] px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            {/* header */}
            <div className="border-b border-black/8 pb-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-[30px] font-bold tracking-[-0.02em]" style={{ color: navy }}>{title}</h1>
                  {sub && <p className="mt-1 flex items-center gap-1.5 text-[14.5px] text-[#64748b]"><MapPin className="h-4 w-4 text-[#94a3b8]" />{sub}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[34px] font-bold leading-none" style={{ color: navy }}>{money(vehicle.price)}</p>
                  {mo > 0 && <p className="mt-1 text-[13px] font-semibold" style={{ color: accent }}>{def.finance!.label} ${mo.toLocaleString()}/mo</p>}
                </div>
              </div>
              {specs.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
                  {specs.map((s) => <div key={s.label}><span className="text-[18px] font-bold" style={{ color: navy }}>{s.value}</span></div>)}
                </div>
              )}
            </div>

            {/* about */}
            {desc && (
              <section className="border-b border-black/8 py-7">
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#64748b]" style={DISP}>About this {def.noun}</h2>
                <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-[#334155]">{desc}</p>
              </section>
            )}

            {/* details */}
            {details.length > 0 && (
              <section className="border-b border-black/8 py-7">
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#64748b]" style={DISP}>{def.noun === "property" ? "Property details" : "Details"}</h2>
                <div className="mt-4 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                  {details.map((d) => <div key={d.label} className="flex justify-between border-b border-black/5 py-2.5"><span className="text-[13.5px] text-[#64748b]">{d.label}</span><span className="text-[13.5px] font-semibold" style={{ color: navy }}>{d.value}</span></div>)}
                </div>
              </section>
            )}

            {/* location */}
            {addr && (
              <section className="py-7">
                <h2 className="text-[13px] font-bold uppercase tracking-wide text-[#64748b]" style={DISP}>Location</h2>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-black/8 bg-white p-5">
                  <p className="flex items-center gap-2 text-[14px] font-medium" style={{ color: navy }}><MapPin className="h-5 w-5" style={{ color: accent }} />{sub || config.city}</p>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(addr)}`} target="_blank" rel="noreferrer" className="text-[13px] font-semibold" style={{ color: accent }}>View on map →</a>
                </div>
              </section>
            )}
          </div>

          {/* sticky rail */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-xl border border-black/8 bg-white p-5 shadow-sm">
              {agent && (
                <div className="mb-4 flex items-center gap-3 border-b border-black/8 pb-4">
                  {agent.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={agent.photoUrl} alt={agent.name} className="h-12 w-12 rounded-full object-cover" />
                    : <span className="grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: navy }}>{agent.name[0]}</span>}
                  <div><p className="text-[14.5px] font-bold" style={{ color: navy }}>{agent.name}</p><p className="text-[12px] uppercase tracking-wide text-[#64748b]" style={DISP}>{agent.role}</p></div>
                </div>
              )}
              <Link href={`/site/${config.slug}/book?listing=${vehicle.id}`} className="flex items-center justify-center gap-2 rounded-md py-3 text-[14px] font-semibold text-white" style={{ background: accent }}><CalendarDays className="h-4 w-4" />Schedule {article} {def.bookingLabel.toLowerCase()}</Link>
              {config.phone && <a href={`tel:${config.phone}`} className="mt-2.5 flex items-center justify-center gap-2 rounded-md border border-black/12 py-3 text-[13.5px] font-semibold" style={{ color: navy }}><Phone className="h-4 w-4" />{config.phone}</a>}
            </div>
            <div className="rounded-xl border border-black/8 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[14px] font-bold" style={{ color: navy }}>Request information</p>
              <LeadForm slug={config.slug} accent={accent} vehicle={vehicle} compact />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-[#eef2f7] p-4 text-[12.5px] text-[#475569]"><Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />Represented by {config.dealershipName}. We&apos;ll respond quickly and guide you the whole way.</div>
          </aside>
        </div>

        {/* similar */}
        {similar.length > 0 && (
          <section className="mt-12 border-t border-black/8 pt-10">
            <h2 className="mb-6 text-[22px] font-bold capitalize tracking-[-0.02em]" style={{ color: navy }}>Similar {def.plural}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.slice(0, 3).map((v) => (
                <Link key={v.id} href={`/site/${config.slug}/inventory/${v.id}`} className="group overflow-hidden rounded-xl border border-black/8 bg-white transition hover:shadow-md">
                  <div className="aspect-[4/3] overflow-hidden bg-[#e6eaf0]">{v.image && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={v.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /></>}</div>
                  <div className="p-4"><p className="text-[19px] font-bold" style={{ color: navy }}>{money(v.price)}</p><p className="truncate text-[13.5px] font-semibold text-[#0f1b2d]">{def.titleOf(v)}</p><p className="mt-1 text-[12px] text-[#64748b]">{def.specs(v).map((s) => s.value).join(" · ")}</p></div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
