"use client";

import { useState } from "react";
import Link from "next/link";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { useApi } from "@/lib/useApi";
import { apiFetch } from "@/lib/api";
import { NETWORKS, money } from "@/lib/networks";
import { Wifi, WifiOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

type Net = { channel: string; spendCents: number; leads: number; active: number; count: number };
type Summary = { connections: Record<string, boolean>; networks: Net[] };

export default function AdAccountsPage() {
  const { data, loading, reload } = useApi<Summary>("/marketing/summary");
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (id: string, next: boolean) => {
    setBusy(id);
    try { await apiFetch("/marketing/connections", { method: "PATCH", body: JSON.stringify({ network: id, connected: next }) }); reload(); }
    finally { setBusy(null); }
  };

  return (
    <>
      <Topbar crumbs={[{ label: "Digital Marketing", href: "/dashboard/marketing" }, { label: "Ad accounts" }]} />
      <AppMain>
        <p className="mb-4 max-w-[70ch] text-[13.5px] text-n600">Connect the ad accounts Krakd publishes to. Once connected, campaigns you submit go live automatically and their spend, impressions and leads sync back into your dashboard.</p>

        <div className="grid gap-3 lg:grid-cols-3">
          {NETWORKS.map((n) => {
            const connected = !!data?.connections[n.id];
            const stat = data?.networks.find((x) => x.channel === n.channel);
            const ready = !!data;
            return (
              <Card key={n.id} className="flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-n100">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={n.logo} alt={n.name} className={`h-6 w-6 ${ready && connected ? "" : "opacity-40 grayscale"}`} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-n900">{n.name}</p>
                    <p className="text-[12px] text-n500">{n.sub}</p>
                  </div>
                </div>

                <div className="mt-3">
                  {!ready ? <span className="inline-flex items-center gap-1 text-[12px] font-medium text-n400"><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking…</span>
                    : <span className={`inline-flex items-center gap-1 text-[12.5px] font-medium ${connected ? "text-ok" : "text-n500"}`}>{connected ? <><Wifi className="h-3.5 w-3.5" />Connected</> : <><WifiOff className="h-3.5 w-3.5" />Not connected</>}</span>}
                </div>

                {connected && stat && (
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-n100 pt-3 text-center">
                    <div><p className="tnum text-[15px] font-semibold text-n900">{money(stat.spendCents)}</p><p className="text-[10.5px] uppercase tracking-wide text-n500">Spend</p></div>
                    <div><p className="tnum text-[15px] font-semibold text-n900">{stat.leads}</p><p className="text-[10.5px] uppercase tracking-wide text-n500">Leads</p></div>
                    <div><p className="tnum text-[15px] font-semibold text-n900">{stat.active}</p><p className="text-[10.5px] uppercase tracking-wide text-n500">Active</p></div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 pt-0">
                  {ready && (
                    <button onClick={() => toggle(n.id, !connected)} disabled={busy === n.id} className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-[12.5px] font-semibold transition disabled:opacity-60 ${connected ? "border border-n200 bg-white text-n700 hover:bg-n100" : "bg-brand text-white hover:bg-brand-hover"}`}>{busy === n.id && <Loader2 className="h-4 w-4 animate-spin" />}{connected ? "Disconnect" : `Connect ${n.name}`}</button>
                  )}
                  <Link href={`/dashboard/marketing/${n.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-semibold text-n700 transition hover:bg-n100">Manage<ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </Card>
            );
          })}
        </div>

        {!loading && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-n50 p-4 text-[12.5px] text-n600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>Connecting authorizes Krakd to publish and manage ads on your behalf — we never post without a campaign you&apos;ve approved. You can disconnect any time.</span>
          </div>
        )}
      </AppMain>
    </>
  );
}
