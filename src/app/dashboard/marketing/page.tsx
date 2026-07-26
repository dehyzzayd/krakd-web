import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { NETWORKS } from "@/lib/marketing";
import { Megaphone } from "lucide-react";

/** New dealers have no ad accounts connected and no campaigns yet — real empty state.
 *  Metrics light up once networks are connected and campaigns run. */
export default function MarketingOverview() {
  const KPIS = [
    { label: "Ad spend · MTD", value: "$0" },
    { label: "Units sold · attributed", value: "0" },
    { label: "Cost per sold", value: "—" },
    { label: "Marketing ROI", value: "—" },
  ];

  return (
    <>
      <Topbar title="Digital Marketing" action={{ label: "New campaign", href: "/dashboard/marketing/campaigns" }} />
      <AppMain>
        <p className="mb-5 text-[13.5px] text-n600">Connect your ad accounts and launch your first campaign — Krakd manages the ads and reports cost per <span className="font-semibold text-n900">sold car</span>, not per click.</p>

        {/* connect your networks */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NETWORKS.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-n100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.logo} alt={n.name} className="h-5 w-5 opacity-40 grayscale" />
                </span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-n900">{n.name}</span><span className="text-[11.5px] text-n500">Not connected</span></span>
              </div>
              <a href={`/dashboard/marketing/${n.id}`} className="mt-3 grid h-8 w-full place-items-center rounded-lg bg-brand text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">Connect</a>
            </Card>
          ))}
        </div>

        {/* zeroed KPIs */}
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Card key={k.label} className="p-4"><p className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-n500">{k.label}</p><p className="tnum mt-2 text-[26px] font-semibold leading-none text-n900">{k.value}</p></Card>
          ))}
        </div>

        <Card className="mt-3">
          <div className="px-4 py-16 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Megaphone className="h-6 w-6" /></span>
            <p className="text-[15px] font-semibold text-n900">No campaigns yet</p>
            <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-relaxed text-n500">Launch a campaign — pick an objective, promote your inventory, set a budget. Krakd deducts a flat 10% and puts 90% into real media spend, then matches every sale back to the ad that drove it.</p>
            <a href="/dashboard/marketing/campaigns" className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Launch a campaign</a>
          </div>
        </Card>
      </AppMain>
    </>
  );
}
