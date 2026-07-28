"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/cn";

type Client = {
  id: string; name: string; city: string | null; state: string | null; adminEmail: string; status: string;
  subscription: { status: string; priceCents: number }; services: { ai: boolean; inventory: boolean; ads: boolean; website: boolean };
  adBudgetCents: number; website: { live: boolean; domainStatus: string }; inventory: { count: number; lastSync: string; stale: boolean };
  health: number; owner: string; attention: string[];
};
const money = (c: number) => `$${Math.round(c / 100).toLocaleString()}`;
const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "bg-ok-soft text-ok" }, PENDING: { label: "Onboarding", cls: "bg-brand-soft text-brand" },
  PAST_DUE: { label: "Past due", cls: "bg-warn-soft text-warn" }, SUSPENDED: { label: "Suspended", cls: "bg-err-soft text-err" },
};
const healthTone = (h: number) => (h >= 80 ? "bg-ok" : h >= 50 ? "bg-warn" : "bg-err");
const QUEUE_LABEL: Record<string, string> = { attention: "Needs attention", billing: "Billing", inventory: "Inventory", domains: "Domains & websites", onboarding: "Onboarding", advertising: "Advertising", support: "Support" };

function inQueue(c: Client, q: string) {
  switch (q) {
    case "attention": return c.attention.length > 0;
    case "billing": return ["PAST_DUE", "CANCELED"].includes(c.subscription.status) || c.status === "SUSPENDED";
    case "inventory": return c.inventory.count === 0 || c.inventory.stale;
    case "domains": return ["PENDING_DNS", "ACTION_REQUIRED"].includes(c.website.domainStatus);
    case "onboarding": return !c.website.live || c.inventory.count === 0;
    case "advertising": return c.services.ads;
    default: return true;
  }
}

export default function AdminClients() {
  const { data, loading } = useApi<{ items: Client[] }>("/admin/clients");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [queue, setQueue] = useState("");

  useEffect(() => { setQueue(new URLSearchParams(window.location.search).get("queue") ?? ""); }, []);

  const items = useMemo(() => {
    let list = data?.items ?? [];
    if (queue) list = list.filter((c) => inQueue(c, queue));
    if (status !== "all") list = list.filter((c) => c.status === status);
    if (q) list = list.filter((c) => `${c.name} ${c.adminEmail} ${c.city ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [data, q, status, queue]);

  const badge = (on: boolean, label: string) => <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", on ? "bg-n900 text-white" : "bg-n100 text-n400")}>{label}</span>;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-n900">Clients{queue && <span className="ml-2 text-[14px] font-medium text-n400">· {QUEUE_LABEL[queue] ?? queue}</span>}</h1>
          <p className="text-[13px] text-n500">{items.length} of {data?.items.length ?? 0} dealerships</p>
        </div>
        {queue && <Link href="/admin/clients" className="text-[12.5px] font-semibold text-brand">Clear queue ×</Link>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dealership, admin email or city…" className="h-10 flex-1 min-w-[240px] rounded-lg border border-n200 bg-white px-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-n200 bg-white px-3 text-[13px] outline-none">
          <option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="PENDING">Onboarding</option><option value="PAST_DUE">Past due</option><option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-n200 bg-white sh-card">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-n200 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-n500">
            <th className="px-4 py-3">Client</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Services</th><th className="px-3 py-3 text-right">Ad budget</th><th className="px-3 py-3">Website</th><th className="px-3 py-3">Inventory</th><th className="px-3 py-3">Health</th><th className="px-3 py-3">Owner</th>
          </tr></thead>
          <tbody>
            {loading && !data ? <tr><td colSpan={8} className="px-4 py-12 text-center text-n400">Loading…</td></tr>
              : items.length === 0 ? <tr><td colSpan={8} className="px-4 py-12 text-center text-n400">No clients match.</td></tr>
              : items.map((c) => {
                const s = STATUS[c.status] ?? { label: c.status, cls: "bg-n100 text-n600" };
                return (
                  <tr key={c.id} className="cursor-pointer border-b border-n100 last:border-0 hover:bg-n50" onClick={() => (window.location.href = `/admin/clients/${c.id}`)}>
                    <td className="px-4 py-3"><Link href={`/admin/clients/${c.id}`} className="font-semibold text-n900 hover:text-brand">{c.name}</Link><p className="text-[11.5px] text-n400">{c.adminEmail}{c.city ? ` · ${c.city}` : ""}</p></td>
                    <td className="px-3 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", s.cls)}>{s.label}</span></td>
                    <td className="px-3 py-3"><div className="flex gap-1">{badge(c.services.ai, "AI")}{badge(c.services.inventory, "INV")}{badge(c.services.ads, "ADS")}{badge(c.services.website, "WEB")}</div></td>
                    <td className="tnum px-3 py-3 text-right text-n900">{c.adBudgetCents > 0 ? money(c.adBudgetCents) : "—"}</td>
                    <td className="px-3 py-3 text-n600">{c.website.live ? "Live" : c.website.domainStatus === "PENDING_DNS" || c.website.domainStatus === "ACTION_REQUIRED" ? <span className="text-warn">Domain pending</span> : "Not published"}</td>
                    <td className="px-3 py-3 text-n600">{c.inventory.count === 0 ? <span className="text-err">None</span> : <>{c.inventory.count} · <span className={c.inventory.stale ? "text-warn" : "text-n400"}>{c.inventory.lastSync}</span></>}</td>
                    <td className="px-3 py-3"><span className="inline-flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", healthTone(c.health))} /><span className="tnum font-semibold text-n700">{c.health}</span></span></td>
                    <td className="px-3 py-3 text-n500">{c.owner}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
