"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, ArrowUpDown, Download, Plus, List as ListIcon, LayoutGrid,
  Check, ChevronLeft, ChevronRight, MoreVertical, Boxes, DollarSign,
  Clock, AlertTriangle, TrendingUp, Eye, Camera, X, Pencil, Tag, PackageX,
} from "lucide-react";
import { Topbar } from "@/components/app/Topbar";
import { cn } from "@/lib/cn";
import {
  VEHICLES, inventoryStats, money, miles, agingBucket, marketDelta, vehicleSpecs,
  STATUS_LABEL, type Vehicle, type VStatus,
} from "@/lib/inventory";

const STATUS_PILL: Record<VStatus, string> = {
  available: "bg-ok-soft text-ok", recon: "bg-warn-soft text-warn", reserved: "bg-brand-soft text-brand",
  wholesale: "bg-n100 text-n600", sold: "bg-n100 text-n600",
};

function KpiCard({ label, value, sub, tone = "default" }: { icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string | number; sub: string; tone?: string }) {
  const subTone = tone === "danger" ? "text-err" : tone === "success" ? "text-ok" : "text-n400";
  return (
    <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
      <p className="tnum text-[25px] font-semibold leading-none tracking-[-0.03em] text-n900">{value}</p>
      <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-n500">{label}</p>
      <p className={cn("mt-1 truncate text-[12px]", subTone)}>{sub}</p>
    </div>
  );
}

function Thumb({ v, className }: { v: Vehicle; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden rounded-md bg-n100", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={v.image} alt="" className={cn("h-full w-full object-cover", v.photos === 0 && "opacity-50")} />
      {v.photos === 0 && <span className="absolute inset-0 grid place-items-center bg-warn-soft/40"><Camera className="h-4 w-4 text-warn" /></span>}
    </span>
  );
}

function DeltaText({ v }: { v: Vehicle }) {
  const m = marketDelta(v);
  if (m.tone === "neutral") return <span className="text-[11px] text-n400">at market</span>;
  return <span className={cn("text-[11px] font-medium", m.tone === "ok" ? "text-ok" : "text-err")}>{m.delta < 0 ? "−" : "+"}{money(Math.abs(m.delta))}</span>;
}

function RowMenu({ v }: { v: Vehicle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  const items: { icon: React.ComponentType<{ className?: string }>; label: string; href?: string; onClick?: () => void; primary?: boolean; danger?: boolean }[] = [
    { icon: Eye, label: "View details", href: `/dashboard/inventory/${v.id}`, primary: true },
    { icon: Pencil, label: "Edit vehicle", href: `/dashboard/inventory/${v.id}/edit` },
    { icon: Tag, label: "Adjust price" },
    { icon: PackageX, label: "Move to wholesale", danger: true },
  ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className={cn("grid h-7 w-7 place-items-center rounded-md transition-colors", open ? "bg-n100 text-n700" : "text-n400 hover:bg-n100 hover:text-n700")}><MoreVertical className="h-4 w-4" /></button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-[#e4e7ec] bg-white py-1 sh-raised">
          {items.map((it) => it.href
            ? <Link key={it.label} href={it.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] hover:bg-n50", it.primary ? "font-semibold text-n900" : "text-n700")}><it.icon className={cn("h-3.5 w-3.5", it.primary ? "text-brand" : "text-n400")} />{it.label}</Link>
            : <button key={it.label} onClick={() => { setOpen(false); it.onClick?.(); }} className={cn("flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12.5px] hover:bg-n50", it.danger ? "text-err" : "text-n700")}><it.icon className={cn("h-3.5 w-3.5", it.danger ? "text-err" : "text-n400")} />{it.label}</button>)}
        </div>
      )}
    </div>
  );
}

const TABS: { k: "all" | VStatus; label: string }[] = [
  { k: "all", label: "All" }, { k: "available", label: "Available" }, { k: "recon", label: "In recon" }, { k: "reserved", label: "Reserved" }, { k: "wholesale", label: "Wholesale" },
];
const BODIES = [...new Set(VEHICLES.map((v) => v.body))];
const AGES = ["Fresh", "Active", "Aging", "Stale"];

