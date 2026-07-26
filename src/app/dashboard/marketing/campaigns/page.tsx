import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { Megaphone } from "lucide-react";

export default function CampaignsPage() {
  return (
    <>
      <Topbar title="Campaigns" action={{ label: "New campaign" }} />
      <AppMain>
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["Active campaigns", "0"], ["Spend · MTD", "$0"], ["Leads · MTD", "0"], ["Blended ROAS", "—"]].map(([l, v]) => (
            <Card key={l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{v}</p></Card>
          ))}
        </div>
        <Card>
          <div className="px-4 py-16 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Megaphone className="h-6 w-6" /></span>
            <p className="text-[15px] font-semibold text-n900">No campaigns yet</p>
            <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-relaxed text-n500">Launch your first campaign — choose an objective, promote inventory, set a budget. Krakd deducts a flat 10% and puts 90% into real media spend, then matches every sale back to the ad.</p>
            <a href="/dashboard/marketing" className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Connect a network to start</a>
          </div>
        </Card>
      </AppMain>
    </>
  );
}
