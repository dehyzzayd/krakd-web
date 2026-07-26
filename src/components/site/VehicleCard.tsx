"use client";

import Link from "next/link";
import type { SiteVehicle } from "@/lib/server/site";
import { LeadModalButton } from "./LeadForm";

type Variant = "soft" | "flat" | "feature";

const SHELL: Record<Variant, string> = {
  soft: "rounded-2xl border border-black/8 shadow-sm hover:shadow-md",
  flat: "rounded-xl border border-black/10 hover:border-black/25",
  feature: "rounded-3xl border border-black/8 shadow-md hover:shadow-xl",
};
const PHOTO: Record<Variant, string> = { soft: "aspect-[4/3]", flat: "aspect-[4/3]", feature: "aspect-[3/2]" };

export function VehicleCard({ slug, accent, v, variant = "soft", preview }: {
  slug: string; accent: string; v: SiteVehicle; variant?: Variant; preview?: boolean;
}) {
  const href = `/site/${slug}/inventory/${v.id}`;
  const specs = [v.mileage ? `${v.mileage.toLocaleString()} mi` : "", v.drivetrain, v.fuel].filter(Boolean).join(" · ");
  const feature = variant === "feature";
  return (
    <div className={`group overflow-hidden bg-white transition ${SHELL[variant]}`}>
      <Link href={preview ? "#" : href} className={`block overflow-hidden bg-[#e8edf3] ${PHOTO[variant]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {v.image ? <img src={v.image} alt={`${v.year} ${v.make} ${v.model}`} className="h-full w-full object-cover transition group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-[13px] text-[#94a3b8]">Photos coming soon</div>}
      </Link>
      <div className={feature ? "p-5" : "p-4"}>
        <Link href={preview ? "#" : href} className="block">
          <p className={`truncate font-semibold ${feature ? "text-[17px]" : "text-[15px]"}`}>{v.year} {v.make} {v.model}</p>
          <p className="truncate text-[12.5px] text-[#64748b]">{[v.trim, specs].filter(Boolean).join(" · ") || " "}</p>
        </Link>
        <div className={`flex items-center justify-between ${feature ? "mt-4" : "mt-3"}`}>
          <span className={`font-bold ${feature ? "text-[20px]" : "text-[18px]"}`} style={{ color: accent }}>{v.price ? `$${v.price.toLocaleString()}` : "Call"}</span>
          <LeadModalButton slug={slug} accent={accent} vehicle={v} preview={preview} className={`text-[12.5px] font-semibold text-white ${feature ? "rounded-full px-4 py-2" : "rounded-lg px-3 py-1.5"}`}>Check availability</LeadModalButton>
        </div>
      </div>
    </div>
  );
}
