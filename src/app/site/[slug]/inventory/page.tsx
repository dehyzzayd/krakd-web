import { notFound } from "next/navigation";
import { getSite, getSiteVehicles } from "@/lib/server/site";
import { InventoryBrowser } from "@/components/site/InventoryBrowser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InventoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const vehicles = await getSiteVehicles(slug);
  const sp = await searchParams;
  // pass every scalar query param through — the vertical's facet keys drive what the browser reads
  const initial: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") initial[k] = v;
  return <InventoryBrowser config={config} vehicles={vehicles} initial={initial} />;
}
