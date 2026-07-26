"use client";

import { useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { useApi } from "@/lib/useApi";
import { NewCampaignSheet } from "@/components/app/NewCampaignSheet";
import { Megaphone } from "lucide-react";

type Campaign = {
  id: string; name: string; channel: string; objective: string; status: string;
  budgetCents: number; feeCents: number; netSpendCents: number; spentCents: number; leadCount: number;
};
type Data = { items: Campaign[]; stats: { active: number; spentCents: number; leads: number } };

const CHANNEL_LABEL: Record<string, string> = { FACEBOOK: "Facebook", INSTAGRAM: "Instagram", GOOGLE: "Google" };
const OBJ_LABEL: Record<string, string> = { LEADS: "Leads", CALLS: "Calls", TRAFFIC: "Traffic", MESSAGES: "Messages" };
const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-n100 text-n600" },
  PENDING_REVIEW: { label: "In review", cls: "bg-warn-soft text-warn" },
  ACTIVE: { label: "Active", cls: "bg-ok-soft text-ok" },
  PAUSED: { label: "Paused", cls: "bg-n100 text-n600" },
  ENDED: { label: "Ended", cls: "bg-n100 text-n500" },
  REJECTED: { label: "Rejected", cls: "bg-err-soft text-err" },
};
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export default function CampaignsPage() {
  const { data, reload } = useApi<Data>("/campaigns");
  const [open, setOpen] = useState(false);
  const items = data?.items ?? [];
  const stats = data?.stats;

  const KPIS: [string, string][] = [
    ["Active campaigns", `${stats?.active ?? 0}`],
    ["Spend · MTD", money(stats?.spentCents ?? 0)],
    ["Leads · MTD", `${stats?.leads ?? 0}`],
    ["Blended ROAS", "—"],
  ];

  return (
    <>
      <Topbar title="Campaigns" action={{ label: "New campaign", onClick: () => setOpen(true) }} />
      <AppMain>
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map(([l, v]) => (
            <Card key={l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{v}</p></Card>
          ))}
        </div>

        <Card>
          {items.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Megaphone className="h-6 w-6" /></span>
              <p className="text-[15px] font-semibold text-n900">No campaigns yet</p>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-relaxed text-n500">Launch your first campaign — choose an objective, promote inventory, set a budget. Krakd deducts a flat 10% and puts 90% into real media spend, then matches every sale back to the ad.</p>
              <button onClick={() => setOpen(true)} className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Launch a campaign</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-n200 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-n500">
                    <th className="px-4 py-2.5">Campaign</th>
                    <th className="px-3 py-2.5">Network</th>
                    <th className="px-3 py-2.5">Objective</th>
                    <th className="px-3 py-2.5 text-right">Budget</th>
                    <th className="px-3 py-2.5 text-right">Media spend</th>
                    <th className="px-3 py-2.5 text-right">Leads</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => {
                    const s = STATUS[c.status] ?? STATUS.DRAFT;
                    return (
                      <tr key={c.id} className="border-b border-n100 last:border-0 hover:bg-n50">
                        <td className="px-4 py-3 font-medium text-n900">{c.name}</td>
                        <td className="px-3 py-3 text-n600">{CHANNEL_LABEL[c.channel] ?? c.channel}</td>
                        <td className="px-3 py-3 text-n600">{OBJ_LABEL[c.objective] ?? c.objective}</td>
                        <td className="tnum px-3 py-3 text-right text-n900">{money(c.budgetCents)}</td>
                        <td className="tnum px-3 py-3 text-right text-n600">{money(c.netSpendCents)}</td>
                        <td className="tnum px-3 py-3 text-right text-n900">{c.leadCount}</td>
                        <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </AppMain>

      <NewCampaignSheet open={open} onClose={() => setOpen(false)} onCreated={reload} />
    </>
  );
}
