"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { useApi } from "@/lib/useApi";
import { NewCampaignSheet } from "@/components/app/NewCampaignSheet";
import { NETWORKS, netByChannel, money } from "@/lib/networks";
import { Megaphone, Wifi, WifiOff, ArrowRight } from "lucide-react";

type Net = { channel: string; spendCents: number; budgetCents: number; impressions: number; clicks: number; leads: number; active: number; count: number };
type Summary = { connections: Record<string, boolean>; totals: Net; networks: Net[] };
type Camp = { id: string; name: string; channel: string; status: string; spentCents: number; leadCount: number };

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-n100 text-n600" }, PENDING_REVIEW: { label: "In review", cls: "bg-warn-soft text-warn" },
  ACTIVE: { label: "Active", cls: "bg-ok-soft text-ok" }, PAUSED: { label: "Paused", cls: "bg-n100 text-n600" },
  ENDED: { label: "Ended", cls: "bg-n100 text-n500" }, REJECTED: { label: "Rejected", cls: "bg-err-soft text-err" },
};

export default function MarketingOverview() {
  const router = useRouter();
  const { data, loading, reload } = useApi<Summary>("/marketing/summary");
  const { data: camps, reload: reloadCamps } = useApi<{ items: Camp[] }>("/campaigns");
  const [open, setOpen] = useState(false);

  const t = data?.totals;
  const cpl = t && t.leads > 0 ? t.spendCents / t.leads : 0;
  const recent = (camps?.items ?? []).slice(0, 6);
  const anyConnected = data && Object.values(data.connections).some(Boolean);

  const KPIS: [string, string][] = [
    ["Ad spend · MTD", money(t?.spendCents ?? 0)],
    ["Impressions", (t?.impressions ?? 0).toLocaleString()],
    ["Leads", `${t?.leads ?? 0}`],
    ["Cost per lead", cpl ? money(cpl) : "—"],
  ];

  return (
    <>
      <Topbar title="Digital Marketing" action={{ label: "New campaign", onClick: () => setOpen(true) }} />
      <AppMain>
        <p className="mb-4 text-[13.5px] text-n600">Connect your ad accounts, launch campaigns, and Krakd publishes them for you — then reports the numbers that matter back here.</p>

        {/* live KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map(([l, v]) => (
            <Card key={l} className="p-4"><p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-2 text-[26px] font-semibold leading-none text-n900">{loading ? "—" : v}</p></Card>
          ))}
        </div>

        {/* networks — each a live, clickable channel */}
        <p className="mb-2 mt-6 text-[13px] font-semibold text-n900">Ad accounts</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {NETWORKS.map((n) => {
            const connected = !!data?.connections[n.id];
            const stat = data?.networks.find((x) => x.channel === n.channel);
            return (
              <Link key={n.id} href={`/dashboard/marketing/${n.id}`} className="group rounded-2xl border border-n200 bg-white p-4 transition hover:border-n300 hover:shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-n100">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={n.logo} alt={n.name} className={`h-5 w-5 ${connected ? "" : "opacity-40 grayscale"}`} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-n900">{n.name}</span>
                    <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium ${connected ? "text-ok" : "text-n500"}`}>{connected ? <><Wifi className="h-3 w-3" />Connected</> : <><WifiOff className="h-3 w-3" />Not connected</>}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-n300 transition group-hover:text-n500" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-n100 pt-3 text-center">
                  <div><p className="tnum text-[15px] font-semibold text-n900">{money(stat?.spendCents ?? 0)}</p><p className="text-[10.5px] uppercase tracking-wide text-n500">Spend</p></div>
                  <div><p className="tnum text-[15px] font-semibold text-n900">{stat?.leads ?? 0}</p><p className="text-[10.5px] uppercase tracking-wide text-n500">Leads</p></div>
                  <div><p className="tnum text-[15px] font-semibold text-n900">{stat?.active ?? 0}</p><p className="text-[10.5px] uppercase tracking-wide text-n500">Active</p></div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* recent campaigns */}
        <div className="mb-2 mt-6 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-n900">Recent campaigns</p>
          <Link href="/dashboard/marketing/campaigns" className="text-[12.5px] font-semibold text-brand hover:underline">View all</Link>
        </div>
        <Card>
          {recent.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Megaphone className="h-6 w-6" /></span>
              <p className="text-[15px] font-semibold text-n900">{anyConnected ? "No campaigns yet" : "Connect an account to start"}</p>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-relaxed text-n500">Launch a campaign — pick a network, promote your inventory, set a budget. Krakd takes a flat 10% and puts 90% into real media spend.</p>
              <button onClick={() => setOpen(true)} className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Launch a campaign</button>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="border-b border-n200 text-[11px] font-bold uppercase tracking-wide text-n500"><tr><th className="px-4 py-2.5 text-left">Campaign</th><th className="px-2 text-left">Network</th><th className="px-2 text-right">Spend</th><th className="px-2 text-right">Leads</th><th className="px-2 py-2.5 pr-4 text-left">Status</th></tr></thead>
              <tbody>
                {recent.map((c) => {
                  const n = netByChannel(c.channel); const s = STATUS[c.status] ?? STATUS.DRAFT;
                  return (
                    <tr key={c.id} onClick={() => router.push(`/dashboard/marketing/campaigns/${c.id}`)} className="cursor-pointer border-b border-n100 transition last:border-0 hover:bg-n50">
                      <td className="px-4 py-3 font-medium text-n900">{c.name}</td>
                      <td className="px-2"><span className="inline-flex items-center gap-1.5 text-n600">{n && /* eslint-disable-next-line @next/next/no-img-element */ <img src={n.logo} alt="" className="h-3.5 w-3.5" />}{n?.name ?? c.channel}</span></td>
                      <td className="tnum px-2 text-right text-n900">{money(c.spentCents)}</td>
                      <td className="tnum px-2 text-right text-n900">{c.leadCount}</td>
                      <td className="px-2 py-3 pr-4"><span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </AppMain>

      <NewCampaignSheet open={open} onClose={() => setOpen(false)} onCreated={() => { reload(); reloadCamps(); }} />
    </>
  );
}
