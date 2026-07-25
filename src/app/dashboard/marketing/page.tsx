import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, CardHead, Badge, Dot, type Tone } from "@/components/app/AppKit";
import {
  NETWORKS, connectedNetworks, disconnectedNetworks, networkMetrics, aggregate,
  funnel, attribution, campaignsFor, money, DELIVERY_TONE, DELIVERY_LABEL,
} from "@/lib/marketing";

const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
const fmtCost = (n: number) => (n < 10 ? `$${n.toFixed(2)}` : money(n));

function Funnel() {
  const f = funnel();
  const top = f[0].value;
  return (
    <div className="space-y-1.5 p-4">
      {f.map((s, i) => {
        const w = top > 1 ? Math.max(8, (Math.log(Math.max(s.value, 1)) / Math.log(top)) * 100) : 100;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-[12.5px] text-n600">{s.key}</div>
            <div className="h-7 flex-1 overflow-hidden rounded bg-n100">
              <div className="flex h-full items-center rounded bg-brand/85 px-2" style={{ width: `${w}%` }}>
                <span className="tnum text-[11.5px] font-semibold text-white">{fmt(s.value)}</span>
              </div>
            </div>
            <div className="tnum w-[120px] shrink-0 text-right text-[11.5px] text-n500">
              {s.rate != null && (i <= 1 ? <>{s.rate < 1 ? s.rate.toFixed(2) : s.rate.toFixed(1)}%</> : <>{s.rate.toFixed(0)}% · {fmtCost(s.costEach)}</>)}
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-[11.5px] text-n500">Conversion and cost-per-step across all connected networks, this month.</p>
    </div>
  );
}

export default function MarketingOverview() {
  const agg = aggregate();
  const attr = attribution();
  const projected = agg.spend / 0.8;
  const paceLabel = projected > agg.budget * 1.05 ? "Over pace" : projected < agg.budget * 0.9 ? "Under pace" : "On track";
  const paceTone: Tone = paceLabel === "On track" ? "ok" : paceLabel === "Over pace" ? "warn" : "neutral";
  const topCampaigns = connectedNetworks().flatMap((n) => campaignsFor(n.id)).sort((a, b) => b.roas - a.roas).slice(0, 5);
  const missing = disconnectedNetworks();

  const KPIS = [
    { label: "Ad spend · MTD", value: money(agg.spend) },
    { label: "Units sold · attributed", value: String(attr.matched) },
    { label: "Cost per sold", value: money(agg.costPerSold) },
    { label: "Marketing ROI", value: `${attr.roi.toFixed(1)}×` },
  ];

  return (
    <>
      <Topbar title="Digital Marketing" action={{ label: "New campaign", href: "/dashboard/marketing/campaigns" }} />
      <AppMain>
        <p className="mb-5 text-[13.5px] text-n600">
          {connectedNetworks().length} networks live · <span className="font-semibold text-n900">{attr.matched} cars</span> sold from ads this month at <span className="font-semibold text-n900">{money(agg.costPerSold)}</span> each.
        </p>

        {/* channels */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NETWORKS.map((n) => {
            const m = networkMetrics(n.id);
            return (
              <Card key={n.id} className="p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-n100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.logo} alt={n.name} className={`h-5 w-5 ${!n.connected && "opacity-40 grayscale"}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-n900">{n.name}</span>
                    {n.connected ? <span className="flex items-center gap-1.5 text-[11.5px] text-ok"><Dot tone="ok" />Connected</span> : <span className="text-[11.5px] text-n500">Not connected</span>}
                  </span>
                </div>
                {n.connected ? (
                  <p className="mt-3 text-[12px] text-n500"><span className="tnum font-semibold text-n800">{m.sold}</span> sold · {money(m.spend)} spent</p>
                ) : (
                  <a href={`/dashboard/marketing/${n.id}`} className="mt-3 grid h-8 w-full place-items-center rounded-lg bg-brand text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">Connect</a>
                )}
              </Card>
            );
          })}
        </div>

        {/* headline KPIs — the numbers a dealer principal judges */}
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Card key={k.label} className="p-4">
              <p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-n500">{k.label}</p>
              <p className="tnum mt-2 text-[26px] font-semibold leading-none text-n900">{k.value}</p>
            </Card>
          ))}
        </div>

        {/* funnel + pacing */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Shopper funnel" right={<span className="text-[12px] text-n500">impression → sold</span>} />
            <Funnel />
          </Card>

          <Card>
            <CardHead title="Budget pacing" right={<Badge tone={paceTone}>{paceLabel}</Badge>} />
            <div className="p-4">
              <div className="flex items-baseline gap-1.5">
                <span className="tnum text-[24px] font-semibold text-n900">{money(agg.spend)}</span>
                <span className="text-[13px] text-n500">of {money(agg.budget)}</span>
              </div>
              <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-n100">
                <span className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${Math.min(100, (agg.spend / agg.budget) * 100)}%` }} />
                <span className="absolute inset-y-0 w-px bg-n900/50" style={{ left: "80%" }} title="Expected pace" />
              </div>
              <div className="tnum mt-1.5 flex justify-between text-[11px] text-n400"><span>Day 25 of 31</span><span>projected {money(projected)}</span></div>
              <p className="mt-3 rounded-lg bg-n100 px-3 py-2 text-[11.5px] leading-snug text-n600">
                At today&apos;s rate you&apos;ll finish the month at <span className="font-semibold text-n800">{money(projected)}</span> — {paceLabel.toLowerCase()} vs the {money(agg.budget)} plan.
              </p>
            </div>
          </Card>
        </div>

        {/* channel comparison + attribution */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Channel performance" right={<span className="text-[12px] text-n500">cost per sold car by source</span>} />
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                  <th className="px-4 py-2 font-medium">Network</th>
                  <th className="px-3 py-2 text-right font-medium">Spend</th>
                  <th className="px-3 py-2 text-right font-medium">VDP views</th>
                  <th className="px-3 py-2 text-right font-medium">Leads</th>
                  <th className="px-3 py-2 text-right font-medium">CPL</th>
                  <th className="px-3 py-2 text-right font-medium">Sold</th>
                  <th className="px-3 py-2 text-right font-medium">Cost/sold</th>
                  <th className="px-4 py-2 text-right font-medium">ROI</th>
                </tr></thead>
                <tbody>
                  {connectedNetworks().map((n) => {
                    const m = networkMetrics(n.id);
                    return (
                      <tr key={n.id} className="border-t border-n200 transition hover:bg-n50">
                        <td className="px-4 py-2.5"><a href={`/dashboard/marketing/${n.id}`} className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={n.logo} alt={n.name} className="h-4 w-4" /><span className="text-[13px] font-medium text-n900">{n.name}</span>
                        </a></td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(m.spend)}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{fmt(m.vdpViews)}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n800">{m.leads}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(m.cpl)}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n800">{m.sold}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(m.costPerSold)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-[13px] font-semibold text-n900">{m.roas.toFixed(1)}×</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* matchback */}
          <Card>
            <CardHead title="Sales matchback" />
            <div className="p-4">
              <p className="text-[12.5px] text-n600">Ad-attributed deliveries</p>
              <p className="tnum mt-1 text-[26px] font-semibold leading-none text-n900">{attr.matched} <span className="text-[15px] font-medium text-n500">of {attr.storeSold}</span></p>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-n100">
                <span className="bg-brand" style={{ width: `${attr.matchedRate}%` }} />
              </div>
              <div className="mt-4 space-y-2 text-[12.5px]">
                <div className="flex justify-between"><span className="text-n600">Cost per sold car</span><span className="tnum font-semibold text-n900">{money(attr.costPerSold)}</span></div>
                <div className="flex justify-between"><span className="text-n600">Gross from matched sales</span><span className="tnum font-semibold text-n900">{money(attr.gross)}</span></div>
                <div className="flex justify-between"><span className="text-n600">Return on spend</span><span className="tnum font-semibold text-ok">{attr.roi.toFixed(1)}× </span></div>
              </div>
              <p className="mt-3 rounded-lg bg-n100 px-3 py-2 text-[11.5px] leading-snug text-n600">
                {attr.unmatched} deliveries aren&apos;t yet matched to a touchpoint — walk-ins and untracked sources. Matchback runs nightly against the DMS.
              </p>
            </div>
          </Card>
        </div>

        {/* top campaigns + connect more */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Top campaigns" right={<a href="/dashboard/marketing/campaigns" className="text-[12.5px] font-medium text-brand hover:text-brand-hover">All campaigns</a>} />
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                  <th className="px-4 py-2 font-medium">Campaign</th><th className="px-3 py-2 font-medium">Delivery</th>
                  <th className="px-3 py-2 text-right font-medium">Spent</th><th className="px-3 py-2 text-right font-medium">Sold</th>
                  <th className="px-3 py-2 text-right font-medium">Cost/sold</th><th className="px-4 py-2 text-right font-medium">ROI</th>
                </tr></thead>
                <tbody>
                  {topCampaigns.map((c) => {
                    const n = NETWORKS.find((x) => x.id === c.network)!;
                    return (
                      <tr key={c.id} className="border-t border-n200 transition hover:bg-n50">
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={n.logo} alt="" className="h-4 w-4 shrink-0" /><span className="text-[13px] font-medium text-n900">{c.name}</span>
                        </div></td>
                        <td className="px-3 py-2.5"><Badge tone={DELIVERY_TONE[c.delivery]}><Dot tone={DELIVERY_TONE[c.delivery]} />{DELIVERY_LABEL[c.delivery]}</Badge></td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(c.spend)}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n800">{c.sold}</td>
                        <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(c.costPerSold)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-[13px] font-semibold text-n900">{c.roas.toFixed(1)}×</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHead title="Reach further" />
            <div className="p-4">
              {missing.length === 0 ? <p className="text-[13px] text-n600">Every network is connected.</p> : (
                <>
                  <p className="text-[13px] text-n600">You&apos;re not on {missing.map((m) => m.name).join(" or ")} yet.</p>
                  <div className="mt-3 space-y-2">
                    {missing.map((m) => (
                      <a key={m.id} href={`/dashboard/marketing/${m.id}`} className="flex items-center gap-2.5 rounded-lg border border-n200 p-2.5 transition hover:bg-n50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.logo} alt={m.name} className="h-5 w-5 opacity-40 grayscale" />
                        <span className="flex-1 text-[13px] font-medium text-n900">{m.name}</span>
                        <span className="text-[12px] font-semibold text-brand">Connect</span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </AppMain>
    </>
  );
}
