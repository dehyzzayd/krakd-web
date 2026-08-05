"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, ErrorBanner } from "@/components/app/AppKit";
import { useApi } from "@/lib/useApi";
import { NewCampaignSheet } from "@/components/app/NewCampaignSheet";
import { AreaChart, FunnelChart, SplitBar } from "@/components/app/Charts";
import { NETWORKS, netByChannel, money } from "@/lib/networks";
import { Megaphone, Wifi, WifiOff, ArrowRight, TrendingUp } from "lucide-react";

type Net = { channel: string; spendCents: number; budgetCents: number; impressions: number; clicks: number; leads: number; active: number; count: number };
type Day = { date: string; spendCents: number; impressions: number; clicks: number; leads: number };
type Metrics = { cpmCents: number; ctr: number; cpcCents: number; cplCents: number; costPerSoldCents: number; roas: number; grossCents: number };
type Stage = { key: string; value: number; rate: number | null; costEachCents: number };
type Summary = { connections: Record<string, boolean>; totals: Net; networks: Net[]; metrics: Metrics; sold: number; appts: number; funnel: Stage[]; daily: Day[] };

const NET_COLOR: Record<string, string> = { FACEBOOK: "#1877F2", INSTAGRAM: "#E1306C", GOOGLE: "#F4B400" };
const shortDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
type Camp = { id: string; name: string; channel: string; status: string; spentCents: number; leadCount: number };

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-n100 text-n600" }, PENDING_REVIEW: { label: "In review", cls: "bg-warn-soft text-warn" },
  ACTIVE: { label: "Active", cls: "bg-ok-soft text-ok" }, PAUSED: { label: "Paused", cls: "bg-n100 text-n600" },
  ENDED: { label: "Ended", cls: "bg-n100 text-n500" }, REJECTED: { label: "Rejected", cls: "bg-err-soft text-err" },
};

export default function MarketingOverview() {
  const router = useRouter();
  const { data, loading, error, reload } = useApi<Summary>("/marketing/summary");
  const { data: camps, reload: reloadCamps } = useApi<{ items: Camp[] }>("/campaigns");
  const [open, setOpen] = useState(false);

  const t = data?.totals;
  const cpl = t && t.leads > 0 ? t.spendCents / t.leads : 0;
  const recent = (camps?.items ?? []).slice(0, 6);
  const anyConnected = data && Object.values(data.connections).some(Boolean);

  const KPIS: [string, string][] = [
    ["Ad spend (recorded)", money(t?.spendCents ?? 0)],
    ["Attributed leads", `${t?.leads ?? 0}`],
    ["Sold", `${data?.sold ?? 0}`],
    ["Cost per lead", cpl ? money(cpl) : "—"],
  ];

  return (
    <>
      <Topbar title="Digital Marketing" action={{ label: "New campaign", onClick: () => setOpen(true) }} />
      <AppMain>
        {error && <ErrorBanner onRetry={reload} />}
        <p className="mb-3 text-[13.5px] text-n600">Build campaigns from your inventory, set a budget, and track the leads they drive — all in one place.</p>
        <div className="mb-4 rounded-lg border border-n200 bg-n50 px-3.5 py-2.5 text-[12px] leading-relaxed text-n600"><b className="text-n800">These numbers are real:</b> leads and sales are attributed from the tracked campaign links your ads use, and cost/ROI comes from the spend you record on each campaign. Automatic ad-account sync (live impressions &amp; spend) is still in preview.</div>

        {/* live KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map(([l, v]) => (
            <Card key={l} className="p-4"><p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-2 text-[26px] font-semibold leading-none text-n900">{loading ? "—" : v}</p></Card>
          ))}
        </div>

        {/* 30-day leads trend (real, from attributed lead timestamps) */}
        {t && (data?.daily?.some((d) => d.leads > 0)) && (
          <Card className="mt-3 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand" /><p className="text-[13px] font-semibold text-n900">Attributed leads · last 30 days</p></div>
              <div className="flex items-center gap-4 text-[11.5px] text-n500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#ff5a16" }} />Leads</span>
              </div>
            </div>
            <AreaChart data={(data?.daily ?? []).map((d) => ({ label: shortDate(d.date), a: d.leads, b: 0 }))} aName="Leads" bName="" fmtA={(n) => `${n}`} fmtB={(n) => `${n}`} />
          </Card>
        )}

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

        {/* sales matchback — impression → sold vehicle */}
        {t && t.count > 0 && data && (
          <div className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
            <Card className="p-5">
              <p className="text-[13px] font-semibold text-n900">Sales matchback</p>
              <p className="mb-4 mt-0.5 text-[12px] text-n500">From impression to sold vehicle — the cost at every step.</p>
              <FunnelChart stages={data.funnel.map((s) => ({ key: s.key, value: s.value, rate: s.rate, cost: s.value ? `${money(s.costEachCents)}/ea` : "—" }))} />
            </Card>
            <div className="space-y-3">
              <Card className="p-5">
                <p className="mb-3 text-[13px] font-semibold text-n900">Attributed results</p>
                <div className="grid grid-cols-2 gap-4">
                  {[["Sold vehicles", `${data.sold}`], ["Cost / sold", data.metrics.costPerSoldCents ? money(data.metrics.costPerSoldCents) : "—"], ["Est. ROAS", data.metrics.roas ? `${data.metrics.roas.toFixed(1)}×` : "—"], ["Cost / lead", data.metrics.cplCents ? money(data.metrics.cplCents) : "—"]].map(([l, v]) => (
                    <div key={l}><p className="tnum text-[22px] font-semibold text-n900">{v}</p><p className="text-[11px] uppercase tracking-wide text-n500">{l}</p></div>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <p className="mb-3 text-[13px] font-semibold text-n900">Spend by network</p>
                <SplitBar parts={data.networks.map((nw) => ({ label: netByChannel(nw.channel)?.name ?? nw.channel, value: nw.spendCents, color: NET_COLOR[nw.channel] ?? "#94a3b8" }))} />
              </Card>
            </div>
          </div>
        )}

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
                      <td className="px-4 py-3 font-medium text-n900"><Link href={`/dashboard/marketing/campaigns/${c.id}`} onClick={(e) => e.stopPropagation()} className="rounded outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40">{c.name}</Link></td>
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
