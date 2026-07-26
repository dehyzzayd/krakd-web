import { notFound } from "next/navigation";
import { VEHICLES, vehicleById } from "@/lib/inventory";
import { VehicleForm } from "@/components/app/VehicleForm";

export function generateStaticParams() {
  return VEHICLES.map((v) => ({ id: v.id }));
}

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = vehicleById(id);
  if (!v) notFound();
  return <VehicleForm vehicle={v} />;
}
