"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { useApi } from "@/lib/useApi";
import { Camera, Pencil } from "lucide-react";

type V = {
  id: string; year: number; make: string; model: string; trim: string; body: string; stock: string; vin: string;
  price: number; cost: number; mileage: number; status: string; color: string; drivetrain: string; fuel: string;
  engine: string; transmission: string; interior: string; days: number; photos: string[]; photoCount: number; vdpViews: number;
  marketLow: number | null; marketAvg: number | null; marketHigh: number | null;
};

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const STATUS_LABEL: Record<string, string> = { AVAILABLE: "Available", RECON: "In recon", RESERVED: "Reserved", WHOLESALE: "Wholesale", SOLD: "Sold" };
const STATUS_BG: Record<string, string> = { AVAILABLE: "bg-ok text-white", RECON: "bg-warn text-white", RESERVED: "bg-brand text-white", WHOLESALE: "bg-n700 text-white", SOLD: "bg-n700 text-white" };

export function VehicleDetailClient({ id }: { id: string }) {
  const { data: v, loading, error } = useApi<V>(`/inventory/${id}`);

  if (loading) return <><Topbar crumbs={[{ label: "Inventory", href: "/dashboard/inventory" }, { label: "Vehicle" }]} /><div className="p-12 text-center text-[13px] text-n400">Loading…</div></>;
  if (error || !v) return <><Topbar crumbs={[{ label: "Inventory", href: "/dashboard/inventory" }, { label: "Not found" }]} /><div className="p-16 text-center"><p className="text-[14px] font-semibold text-n800">Vehicle not found</p><Link href="/dashboard/inventory" className="mt-3 inline-block text-[13px] font-semibold text-brand">← Back to inventory</Link></div></>;

  const gross = v.price - v.cost;
  const specs: [string, string][] = [
    ["Mileage", `${v.mileage.toLocaleString()} mi`], ["Engine", v.engine || "—"], ["Transmission", v.transmission || "—"],
    ["Drivetrain", v.drivetrain || "—"], ["Fuel", v.fuel || "—"], ["Exterior", v.color || "—"],
    ["Interior", v.interior || "—"], ["Body style", v.body || "—"], ["VIN", v.vin],
  ];

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: "Inventory", href: "/dashboard/inventory" }, { label: `${v.year} ${v.make} ${v.model}` }]} />
      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-n200 bg-white sh-card">
            <div className="relative aspect-[16/9] w-full bg-n100">
              {v.photos[0]
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={v.photos[0]} alt="" className="h-full w-full object-cover" />
                : <div className="grid h-full place-items-center bg-warn-soft/40 text-center"><div><Camera className="mx-auto h-8 w-8 text-warn" /><p className="mt-2 text-[13px] font-semibold text-warn">No photos yet</p><p className="text-[12px] text-n500">Add photos to publish this unit</p></div></div>}
              <span className={cn("absolute left-4 top-4 rounded-md px-2.5 py-1 text-[12px] font-semibold", STATUS_BG[v.status])}>{STATUS_LABEL[v.status]}</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3 p-5">
              <div>
                <h1 className="text-[22px] font-bold tracking-[-0.02em] text-n900">{v.year} {v.make} {v.model}</h1>
                <p className="text-[13px] text-n500">{v.trim || "—"} · {v.body || "—"} · <span className="tnum">{v.stock}</span> · <span className="tnum">{v.vin}</span></p>
              </div>
              <p className="tnum text-[28px] font-bold text-n900">{money(v.price)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h3 className="text-[14px] font-semibold text-n900">Specifications</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {specs.map(([k, val]) => <div key={k}><p className="text-[11px] uppercase tracking-wide text-n500">{k}</p><p className="tnum mt-0.5 text-[13px] font-medium text-n900">{val}</p></div>)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["Days on lot", String(v.days)], ["Photos", String(v.photoCount)], ["VDP views", String(v.vdpViews)]].map(([l, val]) => (
                <div key={l}><p className="tnum text-[20px] font-bold text-n900">{val}</p><p className="mt-0.5 text-[10.5px] uppercase tracking-wide text-n500">{l}</p></div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h3 className="text-[13px] font-semibold text-n900">Cost &amp; gross</h3>
            <div className="mt-3 space-y-2 text-[12.5px]">
              {[["Cost", money(v.cost)], ["Internet price", money(v.price)]].map(([k, val]) => <div key={k} className="flex justify-between"><span className="text-n500">{k}</span><span className="tnum font-medium text-n900">{val}</span></div>)}
              <div className="flex justify-between border-t border-n100 pt-2"><span className="font-semibold text-n900">Front gross</span><span className={cn("tnum font-bold", gross >= 0 ? "text-ok" : "text-err")}>{money(gross)}</span></div>
            </div>
          </div>

          <Link href={`/dashboard/inventory/${v.id}/edit`} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-n200 bg-white text-[13px] font-semibold text-n700 transition hover:bg-n50"><Pencil className="h-4 w-4" />Edit vehicle</Link>
        </div>
      </div>
    </div>
  );
}
