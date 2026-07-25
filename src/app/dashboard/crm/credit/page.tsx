"use client";

import { useState } from "react";
import Link from "next/link";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, Badge, Dot, type Tone } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { CREDIT_APPS, money } from "@/lib/crm";

const ST_TONE: Record<string, Tone> = { submitted: "brand", approved: "ok", declined: "err" };
const ST_LABEL: Record<string, string> = { submitted: "Submitted", approved: "Approved", declined: "Declined" };
const FILTERS: { k: "all" | "submitted" | "approved" | "declined"; label: string }[] = [
  { k: "all", label: "All" }, { k: "submitted", label: "Submitted" }, { k: "approved", label: "Approved" }, { k: "declined", label: "Declined" },
];

export default function CreditAppsPage() {
  const [filter, setFilter] = useState<"all" | "submitted" | "approved" | "declined">("all");
  const list = CREDIT_APPS.filter((c) => filter === "all" || c.status === filter);
  const approved = CREDIT_APPS.filter((c) => c.status === "approved");
  const avgFico = approved.length ? Math.round(approved.reduce((s, c) => s + (c.fico ?? 0), 0) / approved.length) : 0;

  return (
    <>
      <Topbar title="Credit applications" action={{ label: "New application" }} />
      <AppMain>
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { l: "Applications", v: String(CREDIT_APPS.length) },
            { l: "Approved", v: String(approved.length) },
            { l: "Avg FICO", v: avgFico ? String(avgFico) : "—" },
            { l: "Financed", v: money(CREDIT_APPS.reduce((s, c) => s + c.amount, 0)) },
          ].map((k) => (
            <Card key={k.l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{k.l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{k.v}</p></Card>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-1 rounded-lg border border-n200 bg-white p-0.5 w-max">
          {FILTERS.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} className={cn("h-8 rounded-[7px] px-3 text-[12.5px] font-medium transition", filter === f.k ? "bg-n100 text-n900" : "text-n600 hover:text-n900")}>{f.label}</button>)}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                <th className="px-4 py-2.5 font-medium">Applicant</th><th className="px-3 py-2.5 font-medium">Vehicle</th>
                <th className="px-3 py-2.5 font-medium">Status</th><th className="px-3 py-2.5 text-right font-medium">FICO</th>
                <th className="px-3 py-2.5 font-medium">Tier</th><th className="px-3 py-2.5 text-right font-medium">Amount</th><th className="px-4 py-2.5 text-right font-medium">Submitted</th>
              </tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.leadId} className="border-t border-n200 transition hover:bg-n50">
                    <td className="px-4 py-2.5"><Link href={`/dashboard/leads/${c.leadId}`} className="text-[13px] font-medium text-n900 hover:text-brand">{c.name}</Link></td>
                    <td className="px-3 py-2.5 text-[12.5px] text-n700">{c.vehicle}</td>
                    <td className="px-3 py-2.5"><Badge tone={ST_TONE[c.status]}><Dot tone={ST_TONE[c.status]} />{ST_LABEL[c.status]}</Badge></td>
                    <td className="tnum px-3 py-2.5 text-right text-[13px] text-n800">{c.fico ?? "—"}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-n600">{c.tier}</td>
                    <td className="tnum px-3 py-2.5 text-right text-[13px] font-medium text-n900">{money(c.amount)}</td>
                    <td className="tnum px-4 py-2.5 text-right text-[12px] text-n400">{c.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </AppMain>
    </>
  );
}
