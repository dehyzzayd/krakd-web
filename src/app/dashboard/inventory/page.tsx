"use client";

import { useMemo, useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, Badge, Dot, type Tone } from "@/components/app/AppKit";
import { Drawer } from "@/components/app/budget";
import { cn } from "@/lib/cn";
import {
  VEHICLES, inventoryStats, money, miles, agingBucket, marketDelta,
  STATUS_LABEL, STATUS_TONE, type Vehicle, type VStatus,
} from "@/lib/inventory";

const CH_LABEL: Record<string, string> = { facebook: "FB", google: "Google", cars: "Cars", autotrader: "AT", cargurus: "CG", website: "Web" };

function CarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 78" className={className} fill="none" aria-hidden>
      <path d="M6 58 C6 50 12 47 22 46 L44 31 C52 26 84 25 104 27 L150 33 C172 36 190 42 194 53 C195 56 195 59 193 61 L176 61 A14 14 0 0 0 148 61 L78 61 A14 14 0 0 0 50 61 L6 61 Z" fill="#aeb6c1" />
      <path d="M50 30 L46 44 L98 43 L100 28 C86 27 62 27 50 30Z" fill="#cfd5dd" />
      <path d="M104 28 L106 43 L150 44 L146 33 C132 30 116 28 104 28Z" fill="#cfd5dd" />
      <circle cx="64" cy="61" r="13" fill="#2b2f36" /><circle cx="64" cy="61" r="6" fill="#6b7078" />
      <circle cx="162" cy="61" r="13" fill="#2b2f36" /><circle cx="162" cy="61" r="6" fill="#6b7078" />
    </svg>
  );
}

