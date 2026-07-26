"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Card, Badge, type Tone } from "@/components/app/AppKit";
import { Topbar } from "@/components/app/Topbar";
import {
  money, miles, agingBucket, marketDelta, vehicleSpecs,
  STATUS_LABEL, type Vehicle,
} from "@/lib/inventory";
import { Camera, Sparkles, TrendingDown, Upload } from "lucide-react";

const HISTORY = [100, 100, 99, 98, 98, 96, 95, 95];

function PriceHistory({ price }: { price: number }) {
  const max = Math.max(...HISTORY), W = 480, H = 70, step = W / (HISTORY.length - 1);
  const pts = HISTORY.map((v, i) => `${i * step},${H - (v / max) * (H - 12) - 6}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[70px] w-full" preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

export function VehicleDetail({ v }: { v: Vehicle }) {
  const m = marketDelta(v);
  const ag = agingBucket(v.days);
  const sp = vehicleSpecs(v);
  const suggested = Math.round((v.marketAvg - 350) / 10) * 10;
  const [main, setMain] = useState(0);
  const thumbs = v.photos > 0 ? Array.from({ length: Math.min(5, Math.max(3, v.photos)) }, () => v.image) : [];

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: "Inventory", href: "/dashboard/inventory" }, { label: `${v.year} ${v.make} ${v.model}` }]} />

      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        {/* main */}
        <div className="space-y-4">
          {/* gallery + header */}
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-[16/9] w-full bg-n100">
              {v.photos > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[main] ?? v.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center bg-warn-soft/40 text-center"><div><Camera className="mx-auto h-8 w-8 text-warn" /><p className="mt-2 text-[13px] font-semibold text-warn">No photos — AI flagged</p><p className="text-[12px] text-n500">Add photos to publish this unit</p></div></div>
              )}
              <span className={cn("absolute left-4 top-4 rounded-md px-2.5 py-1 text-[12px] font-semibold", { available: "bg-ok text-white", recon: "bg-warn text-white", reserved: "bg-brand text-white", wholesale: "bg-n700 text-white", sold: "bg-n700 text-white" }[v.status])}>{STATUS_LABEL[v.status]}</span>
            </div>
            {thumbs.length > 0 && (
              <div className="flex gap-2 border-t border-[#e4e7ec] p-3">
                {thumbs.map((t, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <button key={i} onClick={() => setMain(i)} className={cn("h-14 w-20 shrink-0 overflow-hidden rounded-md border-2", main === i ? "border-brand" : "border-transparent")}><img src={t} alt="" className="h-full w-full object-cover" /></button>
                ))}
                <button className="grid h-14 w-20 shrink-0 place-items-center rounded-md border border-dashed border-n300 text-n400 hover:bg-n50"><Upload className="h-4 w-4" /></button>
              </div>
            )}
            <div className="flex flex-wrap items-end justify-between gap-3 p-5">
              <div>
                <h1 className="text-[22px] font-bold tracking-[-0.02em] text-n900">{v.year} {v.make} {v.model}</h1>
                <p className="text-[13px] text-n500">{v.trim} · {v.body} · <span className="tnum">{v.stock}</span> · <span className="tnum">{v.vin}</span></p>
              </div>
              <div className="text-right">
                <p className="tnum text-[28px] font-bold text-n900">{money(v.price)}</p>
                {m.tone !== "neutral" && <p className={cn("text-[12.5px] font-medium", m.tone === "ok" ? "text-ok" : "text-err")}>{m.delta < 0 ? "▼" : "▲"} {money(Math.abs(m.delta))} {m.delta < 0 ? "below" : "above"} market</p>}
              </div>
            </div>
          </Card>

          {/* market pricing intelligence */}
          <Card className="p-5">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand" /><h3 className="text-[14px] font-semibold text-n900">Market pricing intelligence</h3></div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <div className="relative h-2 rounded-full" style={{ background: "linear-gradient(90deg,#16a34a33,#c0853233,#dc262633)" }}>
                  <span className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 bg-n400" style={{ left: `${m.avgPos * 100}%` }} title="Market avg" />
                  <span className={cn("absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white", m.tone === "ok" ? "bg-ok" : m.tone === "err" ? "bg-err" : "bg-n700")} style={{ left: `${m.position * 100}%` }} />
                </div>
                <div className="tnum mt-1.5 flex justify-between text-[11px] text-n400"><span>{money(v.marketLow)}</span><span>mkt {money(v.marketAvg)}</span><span>{money(v.marketHigh)}</span></div>
                <p className="mt-3 text-[12.5px] text-n600">Priced <span className={cn("font-semibold", m.tone === "ok" ? "text-ok" : m.tone === "err" ? "text-err" : "text-n800")}>{Math.abs(m.pct).toFixed(1)}% {m.delta < 0 ? "below" : "above"}</span> the market average across <span className="font-semibold text-n800">18</span> comparable listings within 100 mi.</p>
              </div>
              <div className="rounded-xl bg-brand-soft p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand"><Sparkles className="h-3.5 w-3.5" />AI price recommendation</p>
                <p className="mt-1.5 tnum text-[22px] font-bold text-n900">{money(suggested)}</p>
                <p className="text-[12px] text-n600">Moves you to the 1st page and should sell ~6 days faster at this mileage.</p>
                <button className="mt-3 h-8 rounded-lg bg-brand px-3.5 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Apply price</button>
              </div>
            </div>
          </Card>

          {/* specs */}
          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-n900">Specifications</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {[["Mileage", miles(v.mileage)], ["Engine", sp.engine], ["Transmission", sp.transmission], ["Drivetrain", sp.drivetrain], ["Fuel", sp.fuel], ["Exterior", v.color], ["Interior", sp.interior], ["Body style", v.body], ["VIN", v.vin]].map(([k, val]) => (
                <div key={k}><p className="text-[11px] uppercase tracking-wide text-n500">{k}</p><p className="tnum mt-0.5 text-[13px] font-medium text-n900">{val}</p></div>
              ))}
            </div>
          </Card>

          {/* price history */}
          <Card className="p-5">
            <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[14px] font-semibold text-n900"><TrendingDown className="h-4 w-4 text-n500" />Price history</h3><span className="text-[12px] text-n500">since listed · {v.days}d ago</span></div>
            <div className="mt-3"><PriceHistory price={v.price} /></div>
            <div className="mt-1 flex justify-between text-[11px] text-n400"><span>Listed {money(Math.round(v.price * 1.05))}</span><span className="text-n700">Now {money(v.price)}</span></div>
          </Card>
        </div>

        {/* rail */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["Days on lot", `${v.days}`, ag.tone as Tone], ["Photos", String(v.photos), "brand" as Tone], ["VDP views", String(v.vdpViews), "ok" as Tone]].map(([l, val]) => (
                <div key={l}><p className="tnum text-[20px] font-bold text-n900">{val}</p><p className="mt-0.5 text-[10.5px] uppercase tracking-wide text-n500">{l}</p></div>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-n50 px-3 py-2 text-center"><Badge tone={ag.tone as Tone}>{ag.label} · avg market sells in 34 days</Badge></div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[13px] font-semibold text-n900">Cost &amp; gross</h3>
            <div className="mt-3 space-y-2 text-[12.5px]">
              {[["Cost", money(v.cost)], ["Recon", money(1250)], ["Pack", money(695)], ["Internet price", money(v.price)]].map(([k, val]) => <div key={k} className="flex justify-between"><span className="text-n500">{k}</span><span className="tnum font-medium text-n900">{val}</span></div>)}
              <div className="flex justify-between border-t border-[#e4e7ec] pt-2"><span className="font-semibold text-n900">Front gross</span><span className="tnum font-bold text-ok">{money(v.price - v.cost - 1250 - 695)}</span></div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[13px] font-semibold text-n900">Recon &amp; readiness</h3>
            <div className="mt-3 space-y-2.5">
              {[["Inspection", "Passed", "ok"], ["Detail", v.status === "recon" ? "In progress" : "Complete", v.status === "recon" ? "warn" : "ok"], ["Photos", v.photos > 0 ? `${v.photos} on file` : "Needed", v.photos > 0 ? "ok" : "err"], ["Frontline ready", v.status === "available" ? "Yes" : "Pending", v.status === "available" ? "ok" : "warn"]].map(([k, val, tone]) => (
                <div key={k} className="flex items-center justify-between text-[12.5px]"><span className="text-n600">{k}</span><Badge tone={tone as Tone}>{val}</Badge></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
