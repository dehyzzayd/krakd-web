"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { LeadForm } from "./LeadForm";

export function VehicleDetailView({ config, vehicle }: { config: SiteConfig; vehicle: SiteVehicle }) {
  const accent = accentOf(config.primaryColor);
  const [active, setActive] = useState(0);
  const photos = vehicle.photos.length ? vehicle.photos : [];
  const specs: [string, string][] = [
    ["Mileage", vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "—"],
    ["Exterior", vehicle.color || "—"],
    ["Drivetrain", vehicle.drivetrain || "—"],
    ["Fuel", vehicle.fuel || "—"],
    ["Transmission", vehicle.transmission || "—"],
    ["Body", vehicle.body || "—"],
    ["VIN", vehicle.vin],
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <Link href={`/site/${config.slug}/inventory`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#64748b] hover:text-[#334155]"><ChevronLeft className="h-4 w-4" />Back to inventory</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div>
          <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-[#e8edf3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photos[active] ? <img src={photos[active]} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[14px] text-[#94a3b8]">Photos coming soon</div>}
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "" : "border-transparent"}`} style={{ borderColor: i === active ? accent : undefined }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
            <h2 className="text-[15px] font-semibold">Vehicle details</h2>
            <div className="mt-3 grid grid-cols-2 gap-y-3 sm:grid-cols-3">
              {specs.map(([k, v]) => <div key={k}><p className="text-[11px] uppercase tracking-wide text-[#94a3b8]">{k}</p><p className="mt-0.5 text-[13.5px] font-medium">{v}</p></div>)}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <h1 className="text-[22px] font-bold tracking-tight">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
            {vehicle.trim && <p className="text-[13.5px] text-[#64748b]">{vehicle.trim}</p>}
            <p className="mt-3 text-[28px] font-extrabold" style={{ color: accent }}>{vehicle.price ? `$${vehicle.price.toLocaleString()}` : "Call for price"}</p>
            <div className="mt-4 border-t border-black/8 pt-4">
              <p className="mb-3 text-[14px] font-semibold">Ask about this vehicle</p>
              <LeadForm slug={config.slug} accent={accent} vehicle={vehicle} compact />
            </div>
            {config.phone && <a href={`tel:${config.phone}`} className="mt-3 block rounded-lg border border-black/12 py-2.5 text-center text-[13.5px] font-semibold" style={{ color: accent }}>Call {config.phone}</a>}
          </div>
        </aside>
      </div>
    </div>
  );
}
