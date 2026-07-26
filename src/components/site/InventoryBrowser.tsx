"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { VehicleCard } from "./VehicleCard";
import { siteTheme } from "./theme";

type Facet = { value: string; count: number };
const facetOf = (vehicles: SiteVehicle[], key: (v: SiteVehicle) => string): Facet[] => {
  const m = new Map<string, number>();
  for (const v of vehicles) { const k = key(v); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value));
};

function FacetGroup({ title, facets, selected, onToggle, accent }: { title: string; facets: Facet[]; selected: string[]; onToggle: (v: string) => void; accent: string }) {
  if (facets.length === 0) return null;
  return (
    <div className="border-t border-black/8 py-4">
      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-[#0f172a]">{title}</p>
      <div className="space-y-1.5">
        {facets.map((f) => {
          const on = selected.includes(f.value);
          return (
            <button key={f.value} onClick={() => onToggle(f.value)} className="flex w-full items-center gap-2.5 text-left">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded border" style={{ borderColor: on ? accent : "#cbd5e1", background: on ? accent : "transparent" }}>{on && <span className="text-[10px] font-bold leading-none text-white">✓</span>}</span>
              <span className="flex-1 text-[13px] text-[#334155]">{f.value}</span>
              <span className="text-[11.5px] text-[#94a3b8]">{f.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function InventoryBrowser({ config, vehicles, initial }: { config: SiteConfig; vehicles: SiteVehicle[]; initial?: Record<string, string> }) {
  const accent = accentOf(config.primaryColor);
  const ui = siteTheme(config.template);
  const [kw, setKw] = useState(initial?.model ?? "");
  const [make, setMake] = useState<string[]>(initial?.make ? [initial.make] : []);
  const [body, setBody] = useState<string[]>(initial?.body ? [initial.body] : []);
  const [fuel, setFuel] = useState<string[]>([]);
  const [drive, setDrive] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(initial?.maxPrice ?? "");
  const [minYear, setMinYear] = useState(initial?.year ?? "");
  const [sort, setSort] = useState("newest");
  const [mobileOpen, setMobileOpen] = useState(false);

  const tog = (set: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) => set((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const makeF = useMemo(() => facetOf(vehicles, (v) => v.make), [vehicles]);
  const bodyF = useMemo(() => facetOf(vehicles, (v) => v.body), [vehicles]);
  const fuelF = useMemo(() => facetOf(vehicles, (v) => v.fuel), [vehicles]);
  const driveF = useMemo(() => facetOf(vehicles, (v) => v.drivetrain), [vehicles]);

  const results = useMemo(() => {
    let r = vehicles.filter((v) =>
      (make.length === 0 || make.includes(v.make)) &&
      (body.length === 0 || body.includes(v.body)) &&
      (fuel.length === 0 || fuel.includes(v.fuel)) &&
      (drive.length === 0 || drive.includes(v.drivetrain)) &&
      (!maxPrice || v.price <= +maxPrice) &&
      (!minYear || v.year >= +minYear) &&
      (!kw || `${v.year} ${v.make} ${v.model} ${v.trim}`.toLowerCase().includes(kw.toLowerCase()))
    );
    if (sort === "price_low") r = [...r].sort((a, b) => a.price - b.price);
    else if (sort === "price_high") r = [...r].sort((a, b) => b.price - a.price);
    else if (sort === "miles_low") r = [...r].sort((a, b) => a.mileage - b.mileage);
    else if (sort === "year_new") r = [...r].sort((a, b) => b.year - a.year);
    return r;
  }, [vehicles, make, body, fuel, drive, maxPrice, minYear, kw, sort]);

  const active = make.length + body.length + fuel.length + drive.length + (maxPrice ? 1 : 0) + (minYear ? 1 : 0) + (kw ? 1 : 0);
  const clear = () => { setKw(""); setMake([]); setBody([]); setFuel([]); setDrive([]); setMaxPrice(""); setMinYear(""); };
  const years = [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a);
  const sel = "h-10 w-full rounded-lg border border-black/12 bg-white px-3 text-[13px] outline-none focus:border-black/30";

  const rail = (
    <div>
      <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Search make, model, trim…" className={sel} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={sel}><option value="">Max price</option>{["15000", "20000", "30000", "45000", "60000", "80000"].map((p) => <option key={p} value={p}>${(+p / 1000)}k</option>)}</select>
        <select value={minYear} onChange={(e) => setMinYear(e.target.value)} className={sel}><option value="">Min year</option>{years.map((y) => <option key={y}>{y}</option>)}</select>
      </div>
      <FacetGroup title="Make" facets={makeF} selected={make} onToggle={tog(setMake)} accent={accent} />
      <FacetGroup title="Body type" facets={bodyF} selected={body} onToggle={tog(setBody)} accent={accent} />
      <FacetGroup title="Fuel" facets={fuelF} selected={fuel} onToggle={tog(setFuel)} accent={accent} />
      <FacetGroup title="Drivetrain" facets={driveF} selected={drive} onToggle={tog(setDrive)} accent={accent} />
    </div>
  );

  return (
    <div className={`mx-auto ${ui.container} px-5 py-8`}>
      <div className="mb-6">
        <p className={ui.eyebrow} style={{ color: accent }}>Inventory</p>
        <h1 className={`mt-1 ${ui.display} ${ui.h2} text-[#0f172a]`}>All vehicles</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* filter rail — desktop */}
        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-24">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-bold uppercase tracking-wide text-[#0f172a]">Filters</span>
              {active > 0 && <button onClick={clear} className="text-[12px] font-semibold" style={{ color: accent }}>Clear ({active})</button>}
            </div>
            {rail}
          </div>
        </aside>

        <div>
          {/* toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-black/12 px-3 py-2 text-[13px] font-semibold text-[#334155] lg:hidden"><SlidersHorizontal className="h-4 w-4" />Filters{active > 0 ? ` (${active})` : ""}</button>
            <p className="text-[13.5px] text-[#64748b]"><span className="font-semibold text-[#0f172a]">{results.length}</span> of {vehicles.length} vehicles</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto h-10 rounded-lg border border-black/12 bg-white px-3 text-[13px] outline-none">
              <option value="newest">Newest arrivals</option><option value="price_low">Price: low → high</option><option value="price_high">Price: high → low</option><option value="miles_low">Fewest miles</option><option value="year_new">Year: newest</option>
            </select>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 py-20 text-center text-[14px] text-[#64748b]">No vehicles match those filters. <button onClick={clear} className="font-semibold" style={{ color: accent }}>Clear filters</button></div>
          ) : (
            <div className={`grid grid-cols-1 gap-5 ${ui.invCols}`}>{results.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} variant={ui.card} />)}</div>
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-[340px] overflow-y-auto bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#0f172a]">Filters</span>
              <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5 text-[#64748b]" /></button>
            </div>
            {rail}
            <div className="mt-5 flex gap-2">
              {active > 0 && <button onClick={clear} className="flex-1 rounded-lg border border-black/12 py-2.5 text-[13px] font-semibold">Clear</button>}
              <button onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white" style={{ background: accent }}>Show {results.length}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
