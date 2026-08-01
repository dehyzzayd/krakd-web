"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { useApi } from "@/lib/useApi";
import { apiFetch } from "@/lib/api";
import { NewCampaignSheet } from "@/components/app/NewCampaignSheet";
import { netById, money, type Channel } from "@/lib/networks";
import { Wifi, WifiOff, Megaphone, Plus, Loader2 } from "lucide-react";

type Net = { channel: string; spendCents: number; budgetCents: number; impressions: number; clicks: number; leads: number; active: number; count: number };
type Summary = { connections: Record<string, boolean>; totals: Net; networks: Net[] };
type Camp = { id: string; name: string; channel: string; status: string; spentCents: number; impressions: number; clicks: number; leadCount: number };

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-n100 text-n600" }, PENDING_REVIEW: { label: "In review", cls: "bg-warn-soft text-warn" },
  ACTIVE: { label: "Active", cls: "bg-ok-soft text-ok" }, PAUSED: { label: "Paused", cls: "bg-n100 text-n600" },
  ENDED: { label: "Ended", cls: "bg-n100 text-n500" }, REJECTED: { label: "Rejected", cls: "bg-err-soft text-err" },
};

export default function NetworkPage() {
  const router = useRouter();
  const { network } = useParams<{ network: string }>();
  const n = netById(network);
  const { data, reload } = useApi<Summary>("/marketing/summary");
  const { data: camps, reload: reloadCamps } = useApi<{ items: Camp[] }>("/campaigns");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!n) return (<><Topbar crumbs={[{ label: "Digital Marketing", href: "/dashboard/marketing" }, { label: "Network" }]} /><AppMain><p className="py-16 text-center text-[13px] text-n500">Unknown network.</p></AppMain></>);

  const connected = !!data?.connections[n.id];
  const stat = data?.networks.find((x) => x.channel === n.channel);
  const list = (camps?.items ?? []).filter((c) => c.channel === n.channel);
  const ctr = stat && stat.impressions > 0 ? (stat.clicks / stat.impressions) * 100 : 0;
  const cpl = stat && stat.leads > 0 ? stat.spendCents / stat.leads : 0;

  const toggle = async () => {
    setBusy(true);
    try { await apiFetch("/marketing/connections", { method: "PATCH", body: JSON.stringify({ network: n.id, connected: !connected }) }); reload(); }
    finally { setBusy(false); }
  };

  const METRICS: [string, string][] = [
    ["Spend", money(stat?.spendCents ?? 0)], ["Impressions", (stat?.impressions ?? 0).toLocaleString()],
    ["Clicks", (stat?.clicks ?? 0).toLocaleString()], ["CTR", ctr ? `${ctr.toFixed(2)}%` : "—"],
    ["Leads", `${stat?.leads ?? 0}`], ["Cost / lead", cpl ? money(cpl) : "—"],
  ];

  return (
    <>
      <Topbar crumbs={[{ label: "Digital Marketing", href: "/dashboard/marketing" }, { label: n.name }]} />
      <AppMain>
        {/* header */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-n100">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={n.logo} alt={n.name} className={`h-6 w-6 ${connected ? "" : "opacity-40 grayscale"}`} /></span>
          <div className="mr-auto">
            <h1 className="text-[20px] font-semibold text-n900">{n.name}</h1>
            <span className={`inline-flex items-center gap-1 text-[12.5px] font-medium ${connected ? "text-ok" : "text-n500"}`}>{connected ? <><Wifi className="h-3.5 w-3.5" />Connected</> : <><WifiOff className="h-3.5 w-3.5" />Not connected</>}</span>
          </div>
          <button onClick={toggle} disabled={busy} className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[12.5px] font-semibold transition disabled:opacity-60 ${connected ? "border border-n200 bg-white text-n700 hover:bg-n100" : "bg-brand text-white hover:bg-brand-hover"}`}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{connected ? "Disconnect" : `Connect ${n.name}`}</button>
          {connected && <button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover"><Plus className="h-4 w-4" />New campaign</button>}
        </div>

        {!connected && (
          <Card className="mt-4 p-5">
            <p className="text-[13.5px] font-semibold text-n900">Connect your {n.name} ad account</p>
            <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-n500">Authorize Krakd on {n.name} so we can publish campaigns to your account, sync your inventory, and pull spend, impressions and leads back into this dashboard automatically. Until then you can build campaigns as drafts — they&apos;ll go live the moment you connect.</p>
          </Card>
        )}

        {/* performance */}
        <p className="mb-2 mt-6 text-[13px] font-semibold text-n900">{n.name} performance</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {METRICS.map(([l, v]) => (
            <Card key={l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[19px] font-semibold text-n900">{v}</p></Card>
          ))}
        </div>

        {/* campaigns on this network */}
        <div className="mb-2 mt-6 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-n900">Campaigns on {n.name}</p>
          <Link href="/dashboard/marketing/campaigns" className="text-[12.5px] font-semibold text-brand hover:underline">All campaigns</Link>
        </div>
        <Card>
          {list.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Megaphone className="h-6 w-6" /></span>
              <p className="text-[15px] font-semibold text-n900">No {n.name} campaigns yet</p>
              <p className="mx-auto mt-1.5 max-w-[44ch] text-[13px] leading-relaxed text-n500">Launch your first campaign on {n.name} — promote inventory, set a budget, and it publishes to your connected account.</p>
              <button onClick={() => setOpen(true)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover"><Plus className="h-4 w-4" />New campaign</button>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="border-b border-n200 text-[11px] font-bold uppercase tracking-wide text-n500"><tr><th className="px-4 py-2.5 text-left">Campaign</th><th className="px-2 text-right">Spend</th><th className="px-2 text-right">Clicks</th><th className="px-2 text-right">Leads</th><th className="px-2 py-2.5 pr-4 text-left">Status</th></tr></thead>
              <tbody>
                {list.map((c) => {
                  const s = STATUS[c.status] ?? STATUS.DRAFT;
                  return (
                    <tr key={c.id} onClick={() => router.push(`/dashboard/marketing/campaigns/${c.id}`)} className="cursor-pointer border-b border-n100 transition last:border-0 hover:bg-n50">
                      <td className="px-4 py-3 font-medium text-n900">{c.name}</td>
                      <td className="tnum px-2 text-right text-n900">{money(c.spentCents)}</td>
                      <td className="tnum px-2 text-right text-n700">{c.clicks.toLocaleString()}</td>
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

      <NewCampaignSheet open={open} onClose={() => setOpen(false)} initialNetwork={n.channel as Channel} onCreated={() => { reload(); reloadCamps(); }} />
    </>
  );
}
