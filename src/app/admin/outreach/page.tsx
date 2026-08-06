"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/cn";
import { formatUSPhone } from "@/lib/phone";
import { OutreachSheet, OUTREACH_STATUSES } from "@/components/admin/OutreachSheet";
import { Plus, Search, Target } from "lucide-react";

type Item = {
  id: string; company: string; contactName: string | null; title: string | null; email: string | null; phone: string | null;
  website: string | null; city: string | null; state: string | null; category: string | null; status: string; source: string | null;
  value: number; ownerId: string | null; ownerName: string | null; nextFollowUpAt: string | null; lastContactedAt: string | null; notes: number; updatedAt: string;
};
type Payload = { items: Item[]; stats: { total: number; open: number; won: number; openValue: number; wonValue: number; byStatus: Record<string, number> }; team: { id: string; name: string }[]; categories: string[] };

const money = (n: number) => `$${n.toLocaleString()}`;
export const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-n100 text-n600", CONTACTED: "bg-brand-soft text-brand", INTERESTED: "bg-brand-soft text-brand",
  DEMO: "bg-warn-soft text-warn", NEGOTIATING: "bg-warn-soft text-warn", WON: "bg-ok-soft text-ok", LOST: "bg-err-soft text-err",
};
const label = (v: string) => OUTREACH_STATUSES.find((s) => s.v === v)?.label ?? v;
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—");

export default function AdminOutreach() {
  const { data, loading, reload } = useApi<Payload>("/outreach");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [owner, setOwner] = useState("all");
  const [cat, setCat] = useState("all");
  const [sheet, setSheet] = useState(false);

  const items = useMemo(() => {
    let list = data?.items ?? [];
    if (status !== "all") list = list.filter((i) => i.status === status);
    if (owner !== "all") list = list.filter((i) => (owner === "none" ? !i.ownerId : i.ownerId === owner));
    if (cat !== "all") list = list.filter((i) => i.category === cat);
    if (q) { const s = q.toLowerCase(); list = list.filter((i) => `${i.company} ${i.contactName ?? ""} ${i.email ?? ""} ${i.city ?? ""}`.toLowerCase().includes(s)); }
    return list;
  }, [data, q, status, owner, cat]);

  const st = data?.stats;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-n900"><Target className="h-5 w-5 text-brand" />Outreach</h1>
          <p className="text-[13px] text-n500">Your team&apos;s sales pipeline for signing up dealers.</p>
        </div>
        <button onClick={() => setSheet(true)} className="btn-brand inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold"><Plus className="h-4 w-4" />Add prospect</button>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["Open prospects", String(st?.open ?? 0)], ["Pipeline value", money(st?.openValue ?? 0)], ["Won", String(st?.won ?? 0)], ["Won value", money(st?.wonValue ?? 0)]] as [string, string][]).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-n200 bg-white p-4 sh-card"><p className="text-[11.5px] font-medium text-n500">{k}</p><p className="tnum mt-1 text-[20px] font-bold text-n900">{v}</p></div>
        ))}
      </div>

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-n200 bg-n50 p-1.5">
          <button onClick={() => setStatus("all")} className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition", status === "all" ? "bg-white text-n900 sh-card" : "text-n600 hover:text-n900")}>All <span className="text-n400">{data?.items.length ?? 0}</span></button>
          {OUTREACH_STATUSES.map((s) => (
            <button key={s.v} onClick={() => setStatus(s.v)} className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition", status === s.v ? "bg-white text-n900 sh-card" : "text-n600 hover:text-n900")}>{s.label} <span className="text-n400">{st?.byStatus?.[s.v] ?? 0}</span></button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-n400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, contact, city…" className="h-9 w-64 rounded-lg border border-n200 bg-white pl-8 pr-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-lg border border-n200 bg-white px-2.5 text-[13px] text-n700 outline-none"><option value="all">All categories</option>{(data?.categories ?? []).map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-9 rounded-lg border border-n200 bg-white px-2.5 text-[13px] text-n700 outline-none"><option value="all">All owners</option><option value="none">Unassigned</option>{(data?.team ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      </div>

      {/* table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-n200 bg-white sh-card">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-n200 bg-n50 text-[11px] font-semibold uppercase tracking-wide text-n500">
            <tr><th className="px-4 py-2.5">Company</th><th className="px-4 py-2.5">Contact</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Owner</th><th className="px-4 py-2.5 text-right">Value</th><th className="px-4 py-2.5">Follow-up</th></tr>
          </thead>
          <tbody className="divide-y divide-n100">
            {loading && !data ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-n400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center"><p className="text-[13px] font-medium text-n600">No prospects yet</p><p className="mt-0.5 text-[12px] text-n400">Add your first dealer to start the pipeline.</p></td></tr>
            ) : items.map((i) => (
              <tr key={i.id} className="group cursor-pointer transition hover:bg-n50">
                <td className="px-4 py-3"><Link href={`/admin/outreach/${i.id}`} className="block"><span className="font-semibold text-n900 group-hover:text-brand">{i.company}</span>{(i.city || i.state) && <span className="block text-[11.5px] text-n400">{[i.city, i.state].filter(Boolean).join(", ")}</span>}</Link></td>
                <td className="px-4 py-3"><Link href={`/admin/outreach/${i.id}`} className="block">{i.contactName || <span className="text-n400">—</span>}{i.phone && <span className="tnum block text-[11.5px] text-n400">{formatUSPhone(i.phone)}</span>}</Link></td>
                <td className="px-4 py-3 text-n600"><Link href={`/admin/outreach/${i.id}`} className="block">{i.category || "—"}</Link></td>
                <td className="px-4 py-3"><Link href={`/admin/outreach/${i.id}`} className="block"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_BADGE[i.status])}>{label(i.status)}</span></Link></td>
                <td className="px-4 py-3 text-n600"><Link href={`/admin/outreach/${i.id}`} className="block">{i.ownerName || <span className="text-n400">Unassigned</span>}</Link></td>
                <td className="px-4 py-3 text-right"><Link href={`/admin/outreach/${i.id}`} className="tnum block font-semibold text-n900">{i.value ? money(i.value) : "—"}</Link></td>
                <td className="px-4 py-3 text-n600"><Link href={`/admin/outreach/${i.id}`} className="tnum block">{fmtDate(i.nextFollowUpAt)}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OutreachSheet open={sheet} onClose={() => setSheet(false)} onSaved={reload} team={data?.team ?? []} categories={data?.categories ?? []} />
    </div>
  );
}
