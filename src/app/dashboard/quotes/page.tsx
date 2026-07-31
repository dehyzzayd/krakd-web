"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/app/Topbar";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Plus, FileText, Loader2 } from "lucide-react";

type Q = { id: string; number: string; clientName: string; projectTitle: string | null; status: string; total: number; lineItems: number; validUntil: string | null; createdAt: string };
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const STATUS: Record<string, string> = { DRAFT: "bg-n100 text-n600", SENT: "bg-brand-soft text-brand", ACCEPTED: "bg-ok-soft text-ok", DECLINED: "bg-err-soft text-err", EXPIRED: "bg-warn-soft text-warn" };
const TABS = [["all", "All"], ["DRAFT", "Drafts"], ["SENT", "Sent"], ["ACCEPTED", "Accepted"], ["DECLINED", "Declined"]] as const;

export default function QuotesPage() {
  const router = useRouter();
  const { data, loading } = useApi<{ items: Q[] }>("/quotes");
  const [tab, setTab] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const rows = data?.items ?? [];
  const list = rows.filter((q) => tab === "all" || q.status === tab);

  const create = async () => { setCreating(true); try { const r = await apiFetch<{ id: string }>("/quotes", { method: "POST", body: JSON.stringify({}) }); router.push(`/dashboard/quotes/${r.id}`); } finally { setCreating(false); } };

  const pipeline = ["DRAFT", "SENT", "ACCEPTED"].map((s) => ({ s, n: rows.filter((r) => r.status === s).length, v: rows.filter((r) => r.status === s).reduce((a, b) => a + b.total, 0) }));

  return (
    <>
      <Topbar title="Quotes" />
      <div className="w-full px-6 py-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-[20px] font-bold text-n900">Quotes & estimates</h1><p className="mt-0.5 text-[12px] text-n500">Build, send and track client estimates.</p></div>
          <button onClick={create} disabled={creating} className="btn-brand inline-flex h-9 items-center gap-2 rounded-md px-4 text-[13px] font-semibold text-white disabled:opacity-60">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}New quote</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {pipeline.map((p) => (
            <div key={p.s} className="rounded-2xl border border-n200 bg-white p-4 sh-card">
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-n500">{p.s === "DRAFT" ? "Drafts" : p.s === "SENT" ? "Awaiting response" : "Accepted"}</p>
              <p className="tnum mt-1.5 text-[24px] font-semibold text-n900">{money(p.v)}</p>
              <p className="text-[12px] text-n400">{p.n} quote{p.n === 1 ? "" : "s"}</p>
            </div>
          ))}
        </div>

        <div className="pt-5">
          <div className="rounded-2xl border border-n200 bg-white sh-card">
            <div className="flex flex-wrap items-center gap-2 border-b border-n200 p-4">{TABS.map(([k, label]) => { const on = tab === k; const c = k === "all" ? rows.length : rows.filter((r) => r.status === k).length; return <button key={k} onClick={() => setTab(k)} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition", on ? "bg-brand text-white" : "text-n500 hover:bg-n100")}>{label}<span className={cn("grid h-4 min-w-5 place-items-center rounded-full px-1.5 text-[10px]", on ? "bg-white text-brand" : "bg-n100 text-n500")}>{c}</span></button>; })}</div>

            {loading ? <div className="p-12 text-center text-[13px] text-n400">Loading…</div>
              : list.length === 0 ? (
                <div className="px-4 py-16 text-center">
                  <FileText className="mx-auto h-7 w-7 text-n300" />
                  <p className="mt-2 text-[14px] font-semibold text-n800">{rows.length === 0 ? "No quotes yet" : "Nothing here"}</p>
                  <p className="mx-auto mt-1 max-w-[40ch] text-[12.5px] text-n500">Create your first estimate — add line items, set your price, and send a clean client link.</p>
                  {rows.length === 0 && <button onClick={create} className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">New quote</button>}
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead className="bg-n50/60"><tr className="border-b border-n200 text-[11px] font-bold uppercase tracking-wide text-n500"><th className="px-4 py-2.5 text-left">Quote</th><th className="px-2 text-left">Client</th><th className="px-2 text-left">Project</th><th className="px-2 text-right">Total</th><th className="px-2 text-left">Status</th><th className="px-2 text-right">Created</th></tr></thead>
                  <tbody>
                    {list.map((q) => (
                      <tr key={q.id} onClick={() => router.push(`/dashboard/quotes/${q.id}`)} className="cursor-pointer border-b border-n100 transition last:border-0 hover:bg-n50">
                        <td className="p-2 pl-4 font-semibold text-n900">{q.number}</td>
                        <td className="p-2 text-n700">{q.clientName}</td>
                        <td className="p-2 text-n600">{q.projectTitle || "—"}</td>
                        <td className="tnum p-2 text-right font-semibold text-n900">{money(q.total)}</td>
                        <td className="p-2"><span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold", STATUS[q.status])}>{q.status}</span></td>
                        <td className="tnum p-2 pr-3 text-right text-[12px] text-n500">{new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
