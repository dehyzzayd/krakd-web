import { VehicleDetailClient } from "@/components/app/VehicleDetailClient";

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VehicleDetailClient id={id} />;
}
