"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import type { SiteVehicle } from "@/lib/server/site";
import { vertical as verticalDef, estMonthlyFor } from "./verticals";
import { LeadModalButton } from "./LeadForm";

type Variant = "sharp" | "soft" | "editorial";

const SHELL: Record<Variant, string> = {
  sharp: "rounded-md border border-black/10 hover:border-black/30 hover:shadow-lg",
  soft: "rounded-2xl border border-black/8 shadow-sm hover:shadow-md",
  editorial: "rounded-lg border border-black/8 hover:shadow-xl",
};
const PHOTO: Record<Variant, string> = { sharp: "aspect-[4/3]", soft: "aspect-[4/3]", editorial: "aspect-[3/2]" };

export type CardOptions = { finance?: boolean; photoCount?: boolean; specs?: boolean };

export function VehicleCard({ slug, accent, v, variant = "soft", preview, vertical: vert, card }: {
  slug: string; accent: string; v: SiteVehicle; variant?: Variant; preview?: boolean; vertical?: string; card?: CardOptions;
}) {
  const def = verticalDef(vert);
  const href = `/site/${slug}/inventory/${v.id}`;
  const mo = def.finance?.show && v.price ? estMonthlyFor(def, v.price * 100) : 0;
  const badges = def.badges(v);
  const title = def.titleOf(v);
  const sub = def.subtitleOf(v);
  const specs = def.specs(v);
  const editorial = variant === "editorial";
  const sharp = variant === "sharp";

  return (
    <div data-edit="section:inventory" data-edit-label="Vehicle cards" className={`group flex flex-col overflow-hidden bg-white transition ${SHELL[variant]}`}>
      <Link href={preview ? "#" : href} className={`relative block overflow-hidden bg-[#e6eaf0] ${PHOTO[variant]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {v.image ? <img src={v.image} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="grid h-full place-items-center text-[13px] text-[#94a3b8]">Photos coming soon</div>}
        {badges.length > 0 && (
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {badges.map((b, i) => <span key={b} className={`rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${i === 0 ? "bg-emerald-600 text-white" : "bg-black/75 text-white"}`}>{b}</span>)}
          </div>
        )}
        {card?.photoCount !== false && (v.photoCount ?? v.photos.length) > 1 && <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white"><Camera className="h-3 w-3" />{v.photoCount ?? v.photos.length}</span>}
      </Link>

      <div className={`flex flex-1 flex-col ${editorial ? "p-5" : "p-4"}`}>
        <Link href={preview ? "#" : href} className="block">
          <p className={`truncate font-semibold text-[#0f172a] ${editorial ? "text-[17px]" : "text-[15.5px]"}`}>{title}</p>
          <p className="truncate text-[12.5px] text-[#64748b]">{sub || " "}</p>
        </Link>

        {card?.specs !== false && (
          <div className="mt-2.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[11.5px] text-[#64748b]">
            {specs.map((s, i) => (
              <span key={s.label} className="inline-flex items-center gap-2.5">
                {i > 0 && <span className="text-[#cbd5e1]">·</span>}{s.value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-black/8 pt-3" style={{ marginTop: "12px" }}>
          <div>
            <p className={`font-bold leading-none text-[#0f172a] ${editorial ? "text-[22px]" : "text-[20px]"}`}>{v.price ? `$${v.price.toLocaleString()}` : "Call"}</p>
            {mo > 0 && card?.finance !== false && <p className="mt-1 text-[11.5px] font-medium" style={{ color: accent }}>{def.finance!.label} ${mo.toLocaleString()}/mo</p>}
          </div>
          <LeadModalButton slug={slug} accent={accent} vehicle={v} preview={preview}
            className={`text-white ${sharp ? "rounded-md px-3.5 py-2 text-[12px] font-bold uppercase tracking-wide" : editorial ? "rounded-none border px-4 py-2 text-[11.5px] font-medium uppercase tracking-[0.12em]" : "rounded-lg px-3.5 py-2 text-[12.5px] font-semibold"}`}>
            {editorial ? "Enquire" : "Check now"}
          </LeadModalButton>
        </div>
      </div>
    </div>
  );
}
