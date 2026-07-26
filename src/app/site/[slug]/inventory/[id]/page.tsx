import { notFound } from "next/navigation";
import { getSite, getSiteVehicle, getSiteVehicles } from "@/lib/server/site";
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
  const all = await getSiteVehicles(slug);
  const similar = all.filter((v) => v.id !== vehicle.id && (v.body === vehicle.body || v.make === vehicle.make)).slice(0, 4);
  return <VehicleDetailView config={config} vehicle={vehicle} similar={similar} />;
}
