import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, Badge, Dot } from "@/components/app/AppKit";
import {
  CAMPAIGNS, NETWORKS, aggregate, money,
  OBJECTIVE_LABEL, DELIVERY_LABEL, DELIVERY_TONE,
} from "@/lib/marketing";

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export default function CampaignsPage() {
  const agg = aggregate();
  return (
    <>
      <Topbar title="Campaigns" action={{ label: "New campaign", href: "/dashboard/marketing/campaigns" }} />
      <AppMain>
        {/* summary */}
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { l: "Active spend", v: money(agg.spend) },
            { l: "Impressions", v: fmt(agg.impressions) },
            { l: "Leads", v: String(agg.leads) },
            { l: "Sold", v: String(agg.sold) },
            { l: "Cost / sold", v: money(agg.costPerSold) },
          ].map((k) => (
            <Card key={k.l} className="p-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{k.l}</p>
              <p className="tnum mt-1.5 text-[20px] font-semibold leading-none text-n900">{k.v}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.04em] text-n500">
                  <th className="px-4 py-2.5 font-medium">Campaign</th>
                  <th className="px-3 py-2.5 font-medium">Delivery</th>
                  <th className="px-3 py-2.5 font-medium">Budget · pace</th>
                  <th className="px-3 py-2.5 text-right font-medium">Impr.</th>
                  <th className="px-3 py-2.5 text-right font-medium">CTR</th>
                  <th className="px-3 py-2.5 text-right font-medium">CPC</th>
                  <th className="px-3 py-2.5 text-right font-medium">VDP</th>
                  <th className="px-3 py-2.5 text-right font-medium">CPL</th>
                  <th className="px-3 py-2.5 text-right font-medium">Sold</th>
                  <th className="px-3 py-2.5 text-right font-medium">Cost/sold</th>
                  <th className="px-4 py-2.5 text-right font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c) => {
                  const n = NETWORKS.find((x) => x.id === c.network)!;
                  const pace = Math.min(100, c.pacePct);
                  return (
                    <tr key={c.id} className="border-t border-n200 transition hover:bg-n50">
                      <td className="px-4 py-3">
                        <a href={`/dashboard/marketing/campaigns/${c.id}`} className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={n.logo} alt={n.name} className="h-4 w-4 shrink-0" />
                          <span>
                            <span className="block text-[13px] font-medium text-n900">{c.name}</span>
                            <span className="block text-[11.5px] text-n500">{OBJECTIVE_LABEL[c.objective]}</span>
                          </span>
                        </a>
                      </td>
                      <td className="px-3 py-3"><Badge tone={DELIVERY_TONE[c.delivery]}><Dot tone={DELIVERY_TONE[c.delivery]} />{DELIVERY_LABEL[c.delivery]}</Badge></td>
                      <td className="px-3 py-3">
                        <span className="tnum text-[12.5px] text-n700">{money(c.spend)} / {money(c.budget)}</span>
                        <span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-n100"><span className="block h-full bg-brand" style={{ width: `${pace}%` }} /></span>
                      </td>
                      <td className="tnum px-3 py-3 text-right text-[13px] text-n700">{fmt(c.impressions)}</td>
                      <td className="tnum px-3 py-3 text-right text-[13px] text-n700">{c.ctr.toFixed(1)}%</td>
                      <td className="tnum px-3 py-3 text-right text-[13px] text-n700">${c.cpc.toFixed(2)}</td>
                      <td className="tnum px-3 py-3 text-right text-[13px] text-n700">{fmt(c.vdpViews)}</td>
                      <td className="tnum px-3 py-3 text-right text-[13px] text-n700">{money(c.cpl)}</td>
                      <td className="tnum px-3 py-3 text-right text-[13px] text-n800">{c.sold}</td>
                      <td className="tnum px-3 py-3 text-right text-[13px] text-n700">{money(c.costPerSold)}</td>
                      <td className="tnum px-4 py-3 text-right text-[13px] font-semibold text-n900">{c.roas.toFixed(1)}×</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </AppMain>
    </>
  );
}
