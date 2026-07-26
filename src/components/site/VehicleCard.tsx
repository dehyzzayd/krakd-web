"use client";

import Link from "next/link";
import type { SiteVehicle } from "@/lib/server/site";
import { LeadModalButton } from "./LeadForm";

export function VehicleCard({ slug, accent, v, preview }: { slug: string; accent: string; v: SiteVehicle; preview?: boolean }) {
  const href = `/site/${slug}/inventory/${v.id}`;
  const specs = [v.mileage ? `${v.mileage.toLocaleString()} mi` : "", v.drivetrain, v.fuel].filter(Boolean).join(" · ");
  return (
    <div className="group overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm transition hover:shadow-md">
      <Link href={preview ? "#" : href} className="block aspect-[4/3] overflow-hidden bg-[#e8edf3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {v.image ? <img src={v.image} alt={`${v.year} ${v.make} ${v.model}`} className="h-full w-full object-cover transition group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-[13px] text-[#94a3b8]">Photos coming soon</div>}
      </Link>
      <div className="p-4">
        <Link href={preview ? "#" : href} className="block">
          <p className="truncate text-[15px] font-semibold">{v.year} {v.make} {v.model}</p>
          <p className="truncate text-[12.5px] text-[#64748b]">{[v.trim, specs].filter(Boolean).join(" · ") || " "}</p>
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[18px] font-bold" style={{ color: accent }}>{v.price ? `$${v.price.toLocaleString()}` : "Call"}</span>
          <LeadModalButton slug={slug} accent={accent} vehicle={v} preview={preview} className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white">Check availability</LeadModalButton>
        </div>
      </div>
    </div>
  );
}
