"use client";

import { useMemo, useState } from "react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { VehicleCard } from "./VehicleCard";

export function InventoryBrowser({ config, vehicles, initial }: {
  config: SiteConfig; vehicles: SiteVehicle[]; initial?: Record<string, string>;
}) {
  const accent = accentOf(config.primaryColor);
  const [f, setF] = useState({
    make: initial?.make ?? "", model: initial?.model ?? "", year: initial?.year ?? "",
    body: initial?.body ?? "", maxPrice: initial?.maxPrice ?? "", sort: "newest",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const makes = useMemo(() => [...new Set(vehicles.map((v) => v.make))].sort(), [vehicles]);
  const bodies = useMemo(() => [...new Set(vehicles.map((v) => v.body).filter(Boolean))].sort(), [vehicles]);

  const results = useMemo(() => {
    let r = vehicles.filter((v) =>
      (!f.make || v.make === f.make) &&
      (!f.model || v.model.toLowerCase().includes(f.model.toLowerCase())) &&
      (!f.year || v.year === Number(f.year)) &&
      (!f.body || v.body.toLowerCase() === f.body.toLowerCase()) &&
      (!f.maxPrice || v.price <= Number(f.maxPrice))
    );
    if (f.sort === "price_low") r = [...r].sort((a, b) => a.price - b.price);
    else if (f.sort === "price_high") r = [...r].sort((a, b) => b.price - a.price);
    else if (f.sort === "miles_low") r = [...r].sort((a, b) => a.mileage - b.mileage);
    return r;
  }, [vehicles, f]);

  const sel = "h-10 rounded-lg border border-black/12 bg-white px-3 text-[13.5px] outline-none focus:border-black/30";

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10">
      <h1 className="text-[26px] font-bold tracking-tight">All inventory</h1>
      <p className="mt-1 text-[13.5px] text-[#64748b]">{vehicles.length} vehicles in stock</p>

      <div className="mt-5 grid grid-cols-2 gap-2.5 rounded-2xl border border-black/8 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        <select value={f.make} onChange={(e) => set("make", e.target.value)} className={sel}><option value="">Any make</option>{makes.map((m) => <option key={m}>{m}</option>)}</select>
        <input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Model" className={sel} />
        <select value={f.year} onChange={(e) => set("year", e.target.value)} className={sel}><option value="">Any year</option>{[...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a).map((y) => <option key={y}>{y}</option>)}</select>
        <select value={f.body} onChange={(e) => set("body", e.target.value)} className={sel}><option value="">Any style</option>{bodies.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={f.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} className={sel}><option value="">Any price</option>{["15000", "20000", "30000", "45000", "60000"].map((p) => <option key={p} value={p}>Under ${Number(p).toLocaleString()}</option>)}</select>
        <select value={f.sort} onChange={(e) => set("sort", e.target.value)} className={sel}><option value="newest">Newest</option><option value="price_low">Price: low → high</option><option value="price_high">Price: high → low</option><option value="miles_low">Fewest miles</option></select>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[13px] text-[#64748b]">{results.length} result{results.length === 1 ? "" : "s"}</p>
        {(f.make || f.model || f.year || f.body || f.maxPrice) && <button onClick={() => setF({ make: "", model: "", year: "", body: "", maxPrice: "", sort: f.sort })} className="text-[13px] font-semibold" style={{ color: accent }}>Clear filters</button>}
      </div>

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-black/10 py-16 text-center text-[14px] text-[#64748b]">No vehicles match those filters. Try widening your search.</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{results.map((v) => <VehicleCard key={v.id} slug={config.slug} accent={accent} v={v} />)}</div>
      )}
    </div>
  );
}