function Thumb({ v, tall = false }: { v: Vehicle; tall?: boolean }) {
  const ag = agingBucket(v.days);
  if (v.photos === 0) {
    return (
      <div className={cn("relative flex items-center justify-center rounded-t-[10px] border-b border-dashed border-warn/40 bg-warn-soft/60", tall ? "h-44" : "h-36")}>
        <div className="text-center">
          <p className="text-[12px] font-semibold text-warn">No photos yet</p>
          <p className="mt-0.5 text-[11px] text-n500">AI flagged · add to publish</p>
        </div>
        <span className="absolute left-3 top-3"><Badge tone={STATUS_TONE[v.status]}><Dot tone={STATUS_TONE[v.status]} />{STATUS_LABEL[v.status]}</Badge></span>
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden rounded-t-[10px]", tall ? "h-44" : "h-36")} style={{ background: "linear-gradient(135deg,#f1f4f8 0%,#dde3ea 60%,#cdd4dd 100%)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 30% 0%, rgba(255,255,255,0.6), transparent 60%)" }} />
      <CarMark className="absolute bottom-3 left-1/2 w-[78%] -translate-x-1/2" />
      <span className="absolute left-3 top-3"><Badge tone={STATUS_TONE[v.status]}><Dot tone={STATUS_TONE[v.status]} />{STATUS_LABEL[v.status]}</Badge></span>
      <span className="absolute right-3 top-3"><Badge tone={ag.tone as Tone}>{v.days}d · {ag.label}</Badge></span>
      <span className="absolute bottom-2.5 left-3 rounded-md bg-n950/55 px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur">{v.photos} photos</span>
    </div>
  );
}

function MarketBar({ v }: { v: Vehicle }) {
  const m = marketDelta(v);
  return (
    <div>
      <div className="relative h-1.5 rounded-full" style={{ background: "linear-gradient(90deg,#3fc67733,#c0853233,#cf2d5633)" }}>
        <span className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-n400" style={{ left: `${m.avgPos * 100}%` }} title="Market avg" />
        <span className={cn("absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white", m.tone === "ok" ? "bg-ok" : m.tone === "err" ? "bg-err" : "bg-n700")} style={{ left: `${m.position * 100}%` }} />
      </div>
      <div className="tnum mt-1 flex justify-between text-[10.5px] text-n400"><span>{money(v.marketLow)}</span><span>mkt {money(v.marketAvg)}</span><span>{money(v.marketHigh)}</span></div>
    </div>
  );
}

function DeltaChip({ v }: { v: Vehicle }) {
  const m = marketDelta(v);
  if (m.tone === "neutral") return <Badge tone="neutral">At market</Badge>;
  const below = m.delta < 0;
  return <Badge tone={below ? "ok" : "err"}>{below ? "▼" : "▲"} {money(Math.abs(m.delta))} {below ? "below" : "above"}</Badge>;
}

const FILTERS: { k: VStatus | "all"; label: string }[] = [
  { k: "all", label: "All" }, { k: "available", label: "Available" }, { k: "recon", label: "In recon" },
  { k: "reserved", label: "Reserved" }, { k: "wholesale", label: "Wholesale" },
];
const SORTS = [
  { k: "days", label: "Days on lot" }, { k: "price", label: "Price" }, { k: "leads", label: "Leads" }, { k: "vdp", label: "VDP views" },
] as const;

export default function InventoryPage() {
  const s = inventoryStats();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<VStatus | "all">("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [sort, setSort] = useState<(typeof SORTS)[number]["k"]>("days");
  const [sel, setSel] = useState<Vehicle | null>(null);

  const list = useMemo(() => {
    let r = VEHICLES.filter((v) => v.status !== "sold");
    if (filter !== "all") r = r.filter((v) => v.status === filter);
    if (q.trim()) {
      const t = q.toLowerCase();
      r = r.filter((v) => `${v.year} ${v.make} ${v.model} ${v.trim} ${v.stock} ${v.vin}`.toLowerCase().includes(t));
    }
    return [...r].sort((a, b) => sort === "price" ? b.price - a.price : sort === "leads" ? b.leads - a.leads : sort === "vdp" ? b.vdpViews - a.vdpViews : b.days - a.days);
  }, [q, filter, sort]);

  return (
    <>
      <Topbar title="Inventory" action={{ label: "Add vehicle" }} />
      <AppMain>
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { l: "Units live", v: String(s.units) }, { l: "Inventory value", v: `$${(s.value / 1000).toFixed(0)}k` },
            { l: "Avg days on lot", v: `${s.avgDays}d` }, { l: "Aging · 45d+", v: `${s.stalePct}%` }, { l: "Avg front gross", v: money(s.avgGross) },
          ].map((k) => (
            <Card key={k.l} className="p-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{k.l}</p>
              <p className="tnum mt-1.5 text-[20px] font-semibold leading-none text-n900">{k.v}</p>
            </Card>
          ))}
        </div>

        {/* toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search make, model, VIN, stock…" className="h-9 w-full max-w-[280px] rounded-lg border border-n200 bg-white px-3 text-[13px] text-n800 outline-none transition placeholder:text-n400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
          <div className="flex items-center gap-1 rounded-lg border border-n200 bg-white p-0.5">
            {FILTERS.map((f) => (
              <button key={f.k} onClick={() => setFilter(f.k)} className={cn("h-8 rounded-[7px] px-2.5 text-[12.5px] font-medium transition", filter === f.k ? "bg-n100 text-n900" : "text-n600 hover:text-n900")}>{f.label}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-9 rounded-lg border border-n200 bg-white px-2.5 text-[12.5px] text-n700 outline-none focus:border-brand">
              {SORTS.map((o) => <option key={o.k} value={o.k}>Sort · {o.label}</option>)}
            </select>
            <div className="flex items-center rounded-lg border border-n200 bg-white p-0.5">
              {(["grid", "table"] as const).map((mode) => (
                <button key={mode} onClick={() => setView(mode)} className={cn("grid h-8 w-8 place-items-center rounded-[7px] transition", view === mode ? "bg-n100 text-n900" : "text-n500 hover:text-n800")} aria-label={mode}>
                  {mode === "grid"
                    ? <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" /><rect x="11" y="3" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" /><rect x="3" y="11" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" /><rect x="11" y="11" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" /></svg>
                    : <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[12px] text-n500">{list.length} vehicles</p>

        {/* GRID */}
        {view === "grid" ? (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((v) => (
              <button key={v.id} onClick={() => setSel(v)} className="group overflow-hidden rounded-[10px] border border-n200 bg-white text-left sh-card transition hover:sh-raised">
                <Thumb v={v} />
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="tnum text-[18px] font-semibold text-n900">{money(v.price)}</p>
                    <DeltaChip v={v} />
                  </div>
                  <p className="mt-1 text-[13.5px] font-medium text-n900">{v.year} {v.make} {v.model}</p>
                  <p className="text-[12px] text-n500">{v.trim}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-[11.5px] text-n500">
                    <span className="tnum">{miles(v.mileage)}</span><span>·</span><span>{v.body}</span><span>·</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: v.colorHex }} />{v.color}</span>
                  </p>
                  <div className="mt-3"><MarketBar v={v} /></div>
                  <div className="mt-3 flex items-center gap-3 border-t border-n200 pt-2.5 text-[11.5px] text-n500">
                    <span className="tnum"><span className="font-semibold text-n800">{v.vdpViews}</span> VDP</span>
                    <span className="tnum"><span className="font-semibold text-n800">{v.leads}</span> leads</span>
                    <span className="ml-auto text-n400">{v.channels.length ? `Live on ${v.channels.length}` : "Not published"}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* TABLE */
          <Card className="mt-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                  <th className="px-4 py-2.5 font-medium">Vehicle</th><th className="px-3 py-2.5 font-medium">Stock</th>
                  <th className="px-3 py-2.5 text-right font-medium">Price</th><th className="px-3 py-2.5 text-right font-medium">Gross</th>
                  <th className="px-3 py-2.5 text-right font-medium">Miles</th><th className="px-3 py-2.5 font-medium">Days</th>
                  <th className="px-3 py-2.5 text-right font-medium">Leads</th><th className="px-3 py-2.5 font-medium">Status</th><th className="px-4 py-2.5 font-medium">Channels</th>
                </tr></thead>
                <tbody>
                  {list.map((v) => {
                    const ag = agingBucket(v.days);
                    return (
                      <tr key={v.id} onClick={() => setSel(v)} className="cursor-pointer border-t border-n200 transition hover:bg-n50">
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><span className="grid h-9 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-n100"><CarMark className="w-10" /></span><span><span className="block text-[13px] font-medium text-n900">{v.year} {v.make} {v.model}</span><span className="block text-[11.5px] text-n500">{v.trim}</span></span></div></td>
                        <td className="tnum px-3 py-2.5 text-[12.5px] text-n600">{v.stock}</td>
                        <td className="tnum px-3 py-2.5 text-right"><span className="text-[13px] font-medium text-n900">{money(v.price)}</span><span className={cn("block text-[11px]", marketDelta(v).tone === "ok" ? "text-ok" : marketDelta(v).tone === "err" ? "text-err" : "text-n400")}>{marketDelta(v).delta < 0 ? "−" : "+"}{money(Math.abs(marketDelta(v).delta))}</span></td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(v.price - v.cost)}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{(v.mileage / 1000).toFixed(0)}k</td>
                        <td className="px-3 py-2.5"><Badge tone={ag.tone as Tone}>{v.days}d</Badge></td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n800">{v.leads}</td>
                        <td className="px-3 py-2.5"><Badge tone={STATUS_TONE[v.status]}><Dot tone={STATUS_TONE[v.status]} />{STATUS_LABEL[v.status]}</Badge></td>
                        <td className="px-4 py-2.5 text-[11.5px] text-n500">{v.channels.length ? `${v.channels.length} live` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* detail drawer */}
        <Drawer open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.year} ${sel.make} ${sel.model}` : ""} footer={
          <div className="flex gap-2"><button onClick={() => setSel(null)} className="h-10 rounded-lg px-4 text-[13px] font-medium text-n600 hover:text-n900">Close</button><button className="h-10 flex-1 rounded-lg bg-brand text-[13.5px] font-semibold text-white transition hover:bg-brand-hover">Edit &amp; republish</button></div>
        }>
          {sel && <VehicleDetail v={sel} />}
        </Drawer>
      </AppMain>
    </>
  );
}

function VehicleDetail({ v }: { v: Vehicle }) {
  const m = marketDelta(v);
  const ag = agingBucket(v.days);
  const suggested = Math.round((v.marketAvg - 350) / 10) * 10;
  return (
    <div>
      <div className="-mx-5 -mt-5"><Thumb v={v} tall /></div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div><p className="tnum text-[24px] font-semibold text-n900">{money(v.price)}</p><p className="text-[12.5px] text-n500">{v.trim} · {v.body}</p></div>
        <DeltaChip v={v} />
      </div>

      <div className="mt-4 rounded-lg border border-n200 p-3">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-n500">Market position</p>
        <MarketBar v={v} />
        <p className="mt-2.5 text-[12.5px] text-n600">Priced <span className={cn("font-semibold", m.tone === "ok" ? "text-ok" : m.tone === "err" ? "text-err" : "text-n800")}>{Math.abs(m.pct).toFixed(1)}% {m.delta < 0 ? "below" : "above"}</span> the {money(v.marketAvg)} market average across comparable listings.</p>
        <div className="mt-2 flex items-center justify-between rounded-md bg-brand-soft px-3 py-2"><span className="text-[12.5px] font-medium text-brand">AI suggests {money(suggested)}</span><button className="text-[12px] font-semibold text-brand hover:underline">Apply</button></div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {[
          ["Stock", v.stock], ["VIN", v.vin], ["Mileage", miles(v.mileage)], ["Body", v.body],
          ["Cost", money(v.cost)], ["Front gross", money(v.price - v.cost)], ["Days on lot", `${v.days} · ${ag.label}`], ["Color", v.color],
        ].map(([k, val]) => (
          <div key={k}><p className="text-[11px] uppercase tracking-[0.04em] text-n500">{k}</p><p className="tnum mt-0.5 text-[13px] font-medium text-n900">{val}</p></div>
        ))}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-n500">Demand</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-n200 p-3"><p className="tnum text-[18px] font-semibold text-n900">{v.vdpViews}</p><p className="text-[11.5px] text-n500">VDP views · 30d</p></div>
          <div className="rounded-lg border border-n200 p-3"><p className="tnum text-[18px] font-semibold text-n900">{v.leads}</p><p className="text-[11.5px] text-n500">leads</p></div>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-n500">Syndication</p>
        {v.channels.length ? (
          <div className="flex flex-wrap gap-1.5">{v.channels.map((c) => <span key={c} className="inline-flex items-center gap-1.5 rounded-md bg-ok-soft px-2 py-1 text-[11.5px] font-medium text-ok"><Dot tone="ok" />{CH_LABEL[c]}</span>)}</div>
        ) : (
          <p className="rounded-lg bg-warn-soft px-3 py-2 text-[12.5px] text-warn">Not published — {v.photos === 0 ? "add photos first" : "publish to go live"}.</p>
        )}
      </div>
    </div>
  );
}
