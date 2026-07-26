"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, ArrowUpDown, Download, Plus, MoreVertical,
  Phone, MessageSquare, Mail, Calendar, FileText, User as UserIcon,
} from "lucide-react";
import { Topbar } from "@/components/app/Topbar";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/useApi";
import { AddLeadSheet } from "@/components/app/AddLeadSheet";

type Row = {
  id: string; name: string; phone: string; email: string; source: string; vehicle: string;
  statusLabel: string; status: string; temperature: string; assigned: string | null; lastAdded: string;
};
type Stats = { total: number; active: number; newToday: number; needsResponse: number; apptsToday: number; hotLeads: number; closeRate: number };
type LeadsData = { items: Row[]; stats: Stats };

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];
const TEMP_TONE: Record<string, string> = { Hot: "bg-err-soft text-err", Warm: "bg-warn-soft text-warn", Cold: "bg-brand-soft text-brand" };
const TEMP_DOT: Record<string, string> = { Hot: "#dc2626", Warm: "#c08532", Cold: "#2b6ba4" };

function Kpi({ label, value, sub, tone = "default" }: { label: string; value: string | number; sub: string; tone?: string }) {
  const subTone = tone === "danger" ? "text-err" : tone === "success" ? "text-ok" : "text-n400";
  return (
    <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
      <p className="tnum text-[25px] font-semibold leading-none tracking-[-0.03em] text-n900">{value}</p>
      <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-n500">{label}</p>
      <p className={cn("mt-1 truncate text-[12px]", subTone)}>{sub}</p>
    </div>
  );
}