export default function InventoryPage() {
  const router = useRouter();
  const s = inventoryStats();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | VStatus>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<{ body: string[]; aging: string[] }>({ body: [], aging: [] });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    let r = VEHICLES.filter((v) => v.status !== "sold");
    if (tab !== "all") r = r.filter((v) => v.status === tab);
    if (q.trim()) { const t = q.toLowerCase(); r = r.filter((v) => `${v.year} ${v.make} ${v.model} ${v.trim} ${v.stock} ${v.vin}`.toLowerCase().includes(t)); }
    if (filters.body.length) r = r.filter((v) => filters.body.includes(v.body));
    if (filters.aging.length) r = r.filter((v) => filters.aging.includes(agingBucket(v.days).label));
    return r;
  }, [q, tab, filters]);

  const totalVdp = VEHICLES.reduce((a, v) => a + v.vdpViews, 0);
  const toggleOne = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSel = list.length > 0 && list.every((v) => selected.has(v.id));
  const toggleAll = () => setSelected((p) => { const n = new Set(p); allSel ? list.forEach((v) => n.delete(v.id)) : list.forEach((v) => n.add(v.id)); return n; });
  const toggleIn = (key: "body" | "aging", v: string) => setFilters((f) => { const a = new Set(f[key]); a.has(v) ? a.delete(v) : a.add(v); return { ...f, [key]: [...a] }; });
  const activeFilters = filters.body.length + filters.aging.length;
  const tabCounts: Record<string, number> = { all: VEHICLES.filter((v) => v.status !== "sold").length };
  TABS.slice(1).forEach((t) => (tabCounts[t.k] = VEHICLES.filter((v) => v.status === t.k).length));

  return (
    <>
      <Topbar title="Inventory" />
      <div className="w-full px-6 py-5">
        {/* top bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-[20px] font-bold text-n900">Inventory</h1><p className="mt-0.5 text-[12px] text-n500">Live stock · {s.units} units · {money(s.value)} retail</p></div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-[#e4e7ec] bg-white p-0.5">
              {([["list", ListIcon, "Table"], ["grid", LayoutGrid, "Grid"]] as const).map(([m, Ic, lbl]) => <button key={m} onClick={() => setView(m)} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition", view === m ? "bg-n100 text-n900" : "text-n500 hover:text-n700")}><Ic className="h-3.5 w-3.5" />{lbl}</button>)}
            </div>
            <Link href="/dashboard/inventory/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-[13px] font-semibold text-white transition hover:bg-brand-hover"><Plus className="h-4 w-4" />Add vehicle</Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <KpiCard icon={Boxes} label="Units live" value={s.units} sub="in stock" />
          <KpiCard icon={DollarSign} label="Retail value" value={`$${(s.value / 1000).toFixed(0)}k`} sub="total on lot" />
          <KpiCard icon={Clock} label="Avg days on lot" value={`${s.avgDays}d`} sub="turn velocity" />
          <KpiCard icon={AlertTriangle} label="Aging · 45d+" value={`${s.stalePct}%`} sub="needs action" tone={s.stalePct > 12 ? "danger" : "default"} />
          <KpiCard icon={TrendingUp} label="Avg front gross" value={money(s.avgGross)} sub="per unit" tone="success" />
          <KpiCard icon={Eye} label="VDP views" value={`${(totalVdp / 1000).toFixed(1)}k`} sub="30-day demand" />
        </div>

        {/* toolbar */}
        <div className="pt-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 items-center gap-2 rounded-md border border-[#e4e7ec] bg-white px-3 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                <Search className="h-4 w-4 shrink-0 text-n400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search make, model, VIN, stock…" className="w-64 bg-transparent text-[13px] text-n900 outline-none placeholder:text-n400" />
              </div>
              <button onClick={() => setFiltersOpen((o) => !o)} className={cn("flex h-10 items-center gap-2 rounded-md border px-4 text-[13px] font-medium transition", filtersOpen || activeFilters ? "border-brand bg-brand-soft/50 text-brand" : "border-[#e4e7ec] bg-white text-n700 hover:bg-n50")}><SlidersHorizontal className="h-4 w-4" />Filters{activeFilters > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{activeFilters}</span>}</button>
              <button className="flex h-10 items-center gap-2 rounded-md border border-[#e4e7ec] bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n50"><ArrowUpDown className="h-4 w-4" />Sort</button>
            </div>
            <button className="flex h-10 items-center gap-2 rounded-md border border-[#e4e7ec] bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n50"><Download className="h-4 w-4" />Export feed</button>
          </div>
          {filtersOpen && (
            <div className="mt-3 rounded-2xl border border-n200 bg-white p-4 sh-card">
              <div className="mb-3 flex items-center justify-between"><span className="text-[13px] font-semibold text-n900">Filters</span><button onClick={() => setFilters({ body: [], aging: [] })} className="text-[12px] font-semibold text-brand hover:underline">Clear all</button></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {([["Body", BODIES, "body"], ["Aging", AGES, "aging"]] as [string, string[], "body" | "aging"][]).map(([title, opts, key]) => (
                  <div key={title}><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-n400">{title}</p><div className="flex flex-wrap gap-1.5">{opts.map((o) => { const on = filters[key].includes(o); return <button key={o} onClick={() => toggleIn(key, o)} className={cn("rounded border px-2 py-1 text-[11px] font-semibold transition", on ? "border-brand bg-brand text-white" : "border-[#e4e7ec] bg-white text-n600 hover:bg-n50")}>{o}</button>; })}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-brand bg-brand-soft/50 px-4 py-2.5">
            <span className="text-[13px] font-semibold text-brand">{selected.size} selected</span>
            <div className="flex flex-wrap items-center gap-2">{["Reprice", "Publish", "Move to recon"].map((a) => <button key={a} className="rounded-md border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-n700 hover:bg-n50">{a}</button>)}<button className="rounded-md border border-err/25 bg-white px-3 py-1.5 text-[12px] font-semibold text-err hover:bg-err-soft">Wholesale</button><button onClick={() => setSelected(new Set())} className="grid h-7 w-7 place-items-center rounded-md text-n400 hover:bg-white hover:text-n700"><X className="h-3.5 w-3.5" /></button></div>
          </div>
        )}

        {/* tabs + content */}
        <div className="pt-5">
          <div className="rounded-2xl border border-n200 bg-white sh-card">
            <div className="border-b border-[#e4e7ec] p-4"><div className="flex flex-wrap items-center gap-2">{TABS.map((t) => { const on = tab === t.k; return <button key={t.k} onClick={() => setTab(t.k)} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition", on ? "bg-brand text-white" : "text-n500 hover:bg-n100")}>{t.label}<span className={cn("grid h-4 min-w-5 place-items-center rounded-full px-1.5 text-[10px]", on ? "bg-white text-brand" : "bg-n100 text-n500")}>{tabCounts[t.k]}</span></button>; })}</div></div>

            {view === "grid" ? (
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((v) => { const ag = agingBucket(v.days); const sp = vehicleSpecs(v); return (
                  <button key={v.id} onClick={() => router.push(`/dashboard/inventory/${v.id}`)} className="overflow-hidden rounded-2xl border border-n200 bg-white text-left transition hover:sh-raised">
                    <div className="relative aspect-square"><Thumb v={v} className="h-full w-full rounded-none" /><span className={cn("absolute left-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-semibold", STATUS_PILL[v.status])}>{STATUS_LABEL[v.status]}</span><span className={cn("absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold", ag.tone === "err" ? "text-err" : ag.tone === "warn" ? "text-warn" : "text-n700")}>{v.days}d</span></div>
                    <div className="p-3.5"><div className="flex items-baseline justify-between"><span className="tnum text-[17px] font-bold text-n900">{money(v.price)}</span><DeltaText v={v} /></div><p className="mt-0.5 text-[13px] font-semibold text-n900">{v.year} {v.make} {v.model}</p><p className="text-[11.5px] text-n500">{v.trim} · {miles(v.mileage)}</p><div className="mt-2 flex items-center gap-2 border-t border-[#e4e7ec] pt-2 text-[11px] text-n500"><span>{v.body}</span><span className="text-n300">·</span><span>{sp.drivetrain}</span><span className="text-n300">·</span><span>{sp.fuel}</span><span className="ml-auto inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: v.colorHex }} />{v.color.split(" ").pop()}</span></div></div>
                  </button>
                ); })}
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full text-[13px]">
                  <thead className="bg-n50/60"><tr className="border-b border-[#e4e7ec] text-[11px] font-bold uppercase tracking-wide text-n500">
                    <th className="h-10 w-10 px-3"><button onClick={toggleAll} className={cn("grid h-4 w-4 place-items-center rounded-sm border", allSel ? "border-brand bg-brand text-white" : "border-n300 bg-white")}>{allSel && <Check className="h-3 w-3" />}</button></th>
                    <th className="px-2 text-left">Vehicle</th><th className="px-2 text-right">Price</th><th className="px-2 text-right">Miles</th><th className="px-2 text-left">Body</th><th className="px-2 text-left">Drivetrain</th><th className="px-2 text-left">Fuel</th><th className="px-2 text-left">Ext. color</th><th className="px-2 text-left">Age</th><th className="px-2 text-left">Status</th><th className="w-10 px-2"></th>
                  </tr></thead>
                  <tbody>
                    {list.map((v) => { const ag = agingBucket(v.days); const sp = vehicleSpecs(v); return (
                      <tr key={v.id} onClick={() => router.push(`/dashboard/inventory/${v.id}`)} className="cursor-pointer border-b border-n100 transition last:border-0 hover:bg-n50">
                        <td className="w-10 p-3" onClick={(e) => e.stopPropagation()}><button onClick={() => toggleOne(v.id)} className={cn("grid h-4 w-4 place-items-center rounded-sm border", selected.has(v.id) ? "border-brand bg-brand text-white" : "border-n300 bg-white")}>{selected.has(v.id) && <Check className="h-3 w-3" />}</button></td>
                        <td className="p-2"><div className="flex items-center gap-3"><Thumb v={v} className="h-12 w-12 shrink-0" /><div className="min-w-0 leading-tight"><p className="truncate text-[13px] font-semibold text-n900">{v.year} {v.make} {v.model}</p><p className="truncate text-[11px] text-n500">{v.trim} · {v.stock}</p></div></div></td>
                        <td className="p-2 text-right"><p className="tnum text-[13px] font-semibold text-n900">{money(v.price)}</p><DeltaText v={v} /></td>
                        <td className="tnum p-2 text-right text-[13px] text-n700">{(v.mileage / 1000).toFixed(0)}k</td>
                        <td className="p-2 text-[12.5px] text-n700">{v.body}</td>
                        <td className="p-2 text-[12.5px] text-n700">{sp.drivetrain}</td>
                        <td className="p-2 text-[12.5px] text-n700">{sp.fuel}</td>
                        <td className="p-2"><span className="inline-flex items-center gap-1.5 text-[12.5px] text-n700"><span className="h-3 w-3 shrink-0 rounded-full border border-black/10" style={{ background: v.colorHex }} />{v.color}</span></td>
                        <td className="p-2"><span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium", ag.tone === "err" ? "bg-err-soft text-err" : ag.tone === "warn" ? "bg-warn-soft text-warn" : ag.tone === "brand" ? "bg-brand-soft text-brand" : "bg-ok-soft text-ok")}>{v.days}d · {ag.label}</span></td>
                        <td className="p-2"><span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold", STATUS_PILL[v.status])}>{STATUS_LABEL[v.status]}</span></td>
                        <td className="p-2" onClick={(e) => e.stopPropagation()}><RowMenu v={v} /></td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {view === "list" && (
            <div className="mt-4 flex items-center justify-between text-[13px] text-n500">
              <span className="font-medium text-n900">Showing 1 to {list.length} of {list.length}</span>
              <nav className="flex items-center gap-1"><button disabled className="inline-flex h-9 items-center gap-1 rounded-md px-4 font-medium text-n400"><ChevronLeft className="h-4 w-4" />Previous</button><button className="grid size-9 place-items-center rounded-md border border-[#e4e7ec] bg-white font-medium shadow-sm">1</button><button disabled className="inline-flex h-9 items-center gap-1 rounded-md px-4 font-medium text-n400">Next<ChevronRight className="h-4 w-4" /></button></nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
