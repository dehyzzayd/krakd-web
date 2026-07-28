"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/cn";
import { AlertTriangle, CreditCard, Boxes, Globe, Rocket } from "lucide-react";

type Overview = {
  kpis: { activeClients: number; mrrCents: number; adBudgetCents: number; needsAttention: number; totalClients: number };
  queues: { billing: number; inventory: number; domains: number; onboarding: number };
  attention: { id: string; name: string; issue: string; count: number; health: number }[];
};
const money = (c: number) => `$${Math.round(c / 100).toLocaleString()}`;
const healthTone = (h: number) => (h >= 80 ? "bg-ok" : h >= 50 ? "bg-warn" : "bg-err");

export default function AdminOverview() {
  const { data, loading } = useApi<Overview>("/admin/overview");

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-n400">Internal operations</p>
      <h1 className="mt-1 text-[24px] font-bold tracking-tight text-n900">Client portfolio</h1>
      <p className="text-[13px] text-n500">Account health, subscribed services, budgets and operational issues — in one place.</p>

      {loading && !data ? <div className="py-16 text-center text-[13px] text-n400">Loading…</div> : data ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Active clients", `${data.kpis.activeClients}`, `of ${data.kpis.totalClients} total`],
              ["MRR", money(data.kpis.mrrCents), "Platform subscriptions"],
              ["Managed ad budgets", money(data.kpis.adBudgetCents), "Current monthly budgets"],
              ["Needs attention", `${data.kpis.needsAttention}`, "Payments, syncs, domains"],
            ].map(([l, v, s], i) => (
              <div key={l} className="rounded-2xl border border-n200 bg-white p-4 sh-card">
                <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p>
                <p className={cn("tnum mt-1.5 text-[24px] font-bold", i === 3 && data.kpis.needsAttention > 0 ? "text-err" : "text-n900")}>{v}</p>
                <p className="mt-0.5 text-[11.5px] text-n400">{s}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
              <h3 className="text-[14px] font-semibold text-n900">Needs attention</h3>
              <p className="text-[12px] text-n500">Client accounts that need an internal action today.</p>
              <div className="mt-3 space-y-2">
                {data.attention.length === 0 ? <p className="py-6 text-center text-[13px] text-n500">Everything&apos;s healthy. Nothing needs you right now.</p>
                  : data.attention.map((a) => (
                    <Link key={a.id} href={`/admin/clients/${a.id}`} className="flex items-center gap-3 rounded-lg border border-n200 px-3 py-2.5 transition hover:bg-n50">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", healthTone(a.health))} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-n900">{a.name}</span><span className="text-[12px] text-n500">{a.issue}</span></span>
                      {a.count > 1 && <span className="shrink-0 rounded-full bg-err-soft px-2 py-0.5 text-[11px] font-semibold text-err">{a.count} issues</span>}
                      <span className="tnum shrink-0 text-[12px] font-semibold text-n700">{a.health}</span>
                    </Link>
                  ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-n200 bg-n900 p-5 text-white sh-card">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Today</p>
                <p className="mt-1 text-[18px] font-bold">{data.kpis.needsAttention} accounts need action</p>
                <Link href="/admin/clients?queue=attention" className="mt-3 inline-block rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Open queue</Link>
              </div>
              <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
                <h3 className="mb-3 text-[13px] font-semibold text-n900">Work queues</h3>
                <div className="space-y-1.5">
                  {[["billing", "Billing", CreditCard, data.queues.billing], ["inventory", "Inventory", Boxes, data.queues.inventory], ["domains", "Domains & websites", Globe, data.queues.domains], ["onboarding", "Onboarding", Rocket, data.queues.onboarding]].map(([q, label, Icon, n]) => {
                    const I = Icon as React.ComponentType<{ className?: string }>;
                    return <Link key={q as string} href={`/admin/clients?queue=${q}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-n50"><I className="h-4 w-4 text-n400" /><span className="flex-1 text-[13px] text-n700">{label as string}</span><span className={cn("tnum rounded-full px-2 py-0.5 text-[11.5px] font-semibold", (n as number) > 0 ? "bg-warn-soft text-warn" : "bg-n100 text-n500")}>{n as number}</span></Link>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
      {data && <div className="mt-5 flex items-center gap-1.5 text-[11.5px] text-n400"><AlertTriangle className="h-3.5 w-3.5" />Live data across every dealership on Krakd.</div>}
    </div>
  );
}