function ActionsMenu({ r }: { r: Row }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  const items: { icon: React.ComponentType<{ className?: string }>; label: string; href?: string; primary?: boolean }[] = [
    { icon: FileText, label: "View lead", href: `/dashboard/leads/${r.id}`, primary: true },
    { icon: Phone, label: "Call", href: r.phone ? `tel:${r.phone}` : undefined },
    { icon: MessageSquare, label: "Send SMS" },
    { icon: Mail, label: "Email", href: r.email ? `mailto:${r.email}` : undefined },
    { icon: Calendar, label: "Schedule appointment" },
  ];
  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} className={cn("grid h-7 w-7 place-items-center rounded-md transition-colors", open ? "bg-n100 text-n700" : "text-n400 hover:bg-n100 hover:text-n700")}><MoreVertical className="h-4 w-4" /></button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-n200 bg-white py-1 sh-raised">
          {items.map((it) => it.href
            ? <Link key={it.label} href={it.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] hover:bg-n50", it.primary ? "font-semibold text-n900" : "text-n700")}><it.icon className={cn("h-3.5 w-3.5", it.primary ? "text-brand" : "text-n400")} />{it.label}</Link>
            : <button key={it.label} onClick={() => setOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12.5px] text-n700 hover:bg-n50"><it.icon className="h-3.5 w-3.5 text-n400" />{it.label}</button>)}
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const { data, loading, reload } = useApi<LeadsData>("/leads");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"All" | "Active" | "Unassigned">("All");
  const [adding, setAdding] = useState(false);

  const rows = data?.items ?? [];
  const s = data?.stats;

  const filtered = useMemo(() => rows.filter((r) => {
    if (tab === "Active" && ["Sold", "Lost"].includes(r.statusLabel)) return false;
    if (tab === "Unassigned" && r.assigned) return false;
    if (q.trim() && !`${r.name} ${r.email} ${r.phone} ${r.vehicle}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, tab, q]);

  const kpis = [
    { label: "New today", value: s?.newToday ?? 0, sub: "last 24 hours" },
    { label: "Needs response", value: s?.needsResponse ?? 0, sub: "new leads", tone: (s?.needsResponse ?? 0) > 0 ? "danger" : "default" },
    { label: "Appts today", value: s?.apptsToday ?? 0, sub: "scheduled" },
    { label: "Hot leads", value: s?.hotLeads ?? 0, sub: "ready to close", tone: "success" },
    { label: "Close rate", value: `${s?.closeRate ?? 0}%`, sub: "sold / total", tone: "success" },
    { label: "Active leads", value: s?.active ?? 0, sub: "in pipeline" },
  ];

  return (
    <>
      <Topbar title="Leads" />
      <div className="w-full px-6 py-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-[20px] font-bold text-n900">Leads</h1><p className="mt-0.5 text-[12px] text-n500">Real-time lead management · {s?.active ?? 0} active</p></div>
          <button onClick={() => setAdding(true)} className="btn-brand inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold transition"><Plus className="h-4 w-4" />Add a Lead</button>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {kpis.map((k) => <Kpi key={k.label} {...k} />)}
        </div>

        <div className="pt-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 items-center gap-2 rounded-md border border-n200 bg-white px-3 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
                <Search className="h-4 w-4 shrink-0 text-n400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, vehicle…" className="w-64 bg-transparent text-[13px] text-n900 outline-none placeholder:text-n400" />
              </div>
              <button className="flex h-10 items-center gap-2 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n50"><SlidersHorizontal className="h-4 w-4" />Filters</button>
              <button className="flex h-10 items-center gap-2 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n50"><ArrowUpDown className="h-4 w-4" />Sort</button>
            </div>
            <button className="flex h-10 items-center gap-2 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n50"><Download className="h-4 w-4" />Export</button>
          </div>
        </div>

        <div className="pt-5">
          <div className="rounded-2xl border border-n200 bg-white sh-card">
            <div className="border-b border-n200 p-4"><div className="flex flex-wrap items-center gap-2">
              {(["All", "Active", "Unassigned"] as const).map((t) => { const on = tab === t; const count = t === "All" ? rows.length : t === "Active" ? rows.filter((r) => !["Sold", "Lost"].includes(r.statusLabel)).length : rows.filter((r) => !r.assigned).length; return (
                <button key={t} onClick={() => setTab(t)} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition", on ? "bg-brand text-white" : "text-n500 hover:bg-n100")}>{t}<span className={cn("grid h-4 min-w-5 place-items-center rounded-full px-1.5 text-[10px]", on ? "bg-white text-brand" : "bg-n100 text-n500")}>{count}</span></button>
              ); })}
            </div></div>

            {loading ? (
              <div className="p-12 text-center text-[13px] text-n400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="text-[14px] font-semibold text-n800">{rows.length === 0 ? "No leads yet" : "No leads match your filters"}</p>
                <p className="mx-auto mt-1 max-w-[42ch] text-[12.5px] text-n500">{rows.length === 0 ? "Launch a marketing campaign or add a lead — Krakd AI will start texting, qualifying and booking automatically." : "Try clearing the search or switching tabs."}</p>
                {rows.length === 0 && <Link href="/dashboard/marketing" className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Launch a campaign</Link>}
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full text-[13px]">
                  <thead className="bg-n50/60"><tr className="border-b border-n200 text-[11px] font-bold uppercase tracking-wide text-n500">
                    <th className="px-4 py-2.5 text-left font-bold">Lead</th><th className="px-2 text-left font-bold">Source</th><th className="px-2 text-left font-bold">Interest</th>
                    <th className="px-2 text-left font-bold">Status</th><th className="px-2 text-left font-bold">Assigned</th><th className="px-2 text-left font-bold">Last added</th><th className="w-10 px-2"></th>
                  </tr></thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} onClick={() => router.push(`/dashboard/leads/${r.id}`)} className="cursor-pointer border-b border-n100 transition last:border-0 hover:bg-n50">
                        <td className="p-2 pl-4"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: avatarBg(r.name) }}>{initials(r.name)}</span><div className="min-w-0 leading-tight"><p className="truncate font-semibold text-n900">{r.name}</p><p className="truncate text-[11px] text-n500">{r.phone}{r.phone && r.email ? " · " : ""}{r.email}</p></div></div></td>
                        <td className="p-2"><span className="inline-flex items-center rounded border border-n200 bg-white px-2 py-0.5 text-[11px] font-medium text-n600">{r.source}</span></td>
                        <td className="p-2"><p className="text-[12.5px] font-medium text-n900">{r.vehicle}</p></td>
                        <td className="p-2"><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold", TEMP_TONE[r.temperature] ?? "bg-n100 text-n600")}><span className="h-2 w-2 rounded-full" style={{ background: TEMP_DOT[r.temperature] ?? "#9aa0ac" }} />{r.temperature}</span></td>
                        <td className="p-2">{r.assigned ? <span className="inline-flex items-center gap-1 rounded-full border border-n200 px-2 py-1 text-[12px] text-n700"><UserIcon className="h-3 w-3" />{r.assigned}</span> : <span className="inline-flex items-center rounded-full border border-dashed border-n300 px-2 py-1 text-[12px] text-n400">Unassigned</span>}</td>
                        <td className="tnum p-2 text-[12.5px] text-n500">{r.lastAdded}</td>
                        <td className="p-2" onClick={(e) => e.stopPropagation()}><ActionsMenu r={r} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {adding && <AddLeadSheet open onClose={() => setAdding(false)} onCreated={reload} />}
    </>
  );
}
