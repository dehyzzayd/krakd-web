"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Heart, MapPin, ChevronDown } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { vertical as verticalDef, estMonthlyFor } from "./verticals";

const money = (n: number) => (n ? `$${n.toLocaleString()}` : "Call");
const DISP = { fontFamily: "var(--font-display), 'Oswald', sans-serif" } as const;

/* Brokerage search — a Realty-Texas-style results page: a horizontal filter bar,
 * a results header, and a grid of listing cards. Distinct from the editorial /
 * default browse; wired to the Classic template. */
export function BrokerageInventory({ config, vehicles, initial }: { config: SiteConfig; vehicles: SiteVehicle[]; initial?: Record<string, string> }) {
  const accent = accentOf(config.primaryColor);
  const navy = "#0f1b2d";
  const def = verticalDef(config.vertical);
  const checks = def.facets.filter((f) => f.kind === "check");
  const mins = def.facets.filter((f) => f.kind === "min") as Extract<(typeof def.facets)[number], { kind: "min" }>[];
  const maxF = def.facets.find((f) => f.kind === "max") as Extract<(typeof def.facets)[number], { kind: "max" }> | undefined;

  const [kw, setKw] = useState(initial?.q ?? "");
  const [sel, setSel] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    for (const f of def.facets) if (initial?.[f.key]) s[f.key] = initial[f.key];
    return s;
  });
  const [sort, setSort] = useState(def.sorts[0]?.key ?? "newest");
  const set = (k: string, v: string) => setSel((p) => ({ ...p, [k]: v }));

  const opts = useMemo(() => {
    const o: Record<string, string[]> = {};
    for (const f of checks) o[f.key] = [...new Set(vehicles.map((v) => f.value(v)).filter(Boolean))].sort();
    return o;
  }, [vehicles, checks]);

  const results = useMemo(() => {
    let r = vehicles.filter((v) => {
      for (const f of def.facets) {
        const val = sel[f.key];
        if (!val) continue;
        if (f.kind === "check" && f.value(v) !== val) return false;
        if (f.kind === "min" && f.value(v) < +val) return false;
        if (f.kind === "max" && f.value(v) > +val) return false;
      }
      if (kw && !`${def.titleOf(v)} ${def.subtitleOf(v)} ${v.make} ${v.model}`.toLowerCase().includes(kw.toLowerCase())) return false;
      return true;
    });
    if (sort === "price_low") r = [...r].sort((a, b) => a.price - b.price);
    else if (sort === "price_high") r = [...r].sort((a, b) => b.price - a.price);
    else if (sort === "miles_low") r = [...r].sort((a, b) => a.mileage - b.mileage);
    return r;
  }, [vehicles, sel, kw, sort, def]);

  const activeCount = Object.values(sel).filter(Boolean).length + (kw ? 1 : 0);
  const clear = () => { setKw(""); setSel({}); };
  const barSel = "h-11 appearance-none rounded-md border border-black/12 bg-white pl-3 pr-8 text-[13.5px] text-[#0f1b2d] outline-none focus:border-[#0f1b2d]/40";

  return (
    <div className="bg-[#f6f8fb]">
      {/* banner */}
      <div style={{ background: navy }}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-3 px-6 py-9">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55" style={DISP}>{[config.city, config.state].filter(Boolean).join(", ") || "All areas"}</p>
            <h1 className="mt-1 text-[30px] font-bold capitalize tracking-[-0.02em] text-white sm:text-[38px]">Browse {def.plural}</h1>
          </div>
          <p className="text-[14px] text-white/70"><span className="text-[22px] font-bold text-white">{results.length}</span> available</p>
        </div>
      </div>

      {/* filter bar */}
      <div className="sticky top-0 z-20 border-b border-black/8 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-2.5 px-6 py-3.5">
          <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-md border border-black/12 bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-[#94a3b8]" />
            <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder={def.searchPlaceholder} className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#94a3b8]" />
          </div>
          {checks.slice(0, 2).map((f) => (
            <div key={f.key} className="relative">
              <select value={sel[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className={barSel}>
                <option value="">{f.label}</option>
                {(opts[f.key] ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            </div>
          ))}
          {mins.map((f) => (
            <div key={f.key} className="relative">
              <select value={sel[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className={barSel}>
                <option value="">{f.label}</option>
                {f.steps.map((s) => <option key={s} value={s}>{s}+</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            </div>
          ))}
          {maxF && (
            <div className="relative">
              <select value={sel[maxF.key] ?? ""} onChange={(e) => set(maxF.key, e.target.value)} className={barSel}>
                <option value="">{maxF.label}</option>
                {maxF.steps.map((s) => <option key={s} value={s}>{maxF.fmt(s)}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            </div>
          )}
          <div className="relative ml-auto">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={barSel}>{def.sorts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
            <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          </div>
          {activeCount > 0 && <button onClick={clear} className="h-11 rounded-md px-3 text-[13px] font-semibold" style={{ color: accent }}>Clear ({activeCount})</button>}
        </div>
      </div>

      {/* results */}
      <div className="mx-auto max-w-[1240px] px-6 py-10">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/12 bg-white py-20 text-center text-[14px] text-[#64748b]">No {def.plural} match those filters. <button onClick={clear} className="font-semibold" style={{ color: accent }}>Clear filters</button></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((v) => <Card key={v.id} v={v} slug={config.slug} accent={accent} navy={navy} def={def} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ v, slug, accent, navy, def }: { v: SiteVehicle; slug: string; accent: string; navy: string; def: ReturnType<typeof verticalDef> }) {
  const mo = def.finance?.show && v.price ? estMonthlyFor(def, v.price * 100) : 0;
  const badges = def.badges(v);
  const specs = def.specs(v);
  return (
    <Link href={`/site/${slug}/inventory/${v.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-black/8 bg-white transition hover:shadow-[0_12px_30px_-12px_rgba(15,27,45,0.25)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#e6eaf0]">
        {v.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={v.image} alt={def.titleOf(v)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          : <div className="grid h-full place-items-center text-[13px] text-[#94a3b8]">Photo coming soon</div>}
        {badges[0] && <span className="absolute left-3 top-3 rounded px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white" style={{ ...DISP, background: navy }}>{badges[0]}</span>}
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#64748b] transition hover:text-[#e11d48]"><Heart className="h-4 w-4" /></span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: navy }}>{money(v.price)}</p>
          {mo > 0 && <p className="text-[11.5px] font-medium" style={{ color: accent }}>{def.finance!.label} ${mo.toLocaleString()}/mo</p>}
        </div>
        <p className="mt-1 truncate text-[14.5px] font-semibold text-[#0f1b2d]">{def.titleOf(v)}</p>
        {def.subtitleOf(v) && <p className="flex items-center gap-1 truncate text-[12.5px] text-[#64748b]"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />{def.subtitleOf(v)}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-black/8 pt-3 text-[12.5px] font-medium text-[#334155]">
          {specs.map((s) => <span key={s.label}>{s.value}</span>)}
        </div>
      </div>
    </Link>
  );
}
