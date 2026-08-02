"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, ArrowUpDown, Download, Plus, List as ListIcon, LayoutGrid,
  MoreVertical, Eye, Pencil, Tag, PackageX, Camera,
} from "lucide-react";
import { Topbar } from "@/components/app/Topbar";
import { ErrorBanner } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/useApi";
import { vertical as verticalDef, type ListingView } from "@/components/site/verticals";

type V = {
  id: string; year: number | null; make: string; model: string; trim: string; body: string; stock: string; vin: string;
  title: string | null; subtitle: string | null; attributes: Record<string, unknown>;
  price: number; cost: number; mileage: number; status: string; color: string; drivetrain: string; fuel: string;
  days: number; image: string | null; photos: number;
};
type Stats = { unitsLive: number; retailValue: number; avgFrontGross: number; avgDays: number; agingPct: number };
type InvData = { items: V[]; stats: Stats; vertical: string };

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const STATUS_PILL: Record<string, string> = { AVAILABLE: "bg-ok-soft text-ok", RECON: "bg-warn-soft text-warn", RESERVED: "bg-brand-soft text-brand", WHOLESALE: "bg-n100 text-n600", SOLD: "bg-n100 text-n600" };
const aging = (d: number) => d < 15 ? { label: "Fresh", tone: "ok" } : d < 30 ? { label: "Active", tone: "brand" } : d < 45 ? { label: "Aging", tone: "warn" } : { label: "Stale", tone: "err" };

function Kpi({ label, value, sub, tone = "default" }: { label: string; value: string | number; sub: string; tone?: string }) {
  const subTone = tone === "danger" ? "text-err" : tone === "success" ? "text-ok" : "text-n400";
  return <div className="rounded-2xl border border-n200 bg-white p-4 sh-card"><p className="tnum text-[25px] font-semibold leading-none tracking-[-0.03em] text-n900">{value}</p><p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-n500">{label}</p><p className={cn("mt-1 truncate text-[12px]", subTone)}>{sub}</p></div>;
}

function Thumb({ v, className }: { v: V; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden rounded-md bg-n100", className)}>
      {v.image
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={v.image} alt="" className="h-full w-full object-cover" />
        : <span className="grid h-full w-full place-items-center text-n400"><Camera className="h-4 w-4" /></span>}
    </span>
  );
}

