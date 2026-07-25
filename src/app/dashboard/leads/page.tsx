"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, ArrowUpDown, Download, Plus, List as ListIcon, LayoutGrid,
  Phone, MessageSquare, Mail, Calendar, FileText, MoreVertical, Check, ChevronDown,
  ChevronLeft, ChevronRight, AlertCircle, UserPlus, TrendingUp, Clock, CalendarClock,
  History, X, User as UserIcon,
} from "lucide-react";
import { Topbar } from "@/components/app/Topbar";
import { cn } from "@/lib/cn";
import { LEADS, STAGES, leadProfile, money, type Lead } from "@/lib/leads";

const CURRENT = "Dana M.";
const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2563eb", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];

type Row = Lead & { statusLabel: string; unread: number; mode: string; tradeIn: boolean; creditPulled: boolean; sla: "ok" | "warn" | "breach"; assigned: string | null };
const ROWS: Row[] = LEADS.map((l) => {
  const p = leadProfile(l.id)!;
  return {
    ...l,
    statusLabel: l.stage === "sold" ? "Sold" : l.temp === "hot" ? "Hot" : l.temp === "warm" ? "Warm" : "Cold",
    unread: l.needsYou ? (l.id === "l1" ? 2 : 1) : 0,
    mode: l.messages.length ? "sms" : "email",
    tradeIn: p.hasTrade,
    creditPulled: p.creditStatus !== "not_started",
    sla: l.needsYou ? "breach" : l.score < 65 && l.stage === "new" ? "warn" : "ok",
    assigned: l.owner === "—" ? null : l.owner === "AI" ? "AI" : l.owner,
  };
});

const STATUS: Record<string, { dot: string; pill: string }> = {
  Hot: { dot: "#dc2626", pill: "bg-err-soft text-err" },
  Warm: { dot: "#c08532", pill: "bg-warn-soft text-warn" },
  Cold: { dot: "#2563eb", pill: "bg-brand-soft text-brand" },
  Sold: { dot: "#16a34a", pill: "bg-ok-soft text-ok" },
};
const SOURCES = [...new Set(ROWS.map((r) => r.source))];
const STAGE_LABELS = STAGES.map((s) => s.label);

function KpiCard({ icon: Icon, label, value, sub, tone = "default" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub: string; tone?: string }) {
  const t = tone === "danger" ? "text-err border-err/20 bg-err-soft" : tone === "success" ? "text-ok border-ok/20 bg-ok-soft" : "text-brand border-[#eceef2] bg-white";
  return (
    <div className="rounded-[14px] border border-[#eceef2] bg-white p-4 sh-card">
      <div className="flex items-center gap-3">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg border", t)}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0"><p className="truncate text-[11.5px] font-semibold text-n500">{label}</p><p className="tnum text-[20px] font-bold leading-tight text-n900">{value}</p><p className="truncate text-[11px] text-n400">{sub}</p></div>
      </div>
    </div>
  );
}

function SlaDot({ status }: { status: string }) {
  const bg = status === "ok" ? "bg-ok" : status === "warn" ? "bg-warn" : "bg-err";
  const ring = status === "ok" ? "ring-ok/25" : status === "warn" ? "ring-warn/25" : "ring-err/25";
  const title = status === "ok" ? "Within SLA" : status === "warn" ? "SLA warning" : "SLA breach — needs response";
  return <span title={title} className={cn("inline-block h-2 w-2 rounded-full ring-4", bg, ring, status === "breach" && "animate-pulse")} />;
}

