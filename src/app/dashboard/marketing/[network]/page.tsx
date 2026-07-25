import { notFound } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, CardHead, Badge, Dot } from "@/components/app/AppKit";
import { BudgetCard } from "@/components/app/budget";
import { ConnectFlow } from "@/components/app/ConnectFlow";
import {
  NETWORKS, netById, networkMetrics, campaignsFor, money,
  OBJECTIVE_LABEL, DELIVERY_LABEL, DELIVERY_TONE,
} from "@/lib/marketing";

export function generateStaticParams() {
  return NETWORKS.map((n) => ({ network: n.id }));
}

const SPEND = [12, 18, 15, 22, 19, 26, 24, 30, 27, 33, 29, 36, 34, 40];
function MiniChart() {
  const max = Math.max(...SPEND);
  const W = 640, H = 140, stepX = W / (SPEND.length - 1);
  const pts = SPEND.map((v, i) => `${i * stepX},${H - (v / max) * (H - 12) - 6}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[140px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs><linearGradient id="nk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3c7cab" stopOpacity="0.18" /><stop offset="100%" stopColor="#3c7cab" stopOpacity="0" /></linearGradient></defs>
      {[0.33, 0.66].map((g) => <line key={g} x1="0" y1={H * g} x2={W} y2={H * g} stroke="#e4e4e4" strokeWidth="1" strokeDasharray="2 4" />)}
      <polyline fill="url(#nk)" stroke="none" points={`0,${H} ${pts} ${W},${H}`} />
      <polyline fill="none" stroke="#3c7cab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

export default async function NetworkPage({ params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const net = netById(network);
  if (!net) notFound();

  const m = networkMetrics(net.id);
  const cams = campaignsFor(net.id);

  return (
    <>
      <Topbar title={net.name} action={net.connected ? { label: "New campaign", href: "/dashboard/marketing/campaigns" } : undefined} />
      <AppMain>
        {!net.connected ? (
          <ConnectFlow network={{ id: net.id, name: net.name, logo: net.logo }} />
        ) : (
          <>
            {/* setup: connection + budget */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHead title="Connection" right={<Badge tone="ok"><Dot tone="ok" />Connected</Badge>} />
                <div className="flex items-center gap-3 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-n100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={net.logo} alt={net.name} className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-n900">Downtown Auto · {net.name} Ads</p>
                    <p className="tnum text-[12px] text-n500">Account ****{net.id === "google" ? "8842" : "2213"} · syncing leads</p>
                  </div>
                  <button className="h-8 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-medium text-n700 transition hover:bg-n100">Manage</button>
                </div>
              </Card>
              <BudgetCard networkName={net.name} initialBudget={m.budget} />
            </div>

            {/* KPIs */}
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Leads · MTD", value: String(m.leads) },
                { label: "Cost per lead", value: money(m.cpl) },
                { label: "Units sold", value: String(m.sold) },
                { label: "Cost per sold", value: money(m.costPerSold) },
              ].map((k) => (
                <Card key={k.label} className="p-4">
                  <p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-n500">{k.label}</p>
                  <p className="tnum mt-2 text-[26px] font-semibold leading-none text-n900">{k.value}</p>
                </Card>
              ))}
            </div>

            {/* chart */}
            <Card className="mt-3">
              <CardHead title="Leads generated" right={<span className="tnum text-[12px] text-n500">{m.leads} · last 14 days</span>} />
              <div className="p-4"><MiniChart /></div>
            </Card>

            {/* campaigns */}
            <Card className="mt-3">
              <CardHead title={`${net.name} campaigns`} right={<a href="/dashboard/marketing/campaigns" className="text-[12.5px] font-medium text-brand hover:text-brand-hover">All campaigns</a>} />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                    <th className="px-4 py-2 font-medium">Campaign</th><th className="px-3 py-2 font-medium">Delivery</th>
                    <th className="px-3 py-2 text-right font-medium">Spent</th><th className="px-3 py-2 text-right font-medium">Leads</th>
                    <th className="px-3 py-2 text-right font-medium">CPL</th><th className="px-3 py-2 text-right font-medium">Sold</th>
                    <th className="px-3 py-2 text-right font-medium">Cost/sold</th><th className="px-4 py-2 text-right font-medium">ROI</th>
                  </tr></thead>
                  <tbody>
                    {cams.map((c) => (
                      <tr key={c.id} className="border-t border-n200 transition hover:bg-n50">
                        <td className="px-4 py-2.5"><p className="text-[13px] font-medium text-n900">{c.name}</p><p className="text-[11.5px] text-n500">{OBJECTIVE_LABEL[c.objective]}</p></td>
                        <td className="px-3 py-2.5"><Badge tone={DELIVERY_TONE[c.delivery]}><Dot tone={DELIVERY_TONE[c.delivery]} />{DELIVERY_LABEL[c.delivery]}</Badge></td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(c.spend)}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n800">{c.leads}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(c.cpl)}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n800">{c.sold}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(c.costPerSold)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-[13px] font-semibold text-n900">{c.roas.toFixed(1)}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </AppMain>
    </>
  );
}
