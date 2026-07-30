"use client";

import type { ReactNode } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { useApi } from "@/lib/useApi";
import { vertical as verticalDef } from "@/components/site/verticals";

/* ── primitives ─────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-n200 bg-white sh-card ${className}`}>{children}</div>;
}
function CardHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-n200 px-4 py-3">
      <h2 className="text-[13.5px] font-semibold text-n900">{title}</h2>
      {right}
    </div>
  );
}
type Tone = "brand" | "ok" | "warn" | "err" | "neutral";
const TONES: Record<Tone, string> = { brand: "bg-brand-soft text-brand", ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", err: "bg-err-soft text-err", neutral: "bg-n100 text-n600" };
function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium ${TONES[tone]}`}>{children}</span>;
}
function Dot({ tone }: { tone: Tone }) {
  const c = { brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", err: "bg-err", neutral: "bg-n400" }[tone];
  return <span className={`h-1.5 w-1.5 rounded-full ${c}`} />;
}
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

/* ── data shape ─────────────────────────────────────────────────────── */

type Overview = {
  dealershipName: string;
  vertical?: string;
  kpis: { grossCents: number; unitsSold: number; activeLeads: number; apptsToday: number };
  recentLeads: { name: string; source: string; vehicle: string; status: string; tone: Tone; owner: string; time: string }[];
  inventory: { units: number; avgDays: number; aging: { label: string; n: number; tone: Tone }[] };
};

const AGE_BAR = { brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", err: "bg-err", neutral: "bg-n400" } as const;

function Empty({ title, sub, cta }: { title: string; sub: string; cta?: ReactNode }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-[13.5px] font-semibold text-n800">{title}</p>
      <p className="mx-auto mt-1 max-w-[38ch] text-[12.5px] text-n500">{sub}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { data, loading } = useApi<Overview>("/overview");

  const name = data?.dealershipName ?? "your business";
  const def = verticalDef(data?.vertical);
  const k = data?.kpis;
  const kpis = [
    { label: "Gross · MTD", value: k ? money(k.grossCents) : "—" },
    { label: "Closed · MTD", value: k ? String(k.unitsSold) : "—" },
    { label: "Active leads", value: k ? String(k.activeLeads) : "—" },
    { label: "Appts today", value: k ? String(k.apptsToday) : "—" },
  ];
  const leads = data?.recentLeads ?? [];
  const inv = data?.inventory;
  const invTotal = inv?.units ?? 0;

  return (
    <>
      <Topbar title="Overview" action={{ label: `Add ${def.noun}`, href: "/dashboard/inventory/new" }} />
      <AppMain>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-n600">Here&apos;s how <span className="font-semibold text-n900">{name}</span> is doing today.</p>
          <div className="flex items-center gap-2">
            {["Today", "7d", "30d"].map((r, i) => (
              <button key={r} className={`h-8 rounded-lg px-3 text-[12.5px] font-medium transition ${i === 2 ? "border border-n200 bg-white text-n900 sh-card" : "text-n600 hover:bg-n100"}`}>{r}</button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kp) => (
            <Card key={kp.label} className="p-4">
              <p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-n500">{kp.label}</p>
              <span className={`tnum mt-2 block text-[26px] font-semibold leading-none text-n900 ${loading ? "animate-pulse text-n300" : ""}`}>{loading ? "—" : kp.value}</span>
            </Card>
          ))}
        </div>

        {/* gross + AI */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Gross revenue" right={<span className="tnum text-[12px] font-semibold text-n900">{k ? money(k.grossCents) : "—"}</span>} />
            {k && k.unitsSold > 0
              ? <div className="p-4"><p className="tnum text-[30px] font-semibold text-n900">{money(k.grossCents)}</p><p className="mt-1 text-[12.5px] text-n500">{k.unitsSold} closed this month</p></div>
              : <Empty title="No sales logged yet" sub={`Mark a ${def.noun} sold and your revenue will chart here.`} />}
          </Card>

          <Card>
            <CardHead title="Krakd AI · pipeline" right={<Badge tone="ok"><Dot tone="ok" />Ready</Badge>} />
            <div className="p-4">
              <p className="text-[13px] leading-relaxed text-n700">Krakd AI is live and will start working leads the moment they come in — texting, qualifying and booking automatically.</p>
              <a href="/dashboard/krakd-ai" className="mt-3 inline-block text-[12.5px] font-semibold text-brand hover:text-brand-hover">Configure the agent →</a>
            </div>
          </Card>
        </div>

        {/* leads + aging */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Recent leads" right={<a href="/dashboard/leads" className="text-[12.5px] font-medium text-brand hover:text-brand-hover">View all</a>} />
            {leads.length === 0
              ? <Empty title="No leads yet" sub="Launch a campaign or add a lead — Krakd AI will start following up automatically." />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                      <th className="px-4 py-2 font-medium">Customer</th><th className="px-3 py-2 font-medium">Source</th><th className="px-3 py-2 font-medium">Interested in</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Owner</th><th className="px-4 py-2 text-right font-medium">Updated</th>
                    </tr></thead>
                    <tbody>
                      {leads.map((l, i) => (
                        <tr key={i} className="border-t border-n200 transition hover:bg-n50">
                          <td className="px-4 py-2.5 text-[13px] font-medium text-n900">{l.name}</td>
                          <td className="px-3 py-2.5 text-[13px] text-n600">{l.source}</td>
                          <td className="px-3 py-2.5 text-[13px] text-n700">{l.vehicle}</td>
                          <td className="px-3 py-2.5"><Badge tone={l.tone}><Dot tone={l.tone} />{l.status}</Badge></td>
                          <td className="px-3 py-2.5 text-[13px] text-n600">{l.owner}</td>
                          <td className="tnum px-4 py-2.5 text-right text-[12.5px] text-n400">{l.time} ago</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Card>

          <Card>
            <CardHead title={`${def.plural.charAt(0).toUpperCase() + def.plural.slice(1)} aging`} right={<span className="tnum text-[12px] text-n500">{invTotal} {def.dash.units} · {inv?.avgDays ?? 0}d avg</span>} />
            {invTotal === 0
              ? <Empty title={`No ${def.plural} yet`} sub={`Add your first ${def.noun} to get started.`} cta={<a href="/dashboard/inventory/new" className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Add a {def.noun}</a>} />
              : (
                <div className="p-4">
                  <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-n100">
                    {inv!.aging.map((a) => <span key={a.label} className={AGE_BAR[a.tone]} style={{ width: `${(a.n / invTotal) * 100}%` }} />)}
                  </div>
                  <div className="space-y-2.5">
                    {inv!.aging.map((a) => (
                      <div key={a.label} className="flex items-center gap-2.5">
                        <Dot tone={a.tone} /><span className="flex-1 text-[12.5px] text-n700">{a.label}</span>
                        <span className="tnum text-[12.5px] font-semibold text-n900">{a.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </Card>
        </div>
      </AppMain>
    </>
  );
}
