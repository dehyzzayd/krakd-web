"use client";

import { useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, ErrorBanner } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/useApi";
import { Download } from "lucide-react";

type Rep = { id: string; name: string; assigned: number; appts: number; sold: number; closeRate: number };
type Report = {
  range: string;
  totals: { total: number; sold: number; lost: number; closeRate: number };
  funnel: { key: string; label: string; value: number }[];
  sources: { source: string; count: number }[];
  perRep: Rep[];
};

const RANGES: [string, string][] = [["mtd", "This month"], ["30d", "Last 30 days"], ["7d", "Last 7 days"], ["all", "All time"]];

export default function ReportsPage() {
  const [range, setRange] = useState("mtd");
  const { data, loading, error, reload } = useApi<Report>(`/reports?range=${range}`);

  const t = data?.totals;
  const funnel = data?.funnel ?? [];
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.value));
  const sources = data?.sources ?? [];
  const maxSource = Math.max(1, ...sources.map((s) => s.count));
  const reps = data?.perRep ?? [];

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      ["Krakd report", RANGES.find((r) => r[0] === range)?.[1] ?? range].map(esc).join(","),
      "",
      ["Total leads", t?.total ?? 0].map(esc).join(","),
      ["Sold", t?.sold ?? 0].map(esc).join(","),
      ["Close rate %", t?.closeRate ?? 0].map(esc).join(","),
      "",
      ["Salesperson", "Assigned", "Appointments", "Sold", "Close rate %"].map(esc).join(","),
      ...reps.map((r) => [r.name, r.assigned, r.appts, r.sold, r.closeRate].map(esc).join(",")),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `krakd-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <Topbar title="Reports" />
      <AppMain>
        {error && <ErrorBanner onRetry={reload} />}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-[20px] font-bold text-n900">Reports</h1><p className="mt-0.5 text-[12px] text-n500">Funnel, close rate and team performance.</p></div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-n200 bg-white p-0.5">
              {RANGES.map(([v, label]) => <button key={v} onClick={() => setRange(v)} className={cn("h-8 rounded-md px-3 text-[12.5px] font-semibold transition", range === v ? "bg-n100 text-n900" : "text-n500 hover:text-n700")}>{label}</button>)}
            </div>
            <button onClick={exportCsv} className="inline-flex h-9 items-center gap-2 rounded-lg border border-n200 bg-white px-4 text-[13px] font-semibold text-n700 transition hover:bg-n100"><Download className="h-4 w-4" />Export</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["Total leads", t?.total ?? 0], ["Sold", t?.sold ?? 0], ["Close rate", `${t?.closeRate ?? 0}%`], ["Lost", t?.lost ?? 0]].map(([l, v]) => (
            <Card key={l as string} className="p-4"><p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className={cn("tnum mt-2 text-[26px] font-semibold leading-none text-n900", loading && "animate-pulse text-n300")}>{loading ? "—" : v}</p></Card>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* funnel */}
          <Card className="p-5">
            <p className="mb-4 text-[13px] font-semibold text-n900">Pipeline funnel</p>
            <div className="space-y-2.5">
              {funnel.map((f) => (
                <div key={f.key}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]"><span className="text-n700">{f.label}</span><span className="tnum font-semibold text-n900">{f.value}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-n100"><span className="block h-full rounded-full bg-brand" style={{ width: `${(f.value / maxFunnel) * 100}%` }} /></div>
                </div>
              ))}
              {funnel.length === 0 && <p className="py-6 text-center text-[12.5px] text-n400">No leads in this range yet.</p>}
            </div>
          </Card>

          {/* sources */}
          <Card className="p-5">
            <p className="mb-4 text-[13px] font-semibold text-n900">Leads by source</p>
            <div className="space-y-2.5">
              {sources.slice(0, 8).map((s) => (
                <div key={s.source}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]"><span className="text-n700">{s.source}</span><span className="tnum font-semibold text-n900">{s.count}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-n100"><span className="block h-full rounded-full bg-ok" style={{ width: `${(s.count / maxSource) * 100}%` }} /></div>
                </div>
              ))}
              {sources.length === 0 && <p className="py-6 text-center text-[12.5px] text-n400">No leads in this range yet.</p>}
            </div>
          </Card>
        </div>

        {/* per-rep leaderboard */}
        <Card className="mt-3">
          <div className="border-b border-n200 px-4 py-3"><p className="text-[13px] font-semibold text-n900">Salesperson performance</p></div>
          {reps.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12.5px] text-n400">Invite your team and assign leads to see per-person performance.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-n50/60 text-[11px] font-bold uppercase tracking-wide text-n500"><tr>
                  <th className="px-4 py-2.5">Salesperson</th><th className="px-2 text-right">Assigned</th><th className="px-2 text-right">Appts</th><th className="px-2 text-right">Sold</th><th className="px-4 py-2.5 text-right">Close rate</th>
                </tr></thead>
                <tbody>
                  {reps.map((r) => (
                    <tr key={r.id} className="border-t border-n100">
                      <td className="px-4 py-2.5 font-medium text-n900">{r.name}</td>
                      <td className="tnum px-2 text-right text-n700">{r.assigned}</td>
                      <td className="tnum px-2 text-right text-n700">{r.appts}</td>
                      <td className="tnum px-2 text-right font-semibold text-n900">{r.sold}</td>
                      <td className="tnum px-4 py-2.5 text-right text-n700">{r.closeRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </AppMain>
    </>
  );
}
