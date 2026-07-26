import { notFound } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { NETWORKS, netById } from "@/lib/marketing";

export function generateStaticParams() {
  return NETWORKS.map((n) => ({ network: n.id }));
}

export default async function NetworkPage({ params }: { params: Promise<{ network: string }> }) {
  const { network } = await params;
  const n = netById(network);
  if (!n) notFound();

  return (
    <>
      <Topbar crumbs={[{ label: "Digital Marketing", href: "/dashboard/marketing" }, { label: n.name }]} />
      <AppMain>
        <Card className="mx-auto max-w-[560px] p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-n100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.logo} alt={n.name} className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-[18px] font-bold text-n900">Connect {n.name}</h2>
          <p className="mx-auto mt-2 max-w-[42ch] text-[13px] leading-relaxed text-n500">
            Link your {n.name} ad account so Krakd can launch and manage campaigns, sync your inventory, and match every sale back to the ad that drove it.
          </p>
          <button className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand px-5 text-[13px] font-semibold text-white transition hover:bg-brand-hover">Connect {n.name}</button>
          <p className="mt-3 text-[11.5px] text-n400">You&apos;ll authorize Krakd on {n.name} — takes about a minute.</p>
        </Card>
      </AppMain>
    </>
  );
}
