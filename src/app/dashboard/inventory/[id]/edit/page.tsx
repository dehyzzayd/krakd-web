import { EditVehicleClient } from "@/components/app/EditVehicleClient";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditVehicleClient id={id} />;
}