function StatusPill({ value }: { value: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  const cur = STATUS[value] ?? STATUS.Cold;
  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold", cur.pill)}>
        <span className="h-2 w-2 rounded-full" style={{ background: cur.dot }} />{value}<ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && <div className="absolute left-0 top-full z-20 mt-1 min-w-[9rem] rounded-lg border border-[#eceef2] bg-white py-1 sh-raised">{Object.entries(STATUS).map(([k, v]) => <button key={k} onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-n50"><span className="h-2 w-2 rounded-full" style={{ background: v.dot }} />{k}</button>)}</div>}
    </div>
  );
}

function AssignedPill({ value }: { value: string | null }) {
  return value
    ? <span className="inline-flex items-center gap-1 rounded-full border border-[#eceef2] px-2 py-1 text-[12px] text-n700"><UserIcon className="h-3 w-3" />{value === "AI" ? "Krakd AI" : value}</span>
    : <span className="inline-flex items-center rounded-full border border-dashed border-n300 px-2 py-1 text-[12px] text-n400">Unassigned</span>;
}

function QuickAction({ icon: Icon, title, href, tone }: { icon: React.ComponentType<{ className?: string }>; title: string; href?: string; tone?: string }) {
  const cls = tone === "primary" ? "border-brand/30 text-brand hover:bg-brand-soft" : "border-[#eceef2] text-n500 hover:bg-n100 hover:text-n700";
  const inner = <Icon className="h-3.5 w-3.5" />;
  const c = cn("inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white transition-colors", cls);
  return href ? <a href={href} title={title} onClick={(e) => e.stopPropagation()} className={c}>{inner}</a> : <button title={title} onClick={(e) => e.stopPropagation()} className={c}>{inner}</button>;
}

export default function LeadsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Active");
  const [view, setView] = useState<"list" | "pipeline">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<{ source: string[]; stage: string[]; assigned: string | null; slaBreach: boolean; unreadOnly: boolean; hasAppt: boolean; hasTrade: boolean }>({ source: [], stage: [], assigned: null, slaBreach: false, unreadOnly: false, hasAppt: false, hasTrade: false });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const kpis = {
    newToday: ROWS.filter((r) => r.stage === "new").length,
    needResponse: ROWS.filter((r) => r.sla === "breach").length,
    apptToday: ROWS.filter((r) => r.stage === "appointment").length,
    hot: ROWS.filter((r) => r.temp === "hot").length,
    closeRate: Math.round((ROWS.filter((r) => r.stage === "sold").length / ROWS.length) * 100),
    avg: "12m",
  };

  const filtered = useMemo(() => {
    let list = ROWS;
    if (tab === "Active") list = list.filter((r) => r.stage !== "sold");
    else if (tab === "Mine") list = list.filter((r) => r.assigned === CURRENT);
    else if (tab === "Unassigned") list = list.filter((r) => !r.assigned);
    if (search) { const s = search.toLowerCase(); list = list.filter((r) => `${r.name} ${r.email} ${r.phone} ${r.vehicle}`.toLowerCase().includes(s)); }
    if (filters.source.length) list = list.filter((r) => filters.source.includes(r.source));
    if (filters.stage.length) list = list.filter((r) => filters.stage.includes(STAGES.find((s) => s.id === r.stage)?.label ?? ""));
    if (filters.assigned === "Me") list = list.filter((r) => r.assigned === CURRENT);
    else if (filters.assigned === "Unassigned") list = list.filter((r) => !r.assigned);
    if (filters.slaBreach) list = list.filter((r) => r.sla === "breach");
    if (filters.unreadOnly) list = list.filter((r) => r.unread > 0);
    if (filters.hasAppt) list = list.filter((r) => r.stage === "appointment");
    if (filters.hasTrade) list = list.filter((r) => r.tradeIn);
    return list;
  }, [tab, search, filters]);

  const toggleOne = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSel = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected((p) => { const n = new Set(p); allSel ? filtered.forEach((r) => n.delete(r.id)) : filtered.forEach((r) => n.add(r.id)); return n; });
  const toggleIn = (key: "source" | "stage", v: string) => setFilters((f) => { const a = new Set(f[key]); a.has(v) ? a.delete(v) : a.add(v); return { ...f, [key]: [...a] }; });
  const clearFilters = () => setFilters({ source: [], stage: [], assigned: null, slaBreach: false, unreadOnly: false, hasAppt: false, hasTrade: false });
  const activeFilters = filters.source.length + filters.stage.length + (filters.assigned ? 1 : 0) + [filters.slaBreach, filters.unreadOnly, filters.hasAppt, filters.hasTrade].filter(Boolean).length;
  const tabCounts = { All: ROWS.length, Active: ROWS.filter((r) => r.stage !== "sold").length, Mine: ROWS.filter((r) => r.assigned === CURRENT).length, Unassigned: ROWS.filter((r) => !r.assigned).length };

  return (
    <>
      <Topbar title="Leads" />
      <div className="w-full px-6 py-5">
        {/* top bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-[20px] font-bold text-n900">Leads</h1><p className="mt-0.5 text-[12px] text-n500">Real-time lead management · {ROWS.filter((r) => r.stage !== "sold").length} active</p></div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-[#eceef2] bg-white p-0.5">
              {([["list", ListIcon, "List"], ["pipeline", LayoutGrid, "Pipeline"]] as const).map(([m, Ic, lbl]) => <button key={m} onClick={() => setView(m)} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition", view === m ? "bg-n100 text-n900" : "text-n500 hover:text-n700")}><Ic className="h-3.5 w-3.5" />{lbl}</button>)}
            </div>
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-[13px] font-semibold text-white transition hover:bg-brand-hover"><Plus className="h-4 w-4" />Add a Lead</button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <KpiCard icon={UserPlus} label="New today" value={kpis.newToday} sub="last 24 hours" />
          <KpiCard icon={AlertCircle} label="Needs response" value={kpis.needResponse} sub="SLA breach" tone={kpis.needResponse > 0 ? "danger" : "default"} />
          <KpiCard icon={CalendarClock} label="Appts today" value={kpis.apptToday} sub={kpis.apptToday > 0 ? "scheduled" : "none yet"} />
          <KpiCard icon={TrendingUp} label="Hot leads" value={kpis.hot} sub="ready to close" />
          <KpiCard icon={History} label="Close rate" value={`${kpis.closeRate}%`} sub="sold / total" tone="success" />
          <KpiCard icon={Clock} label="Avg response" value={kpis.avg} sub="first touch" />
        </div>

        {/* toolbar */}
        <div className="pt-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 items-center gap-2 rounded-md border border-[#eceef2] bg-white px-3 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                <Search className="h-4 w-4 shrink-0 text-n400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, vehicle…" className="w-60 bg-transparent text-[13px] text-n900 outline-none placeholder:text-n400" />
              </div>
              <button onClick={() => setFiltersOpen((o) => !o)} className={cn("flex h-10 items-center gap-2 rounded-md border px-4 text-[13px] font-medium transition", filtersOpen || activeFilters ? "border-brand bg-brand-soft/50 text-brand" : "border-[#eceef2] bg-white text-n700 hover:bg-n50")}><SlidersHorizontal className="h-4 w-4" />Filters{activeFilters > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{activeFilters}</span>}</button>
              <button className="flex h-10 items-center gap-2 rounded-md border border-[#eceef2] bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n50"><ArrowUpDown className="h-4 w-4" />Sort</button>
            </div>
            <button className="flex h-10 items-center gap-2 rounded-md border border-[#eceef2] bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n50"><Download className="h-4 w-4" />Export</button>
          </div>

          {filtersOpen && (
            <div className="mt-3 rounded-[14px] border border-[#eceef2] bg-white p-4 sh-card">
              <div className="mb-3 flex items-center justify-between"><span className="text-[13px] font-semibold text-n900">Filters</span><button onClick={clearFilters} className="text-[12px] font-semibold text-brand hover:underline">Clear all</button></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {([["Source", SOURCES, "source"], ["Stage", STAGE_LABELS, "stage"]] as [string, string[], "source" | "stage"][]).map(([title, opts, key]) => (
                  <div key={title}><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-n400">{title}</p><div className="flex flex-wrap gap-1.5">{opts.map((o) => { const on = filters[key].includes(o); return <button key={o} onClick={() => toggleIn(key, o)} className={cn("rounded border px-2 py-1 text-[11px] font-semibold transition", on ? "border-brand bg-brand text-white" : "border-[#eceef2] bg-white text-n600 hover:bg-n50")}>{o}</button>; })}</div></div>
                ))}
                <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-n400">Assigned</p><div className="flex flex-wrap gap-1.5">{["Me", "Unassigned"].map((a) => { const on = filters.assigned === a; return <button key={a} onClick={() => setFilters((f) => ({ ...f, assigned: on ? null : a }))} className={cn("rounded border px-2 py-1 text-[11px] font-semibold transition", on ? "border-brand bg-brand text-white" : "border-[#eceef2] bg-white text-n600 hover:bg-n50")}>{a}</button>; })}</div></div>
                <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-n400">Quick</p><div className="flex flex-col gap-1.5">{([["slaBreach", "SLA breach only"], ["unreadOnly", "Unread only"], ["hasAppt", "Has appointment"], ["hasTrade", "Has trade-in"]] as const).map(([k, l]) => <label key={k} className="flex cursor-pointer items-center gap-2 text-[12px] text-n700"><button onClick={() => setFilters((f) => ({ ...f, [k]: !f[k] }))} className={cn("grid h-4 w-4 place-items-center rounded-sm border", filters[k] ? "border-brand bg-brand text-white" : "border-n300 bg-white")}>{filters[k] && <Check className="h-3 w-3" />}</button>{l}</label>)}</div></div>
              </div>
            </div>
          )}
        </div>

        {/* bulk bar */}
        {selected.size > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-[14px] border border-brand bg-brand-soft/50 px-4 py-2.5">
            <span className="text-[13px] font-semibold text-brand">{selected.size} selected</span>
            <div className="flex flex-wrap items-center gap-2">
              {["Assign", "Change status", "Send SMS"].map((a) => <button key={a} className="rounded-md border border-[#eceef2] bg-white px-3 py-1.5 text-[12px] font-semibold text-n700 hover:bg-n50">{a}</button>)}
              <button className="rounded-md border border-err/25 bg-white px-3 py-1.5 text-[12px] font-semibold text-err hover:bg-err-soft">Archive</button>
              <button onClick={() => setSelected(new Set())} className="grid h-7 w-7 place-items-center rounded-md text-n400 hover:bg-white hover:text-n700"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}

        {/* tabs + content */}
        <div className="pt-5">
          <div className="rounded-[14px] border border-[#eceef2] bg-white sh-card">
            <div className="border-b border-[#eceef2] p-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["All", "Active", "Mine", "Unassigned"] as const).map((t) => { const on = tab === t; return <button key={t} onClick={() => setTab(t)} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition", on ? "bg-brand text-white" : "text-n500 hover:bg-n100")}>{t === "Mine" ? "My leads" : t}<span className={cn("grid h-4 min-w-5 place-items-center rounded-full px-1.5 text-[10px]", on ? "bg-white text-brand" : "bg-n100 text-n500")}>{tabCounts[t]}</span></button>; })}
              </div>
            </div>

            {view === "pipeline" ? (
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3 lg:grid-cols-6">
                {STAGES.map((st) => { const items = filtered.filter((r) => r.stage === st.id); return (
                  <div key={st.id} className="flex min-h-[300px] flex-col rounded-xl border border-[#eceef2] bg-n50">
                    <div className="flex items-center justify-between border-b border-[#eceef2] px-3 py-2.5"><span className="text-[11px] font-bold uppercase tracking-wide text-n700">{st.label}</span><span className="grid h-5 min-w-5 place-items-center rounded-full border border-[#eceef2] bg-white px-1.5 text-[11px] font-semibold text-n600">{items.length}</span></div>
                    <div className="flex flex-1 flex-col gap-2 p-2">{items.map((r) => (
                      <button key={r.id} onClick={() => router.push(`/dashboard/leads/${r.id}`)} className="rounded-lg border border-[#eceef2] bg-white p-2.5 text-left transition hover:border-brand/30 hover:shadow-sm">
                        <div className="mb-1.5 flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: avatarBg(r.name) }}>{initials(r.name)}</span><span className="truncate text-[12px] font-semibold text-n900">{r.name}</span></div><SlaDot status={r.sla} /></div>
                        <p className="truncate text-[11px] text-n500">{r.vehicle}</p>
                        <div className="mt-1.5 flex items-center justify-between"><span className="rounded border border-[#eceef2] bg-white px-1.5 py-0.5 text-[10px] text-n600">{r.source}</span><span className="text-[10px] text-n400">{r.last}</span></div>
                      </button>
                    ))}{items.length === 0 && <p className="py-6 text-center text-[11px] text-n400">No leads</p>}</div>
                  </div>
                ); })}
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-n50/60"><tr className="border-b border-[#eceef2] text-[11px] font-bold uppercase tracking-wide text-n500">
                    <th className="h-10 w-10 px-3"><button onClick={toggleAll} className={cn("grid h-4 w-4 place-items-center rounded-sm border", allSel ? "border-brand bg-brand text-white" : "border-n300 bg-white")}>{allSel && <Check className="h-3 w-3" />}</button></th>
                    <th className="px-2 text-left font-bold">Lead</th><th className="px-2 text-left font-bold">Source</th><th className="px-2 text-left font-bold">Interest</th>
                    <th className="px-2 text-left font-bold">Last Contact</th><th className="px-2 text-left font-bold">Status</th><th className="px-2 text-left font-bold">Assigned</th>
                    <th className="w-14 px-2 text-center font-bold">SLA</th><th className="px-2 text-left font-bold">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-n400">No leads match the current filters.</td></tr>}
                    {filtered.map((r) => (
                      <tr key={r.id} onClick={() => router.push(`/dashboard/leads/${r.id}`)} className="cursor-pointer border-b border-n100 transition last:border-0 hover:bg-n50">
                        <td className="w-10 p-3" onClick={(e) => e.stopPropagation()}><button onClick={() => toggleOne(r.id)} className={cn("grid h-4 w-4 place-items-center rounded-sm border", selected.has(r.id) ? "border-brand bg-brand text-white" : "border-n300 bg-white")}>{selected.has(r.id) && <Check className="h-3 w-3" />}</button></td>
                        <td className="p-2"><div className="flex items-center gap-2.5"><div className="relative shrink-0"><span className="grid h-9 w-9 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: avatarBg(r.name) }}>{initials(r.name)}</span>{r.unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-err px-1 text-[9px] font-bold text-white ring-2 ring-white">{r.unread}</span>}</div><div className="min-w-0 leading-tight"><p className="truncate font-semibold text-n900">{r.name}</p><p className="truncate text-[11px] text-n500">{r.phone} · {r.email}</p></div></div></td>
                        <td className="p-2"><span className="inline-flex items-center rounded border border-[#eceef2] bg-white px-2 py-0.5 text-[11px] font-medium text-n600">{r.source}</span></td>
                        <td className="p-2"><div className="leading-tight"><p className="text-[12px] font-semibold text-n900">{r.vehicle}</p><div className="mt-0.5 flex items-center gap-1">{r.tradeIn && <span className="rounded border border-[#eceef2] bg-n100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-n600">Trade</span>}{r.creditPulled && <span className="rounded border border-[#eceef2] bg-n100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-n600">Credit</span>}</div></div></td>
                        <td className="p-2">{r.needsYou ? <span className="text-[12px] italic text-n400">No reply</span> : <div className="flex items-center gap-1.5 text-[12px] text-n700">{r.mode === "sms" ? <MessageSquare className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}<span>{r.last}</span></div>}{r.stage === "appointment" && <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-brand"><Calendar className="h-3 w-3" />Appt soon</div>}</td>
                        <td className="p-2" onClick={(e) => e.stopPropagation()}><StatusPill value={r.statusLabel} /></td>
                        <td className="p-2" onClick={(e) => e.stopPropagation()}><AssignedPill value={r.assigned} /></td>
                        <td className="p-2 text-center"><SlaDot status={r.sla} /></td>
                        <td className="p-2" onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-1">
                          <QuickAction icon={Phone} title="Call" href={`tel:${r.phone}`} />
                          <QuickAction icon={MessageSquare} title="SMS" tone="primary" />
                          <QuickAction icon={Mail} title="Email" href={`mailto:${r.email}`} />
                          <QuickAction icon={Calendar} title="Schedule" />
                          <Link href={`/dashboard/leads/${r.id}`} onClick={(e) => e.stopPropagation()} title="Open" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand/30 bg-white text-brand transition hover:bg-brand-soft"><FileText className="h-3.5 w-3.5" /></Link>
                          <QuickAction icon={MoreVertical} title="More" />
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {view === "list" && (
            <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 text-[13px] text-n500">
                <div className="relative"><select className="h-10 appearance-none rounded-md border border-[#eceef2] bg-white pl-3 pr-8 text-[13px] text-n900 shadow-sm outline-none">{[10, 15, 25, 50].map((n) => <option key={n}>{n}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-n400" /></div>
                <span className="font-medium text-n900">Showing 1 to {filtered.length} of {filtered.length}</span>
              </div>
              <nav className="flex items-center gap-1">
                <button disabled className="inline-flex h-9 items-center gap-1 rounded-md px-4 text-[13px] font-medium text-n400"><ChevronLeft className="h-4 w-4" />Previous</button>
                <button className="grid size-9 place-items-center rounded-md border border-[#eceef2] bg-white text-[13px] font-medium shadow-sm">1</button>
                <button disabled className="inline-flex h-9 items-center gap-1 rounded-md px-4 text-[13px] font-medium text-n400">Next<ChevronRight className="h-4 w-4" /></button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
