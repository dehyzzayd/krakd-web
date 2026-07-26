import { notFound } from "next/navigation";
import { getSite, getSiteVehicle } from "@/lib/server/site";
import { VehicleDetailView } from "@/components/site/VehicleDetailView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const v = await getSiteVehicle(slug, id);
  return v ? { title: `${v.year} ${v.make} ${v.model}` } : { title: "Vehicle not found" };
}

export default async function VehiclePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const config = await getSite(slug);
  if (!config) notFound();
  const vehicle = await getSiteVehicle(slug, id);
  if (!vehicle) notFound();
  return <VehicleDetailView config={config} vehicle={vehicle} />;
}
