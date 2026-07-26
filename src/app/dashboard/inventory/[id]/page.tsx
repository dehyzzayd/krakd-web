import { notFound } from "next/navigation";
import { VEHICLES, vehicleById } from "@/lib/inventory";
import { VehicleDetail } from "@/components/app/VehicleDetail";

export function generateStaticParams() {
  return VEHICLES.map((v) => ({ id: v.id }));
}

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = vehicleById(id);
  if (!v) notFound();
  return <VehicleDetail v={v} />;
}