function RowMenu({ v, noun, auto, openHref }: { v: V; noun: string; auto: boolean; openHref: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  const items: { icon: React.ComponentType<{ className?: string }>; label: string; href?: string; primary?: boolean; danger?: boolean }[] = [
    { icon: auto ? Eye : Pencil, label: auto ? "View details" : `Edit ${noun}`, href: openHref, primary: true },
    ...(auto ? [{ icon: Pencil, label: `Edit ${noun}`, href: `/dashboard/inventory/${v.id}/edit` }] : []),
    { icon: Tag, label: "Adjust price" },
    ...(auto ? [{ icon: PackageX, label: "Move to wholesale", danger: true }] : []),
  ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className={cn("grid h-7 w-7 place-items-center rounded-md transition-colors", open ? "bg-n100 text-n700" : "text-n400 hover:bg-n100 hover:text-n700")}><MoreVertical className="h-4 w-4" /></button>
      {open && <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-n200 bg-white py-1 sh-raised">
        {items.map((it) => it.href
          ? <Link key={it.label} href={it.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] hover:bg-n50", it.primary ? "font-semibold text-n900" : "text-n700")}><it.icon className={cn("h-3.5 w-3.5", it.primary ? "text-brand" : "text-n400")} />{it.label}</Link>
          : <button key={it.label} onClick={() => setOpen(false)} className={cn("flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12.5px] hover:bg-n50", it.danger ? "text-err" : "text-n700")}><it.icon className={cn("h-3.5 w-3.5", it.danger ? "text-err" : "text-n400")} />{it.label}</button>)}
      </div>}
    </div>
  );
}

export default function InventoryPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useApi<InvData>("/inventory");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [view, setView] = useState<"list" | "grid">("list");

  const def = verticalDef(data?.vertical);
  const dash = def.dash;
  const auto = (data?.vertical ?? "AUTOMOTIVE") === "AUTOMOTIVE";
  const section = cap(def.plural);          // "Inventory" | "Listings"
  const nameOf = (v: V) => def.titleOf(v as unknown as ListingView);
  const subOf = (v: V) => def.subtitleOf(v as unknown as ListingView);
  // automotive has a rich internal detail page; other verticals go straight to the (vertical-aware) editor
  const openHref = (v: V) => (auto ? `/dashboard/inventory/${v.id}` : `/dashboard/inventory/${v.id}/edit`);
  const TABS: [string, string][] = [["all", "All"], ...dash.statuses.map((s) => [s.value, s.label] as [string, string])];

  const rows = data?.items ?? [];
  const s = data?.stats;
  const list = useMemo(() => rows.filter((v) => {
    if (tab !== "all" && v.status !== tab) return false;
    if (q.trim() && !`${nameOf(v)} ${subOf(v)} ${v.stock} ${v.vin}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, tab, q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Topbar title={section} />
      <div className="w-full px-6 py-5">
        {error && <ErrorBanner onRetry={reload} />}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-[20px] font-bold text-n900">{section}</h1><p className="mt-0.5 text-[12px] text-n500">{auto ? `Live stock · ${s?.unitsLive ?? 0} units · ${money(s?.retailValue ?? 0)} retail` : `Live · ${s?.unitsLive ?? 0} ${dash.units} · ${money(s?.retailValue ?? 0)} ${dash.valueLabel.toLowerCase()}`}</p></div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-n200 bg-white p-0.5">
              {([["list", ListIcon, "Table"], ["grid", LayoutGrid, "Grid"]] as const).map(([m, Ic, lbl]) => <button key={m} onClick={() => setView(m)} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition", view === m ? "bg-n100 text-n900" : "text-n500 hover:text-n700")}><Ic className="h-3.5 w-3.5" />{lbl}</button>)}
            </div>
            <Link href="/dashboard/inventory/new" className="btn-brand inline-flex h-9 items-center gap-2 rounded-md px-4 text-[13px] font-semibold transition"><Plus className="h-4 w-4" />Add {def.noun}</Link>
          </div>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <Kpi label="Units live" value={s?.unitsLive ?? 0} sub={auto ? "in stock" : "live now"} />
          <Kpi label={dash.valueLabel} value={`$${((s?.retailValue ?? 0) / 1000).toFixed(0)}k`} sub={auto ? "total on lot" : "total value"} />
          <Kpi label={dash.daysLabel} value={`${s?.avgDays ?? 0}d`} sub={auto ? "turn velocity" : "time to sell"} />
          <Kpi label="Aging · 45d+" value={`${s?.agingPct ?? 0}%`} sub="needs action" tone={(s?.agingPct ?? 0) > 12 ? "danger" : "default"} />
          {dash.showGross && <Kpi label="Avg front gross" value={money(s?.avgFrontGross ?? 0)} sub="per unit" tone="success" />}
        </div>

        <div className="flex flex-col justify-between gap-3 pt-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-md border border-n200 bg-white px-3 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
              <Search className="h-4 w-4 shrink-0 text-n400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={auto ? "Search make, model, VIN, stock…" : def.searchPlaceholder} className="w-64 bg-transparent text-[13px] text-n900 outline-none placeholder:text-n400" />
            </div>
            <button className="flex h-10 items-center gap-2 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 hover:bg-n50"><SlidersHorizontal className="h-4 w-4" />Filters</button>
            <button className="flex h-10 items-center gap-2 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 hover:bg-n50"><ArrowUpDown className="h-4 w-4" />Sort</button>
          </div>
          <button className="flex h-10 items-center gap-2 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 hover:bg-n50"><Download className="h-4 w-4" />Export feed</button>
        </div>

        <div className="pt-5">
          <div className="rounded-2xl border border-n200 bg-white sh-card">
            <div className="border-b border-n200 p-4"><div className="flex flex-wrap items-center gap-2">{TABS.map(([k, label]) => { const on = tab === k; const count = k === "all" ? rows.length : rows.filter((v) => v.status === k).length; return <button key={k} onClick={() => setTab(k)} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition", on ? "bg-brand text-white" : "text-n500 hover:bg-n100")}>{label}<span className={cn("grid h-4 min-w-5 place-items-center rounded-full px-1.5 text-[10px]", on ? "bg-white text-brand" : "bg-n100 text-n500")}>{count}</span></button>; })}</div></div>

            {loading ? (
              <div className="p-12 text-center text-[13px] text-n400">Loading…</div>
            ) : list.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="text-[14px] font-semibold text-n800">{rows.length === 0 ? dash.emptyTitle : `No ${dash.units} match`}</p>
                <p className="mx-auto mt-1 max-w-[42ch] text-[12.5px] text-n500">{rows.length === 0 ? dash.emptyBody : "Try clearing the search or switching tabs."}</p>
                {rows.length === 0 && <Link href="/dashboard/inventory/new" className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Add a {def.noun}</Link>}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((v) => (
                  <button key={v.id} onClick={() => router.push(openHref(v))} className="overflow-hidden rounded-xl border border-n200 bg-white text-left transition hover:sh-raised">
                    <div className="relative aspect-square"><Thumb v={v} className="h-full w-full rounded-none" /><span className={cn("absolute left-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-semibold", STATUS_PILL[v.status])}>{dash.statusLabel[v.status] ?? v.status}</span></div>
                    <div className="p-3.5"><span className="tnum text-[17px] font-bold text-n900">{money(v.price)}</span><p className="mt-0.5 truncate text-[13px] font-semibold text-n900">{nameOf(v)}</p><p className="truncate text-[11.5px] text-n500">{def.specs(v as unknown as ListingView).map((sp) => sp.value).join(" · ") || subOf(v) || "—"}</p></div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full text-[13px]">
                  <thead className="bg-n50/60"><tr className="border-b border-n200 text-[11px] font-bold uppercase tracking-wide text-n500">
                    <th className="px-4 py-2.5 text-left">{cap(def.noun)}</th><th className="px-2 text-right">Price</th>
                    {dash.tableCols.map((c) => <th key={c.label} className={cn("px-2", c.align === "right" ? "text-right" : "text-left")}>{c.label}</th>)}
                    <th className="px-2 text-left">Age</th><th className="px-2 text-left">Status</th><th className="w-10 px-2"></th>
                  </tr></thead>
                  <tbody>
                    {list.map((v) => { const ag = aging(v.days); return (
                      <tr key={v.id} onClick={() => router.push(openHref(v))} className="cursor-pointer border-b border-n100 transition last:border-0 hover:bg-n50">
                        <td className="p-2 pl-4"><div className="flex items-center gap-3"><Thumb v={v} className="h-12 w-12 shrink-0" /><div className="min-w-0 leading-tight"><p className="truncate text-[13px] font-semibold text-n900">{nameOf(v)}</p><p className="truncate text-[11px] text-n500">{[subOf(v), v.stock].filter(Boolean).join(" · ")}</p></div></div></td>
                        <td className="tnum p-2 text-right text-[13px] font-semibold text-n900">{money(v.price)}</td>
                        {dash.tableCols.map((c) => <td key={c.label} className={cn("p-2 text-[12.5px] text-n700", c.align === "right" && "tnum text-right")}>{c.get(v as unknown as ListingView)}</td>)}
                        <td className="p-2"><span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium", ag.tone === "err" ? "bg-err-soft text-err" : ag.tone === "warn" ? "bg-warn-soft text-warn" : ag.tone === "brand" ? "bg-brand-soft text-brand" : "bg-ok-soft text-ok")}>{v.days}d · {ag.label}</span></td>
                        <td className="p-2"><span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold", STATUS_PILL[v.status])}>{dash.statusLabel[v.status] ?? v.status}</span></td>
                        <td className="p-2" onClick={(e) => e.stopPropagation()}><RowMenu v={v} noun={def.noun} auto={auto} openHref={openHref(v)} /></td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
