import { notFound } from "next/navigation";
import { getSite, getSiteVehicles } from "@/lib/server/site";
import { SiteHome } from "@/components/site/SiteHome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getSite(slug);
  return c ? { title: c.dealershipName, description: c.headline } : { title: "Site not found" };
}

export default async function HomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const vehicles = await getSiteVehicles(slug);
  return <SiteHome config={config} vehicles={vehicles} />;
}
