"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { SiteConfig, SiteVehicle } from "@/lib/server/site";
import { accentOf } from "@/lib/server/site";
import { VehicleCard } from "./VehicleCard";
import { siteTheme } from "./theme";
import { vertical as verticalDef } from "./verticals";

type Opt = { value: string; count: number };

function CheckGroup({ title, opts, selected, onToggle, accent }: { title: string; opts: Opt[]; selected: string[]; onToggle: (v: string) => void; accent: string }) {
  if (opts.length === 0) return null;
  return (
    <div className="border-t border-black/8 py-4">
      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-[#0f172a]">{title}</p>
      <div className="space-y-1.5">
        {opts.map((f) => {
          const on = selected.includes(f.value);
          return (
            <button key={f.value} onClick={() => onToggle(f.value)} className="flex w-full items-center gap-2.5 text-left">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded border" style={{ borderColor: on ? accent : "#cbd5e1", background: on ? accent : "transparent" }}>{on && <span className="text-[10px] font-bold leading-none text-white">✓</span>}</span>
              <span className="flex-1 text-[13px] capitalize text-[#334155]">{f.value}</span>
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
  const def = verticalDef(config.vertical);

  const [kw, setKw] = useState(initial?.q ?? initial?.model ?? "");
  const [checks, setChecks] = useState<Record<string, string[]>>(() => {
    const s: Record<string, string[]> = {};
    for (const f of def.facets) if (f.kind === "check") s[f.key] = initial?.[f.key] ? [initial[f.key]] : [];
    return s;
  });
  const [ranges, setRanges] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    for (const f of def.facets) if (f.kind !== "check") s[f.key] = initial?.[f.key] ?? "";
    return s;
  });
  const [sort, setSort] = useState(def.sorts[0]?.key ?? "newest");
  const [mobileOpen, setMobileOpen] = useState(false);

  const togCheck = (key: string, v: string) => setChecks((p) => ({ ...p, [key]: (p[key] ?? []).includes(v) ? p[key].filter((x) => x !== v) : [...(p[key] ?? []), v] }));
  const setRange = (key: string, v: string) => setRanges((p) => ({ ...p, [key]: v }));

  const checkOpts = useMemo(() => {
    const out: Record<string, Opt[]> = {};
    for (const f of def.facets) if (f.kind === "check") {
      const m = new Map<string, number>();
      for (const v of vehicles) { const k = f.value(v); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
      out[f.key] = [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value));
    }
    return out;
  }, [vehicles, def]);

  const results = useMemo(() => {
    let r = vehicles.filter((v) => {
      for (const f of def.facets) {
        if (f.kind === "check") { const s = checks[f.key] ?? []; if (s.length && !s.includes(f.value(v))) return false; }
        else if (f.kind === "max") { const m = ranges[f.key]; if (m && f.value(v) > +m) return false; }
        else if (f.kind === "min") { const m = ranges[f.key]; if (m && f.value(v) < +m) return false; }
      }
      if (kw) return `${def.titleOf(v)} ${def.subtitleOf(v)} ${v.make} ${v.model} ${v.trim}`.toLowerCase().includes(kw.toLowerCase());
      return true;
    });
    if (sort === "price_low") r = [...r].sort((a, b) => a.price - b.price);
    else if (sort === "price_high") r = [...r].sort((a, b) => b.price - a.price);
    else if (sort === "miles_low") r = [...r].sort((a, b) => a.mileage - b.mileage);
    return r;
  }, [vehicles, checks, ranges, kw, sort, def]);

  const active = Object.values(checks).reduce((n, a) => n + a.length, 0) + Object.values(ranges).filter(Boolean).length + (kw ? 1 : 0);
  const clear = () => { setKw(""); setChecks((p) => Object.fromEntries(Object.keys(p).map((k) => [k, []]))); setRanges((p) => Object.fromEntries(Object.keys(p).map((k) => [k, ""]))); };
  const sel = "h-10 w-full rounded-lg border border-black/12 bg-white px-3 text-[13px] outline-none focus:border-black/30";

  const rail = (
    <div>
      <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder={def.searchPlaceholder} className={sel} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        {def.facets.filter((f) => f.kind !== "check").map((f) => (
          <select key={f.key} value={ranges[f.key] ?? ""} onChange={(e) => setRange(f.key, e.target.value)} className={sel}>
            <option value="">{f.label}</option>
            {f.kind === "max"
              ? f.steps.map((p) => <option key={p} value={p}>{f.fmt(p)}</option>)
              : f.steps.map((p) => <option key={p} value={p}>{p}+</option>)}
          </select>
        ))}
      </div>
      {def.facets.filter((f) => f.kind === "check").map((f) => (
        <CheckGroup key={f.key} title={f.label} opts={checkOpts[f.key] ?? []} selected={checks[f.key] ?? []} onToggle={(v) => togCheck(f.key, v)} accent={accent} />
      ))}
    </div>
  );

  const plural = def.plural;
  return (
    <div className={`mx-auto ${ui.container} px-5 py-8`}>
      <div className="mb-6">
        <p className={ui.eyebrow} style={{ color: accent }}>{plural}</p>
        <h1 className={`mt-1 ${ui.display} ${ui.h2} capitalize text-[#0f172a]`}>All {plural}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
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
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-black/12 px-3 py-2 text-[13px] font-semibold text-[#334155] lg:hidden"><SlidersHorizontal className="h-4 w-4" />Filters{active > 0 ? ` (${active})` : ""}</button>
            <p className="text-[13.5px] text-[#64748b]"><span className="font-semibold text-[#0f172a]">{results.length}</span> of {vehicles.length} {plural}</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto h-10 rounded-lg border border-black/12 bg-white px-3 text-[13px] outline-none">
              {def.sorts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 py-20 text-center text-[14px] text-[#64748b]">Nothing matches those filters. <button onClick={clear} className="font-semibold" style={{ color: accent }}>Clear filters</button></div>
          ) : (
            <div className={`grid grid-cols-1 gap-5 ${ui.invCols}`}>{results.map((v) => <VehicleCard key={v.id} vertical={config.vertical} slug={config.slug} accent={accent} v={v} variant={ui.card} />)}</div>
          )}
        </div>
      </div>

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
