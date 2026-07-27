"use client";

import { VehicleForm } from "@/components/app/VehicleForm";
import { useApi } from "@/lib/useApi";
import type { Vehicle } from "@/lib/inventory";

type ApiVehicle = { id: string; vin: string; year: number; make: string; model: string; trim: string; body: string; mileage: number; color: string; stock: string; status: string; cost: number; price: number; photoCount: number; photos?: string[] };

export function EditVehicleClient({ id }: { id: string }) {
  const { data, loading } = useApi<ApiVehicle>(`/inventory/${id}`);
  if (loading || !data) return <div className="app-scope grid min-h-dvh place-items-center bg-white text-[13px] text-n400">Loading…</div>;

  const vehicle = {
    id: data.id, vin: data.vin, year: data.year, make: data.make, model: data.model, trim: data.trim,
    body: data.body, mileage: data.mileage, color: data.color, stock: data.stock, status: data.status,
    cost: data.cost, price: data.price, photos: data.photoCount,
  } as unknown as Vehicle;

  return <VehicleForm vehicle={vehicle} initialPhotos={Array.isArray(data.photos) ? data.photos : []} />;
}
