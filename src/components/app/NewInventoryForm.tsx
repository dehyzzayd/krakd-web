"use client";

import { useApi } from "@/lib/useApi";
import { VehicleForm } from "./VehicleForm";
import { ListingForm } from "./ListingForm";

/** New-listing entry point: automotive gets the VIN/vehicle form, other verticals the generic listing form. */
export function NewInventoryForm() {
  const { data, loading } = useApi<{ vertical?: string }>("/auth/me");
  if (loading) return <div className="app-scope grid min-h-dvh place-items-center bg-white text-[13px] text-n400">Loading…</div>;
  const vertical = data?.vertical ?? "AUTOMOTIVE";
  return vertical === "AUTOMOTIVE" ? <VehicleForm /> : <ListingForm vertical={vertical} />;
}
