"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Phone, Check } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { siteTheme } from "./theme";
import { vertical as verticalDef, estMonthlyFor } from "./verticals";
import { LeadForm } from "./LeadForm";
import { VehicleCard } from "./VehicleCard";
import { PaymentCalculator } from "./PaymentCalculator";

export function VehicleDetailView({ config, vehicle, similar = [] }: { config: SiteConfig; vehicle: SiteVehicle; similar?: SiteVehicle[] }) {
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const def = verticalDef(config.vertical);
  const [active, setActive] = useState(0);
  const photos = vehicle.photos;
  const mo = def.finance?.show && vehicle.price ? estMonthlyFor(def, vehicle.price * 100) : 0;
  const title = def.titleOf(vehicle);
  const subtitle = def.subtitleOf(vehicle);
  const specs = def.detail(vehicle);
  const isAuto = config.vertical === "AUTOMOTIVE" || !config.vertical;
  const highlights = isAuto
    ? ["Multi-point inspected", "Clean, market-based pricing", "Financing available", "Trade-ins welcome"]
    : ["Recently updated listing", "Private viewings available", "Financing guidance on request", "Trusted local brokerage"];

  return (
    <div className={`mx-auto ${ui.container} px-5 py-8`}>
      <Link href={`/site/${config.slug}/inventory`} className="inline-flex items-center gap-1 text-[13px] font-semibold capitalize text-[#64748b] hover:text-[#334155]"><ChevronLeft className="h-4 w-4" />All {def.plural}</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* gallery + specs */}
        <div>
          <div className={`overflow-hidden bg-[#e6eaf0] ${ui.cardRadius}`} style={{ aspectRatio: "16/10" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photos[active] ? <img src={photos[active]} alt={title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[14px] text-[#94a3b8]">Photos coming soon</div>}
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 ${i === active ? "" : "border-transparent"}`} style={{ borderColor: i === active ? accent : undefined }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className={`mt-6 border border-black/8 bg-white p-6 ${ui.cardRadius}`}>
            <h2 className={`${ui.display} text-[18px] font-bold uppercase tracking-wide text-[#0f172a]`}>Specifications</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-8 sm:grid-cols-2">
              {specs.map((s) => <div key={s.label} className="flex justify-between border-b border-black/5 py-2.5"><span className="text-[13px] text-[#64748b]">{s.label}</span><span className="text-[13px] font-medium text-[#0f172a]">{s.value}</span></div>)}
            </div>
          </div>

          <div className={`mt-6 border border-black/8 bg-white p-6 ${ui.cardRadius}`}>
            <h2 className={`${ui.display} text-[18px] font-bold uppercase tracking-wide text-[#0f172a]`}>What we love about it</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {highlights.map((f) => (
                <div key={f} className="flex items-center gap-2 text-[13.5px] text-[#334155]"><Check className="h-4 w-4 shrink-0" style={{ color: accent }} />{f}</div>
              ))}
            </div>
          </div>
        </div>

        {/* buy rail */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className={`border border-black/8 bg-white p-6 ${ui.cardRadius}`}>
            <h1 className={`${ui.display} text-[24px] font-bold leading-tight text-[#0f172a]`}>{title}</h1>
            {subtitle && <p className="text-[13.5px] text-[#64748b]">{subtitle}</p>}
            <div className="mt-4 flex items-end justify-between">
              <p className="text-[30px] font-bold text-[#0f172a]">{vehicle.price ? `$${vehicle.price.toLocaleString()}` : "Call"}</p>
              {mo > 0 && <p className="text-[14px] font-semibold" style={{ color: accent }}>{def.finance!.label} ${mo.toLocaleString()}/mo</p>}
            </div>
            <div className="mt-5 border-t border-black/8 pt-5">
              <p className="mb-3 text-[14px] font-semibold text-[#0f172a]">Ask about this {def.noun}</p>
              <LeadForm slug={config.slug} accent={accent} vehicle={vehicle} compact />
            </div>
            {config.phone && <a href={`tel:${config.phone}`} className={`mt-3 flex items-center justify-center gap-2 border border-black/12 py-3 text-[13.5px] font-semibold ${ui.btnRadius}`} style={{ color: accent }}><Phone className="h-4 w-4" />Call {config.phone}</a>}
            {config.vdpButtonLabel && config.vdpButtonUrl && <a href={config.vdpButtonUrl} target="_blank" rel="noreferrer" className={`mt-3 flex items-center justify-center gap-2 py-3 text-[13.5px] font-semibold text-white ${ui.btnRadius}`} style={{ background: accent }}>{config.vdpButtonLabel}</a>}
          </div>
          {isAuto && <PaymentCalculator price={vehicle.price} accent={accent} />}
        </aside>
      </div>

      {/* similar */}
      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className={`mb-6 ${ui.display} ${ui.h2} capitalize text-[#0f172a]`}>Similar {def.plural}</h2>
          <div className={`grid grid-cols-1 gap-5 ${ui.invCols}`}>{similar.slice(0, ui.card === "editorial" ? 3 : 4).map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant={ui.card} />)}</div>
        </section>
      )}
    </div>
  );
}
