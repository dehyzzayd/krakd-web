import { notFound } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, CardHead, Badge, Dot } from "@/components/app/AppKit";
import {
  CAMPAIGNS, NETWORKS, money, OBJECTIVE_LABEL, DELIVERY_LABEL, DELIVERY_TONE,
} from "@/lib/marketing";

export function generateStaticParams() {
  return CAMPAIGNS.map((c) => ({ id: c.id }));
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

const AGE = [["25–34", 0.34], ["35–44", 0.31], ["45–54", 0.22], ["55+", 0.13]] as const;
const DEVICE = [["Mobile", 0.78], ["Desktop", 0.18], ["Tablet", 0.04]] as const;

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = CAMPAIGNS.find((x) => x.id === id);
  if (!c) notFound();
  const n = NETWORKS.find((x) => x.id === c.network)!;
  const learn = c.adsets.find((a) => a.learning)?.learning;

  const KPIS = [
    ["Spend", money(c.spend)], ["Impressions", fmt(c.impressions)], ["Reach", fmt(c.reach)],
    ["CTR", `${c.ctr.toFixed(1)}%`], ["CPC", `$${c.cpc.toFixed(2)}`], ["VDP views", fmt(c.vdpViews)],
    ["CPL", money(c.cpl)], ["Sold", String(c.sold)], ["Cost/sold", money(c.costPerSold)], ["ROI", `${c.roas.toFixed(1)}×`],
  ];

  const Breakdown = ({ title, rows }: { title: string; rows: readonly (readonly [string, number])[] }) => (
    <Card>
      <CardHead title={title} />
      <table className="w-full text-left">
        <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
          <th className="px-4 py-2 font-medium">Segment</th><th className="px-3 py-2 text-right font-medium">Spend</th>
          <th className="px-3 py-2 text-right font-medium">Leads</th><th className="px-4 py-2 text-right font-medium">CPL</th>
        </tr></thead>
        <tbody>
          {rows.map(([label, p]) => {
            const spend = c.spend * p, leads = Math.round(c.leads * p);
            return (
              <tr key={label} className="border-t border-n200">
                <td className="px-4 py-2 text-[13px] text-n800">{label}</td>
                <td className="tnum px-3 py-2 text-right text-[13px] text-n700">{money(spend)}</td>
                <td className="tnum px-3 py-2 text-right text-[13px] text-n800">{leads}</td>
                <td className="tnum px-4 py-2 text-right text-[13px] text-n700">{leads ? money(spend / leads) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );

  return (
    <>
      <Topbar title={c.name} action={{ label: "Edit campaign", href: "/dashboard/marketing/campaigns" }} />
      <AppMain>
        <a href="/dashboard/marketing/campaigns" className="text-[12.5px] font-medium text-brand hover:text-brand-hover">← All campaigns</a>

        {/* meta */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white sh-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.logo} alt={n.name} className="h-5 w-5" />
          </span>
          <div className="mr-auto">
            <h2 className="text-[17px] font-semibold text-n900">{c.name}</h2>
            <p className="text-[12.5px] text-n500">{n.name} · {OBJECTIVE_LABEL[c.objective]} objective</p>
          </div>
          <Badge tone={DELIVERY_TONE[c.delivery]}><Dot tone={DELIVERY_TONE[c.delivery]} />{DELIVERY_LABEL[c.delivery]}</Badge>
        </div>

        {/* KPIs */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {KPIS.map(([l, v]) => (
            <Card key={l} className="p-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p>
              <p className="tnum mt-1.5 text-[19px] font-semibold leading-none text-n900">{v}</p>
            </Card>
          ))}
        </div>

        {/* delivery / learning + pacing */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHead title="Delivery" right={<Badge tone={DELIVERY_TONE[c.delivery]}>{DELIVERY_LABEL[c.delivery]}</Badge>} />
            <div className="p-4">
              {c.delivery === "learning" && learn && (
                <>
                  <p className="text-[13px] text-n700">In the <span className="font-semibold text-n900">learning phase</span> — the platform needs ~50 conversions in 7 days to stabilize delivery.</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-n100"><span className="block h-full bg-brand" style={{ width: `${(learn.events / learn.threshold) * 100}%` }} /></span>
                    <span className="tnum text-[12.5px] font-semibold text-n900">{learn.events}/{learn.threshold}</span>
                  </div>
                  <p className="mt-3 text-[12px] text-n500">Avoid edits — significant changes reset learning.</p>
                </>
              )}
              {c.delivery === "learning_limited" && (
                <>
                  <p className="text-[13px] text-n700"><span className="font-semibold text-warn">Learning limited</span> — this ad set can&apos;t gather ~50 conversions/week at the current budget and audience, so delivery stays unstable.</p>
                  <p className="mt-2 text-[12.5px] text-n600">Fix: broaden the audience, raise the budget, consolidate ad sets, or optimize for a higher-volume event (e.g. VDP views instead of sold).</p>
                </>
              )}
              {c.delivery === "active" && <p className="text-[13px] text-n700">Delivering normally and out of the learning phase. Spend is pacing to budget.</p>}
            </div>
          </Card>

          <Card>
            <CardHead title="Pacing" />
            <div className="p-4">
              <div className="flex items-baseline gap-1.5"><span className="tnum text-[22px] font-semibold text-n900">{money(c.spend)}</span><span className="text-[12.5px] text-n500">of {money(c.budget)}/mo</span></div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-n100"><span className="block h-full bg-brand" style={{ width: `${Math.min(100, c.pacePct)}%` }} /></div>
              <p className="tnum mt-1.5 text-[11.5px] text-n400">{c.pacePct.toFixed(0)}% of expected pace</p>
            </div>
          </Card>
        </div>

        {/* ad sets */}
        <Card className="mt-3">
          <CardHead title="Ad sets" right={<span className="text-[12px] text-n500">{c.adsets.length} in this campaign</span>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead><tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                <th className="px-4 py-2 font-medium">Ad set</th><th className="px-3 py-2 font-medium">Audience</th>
                <th className="px-3 py-2 font-medium">Placements</th><th className="px-3 py-2 font-medium">Delivery</th>
                <th className="px-3 py-2 text-right font-medium">Spend</th><th className="px-3 py-2 text-right font-medium">Leads</th><th className="px-4 py-2 text-right font-medium">Sold</th>
              </tr></thead>
              <tbody>
                {c.adsets.map((a) => (
                  <tr key={a.name} className="border-t border-n200">
                    <td className="px-4 py-2.5 text-[13px] font-medium text-n900">{a.name}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-n600">{a.audience}</td>
                    <td className="px-3 py-2.5 text-[12.5px] text-n600">{a.placements}</td>
                    <td className="px-3 py-2.5"><Badge tone={DELIVERY_TONE[a.delivery]}><Dot tone={DELIVERY_TONE[a.delivery]} />{DELIVERY_LABEL[a.delivery]}</Badge></td>
                    <td className="tnum px-3 py-2.5 text-right text-[13px] text-n700">{money(a.spend)}</td>
                    <td className="tnum px-3 py-2.5 text-right text-[13px] text-n800">{a.leads}</td>
                    <td className="tnum px-4 py-2.5 text-right text-[13px] text-n800">{a.sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* breakdowns */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Breakdown title="By age" rows={AGE} />
          <Breakdown title="By device" rows={DEVICE} />
        </div>
      </AppMain>
    </>
  );
}
