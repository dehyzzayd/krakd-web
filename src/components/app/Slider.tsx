"use client";

/* Pointer-driven sliders — custom-built to match the design system.
   The thumb travel is inset by its own radius so the handle always sits ON the
   rail (never overhangs the ends) and its centre lines up exactly with the fill. */

import { useRef, useState } from "react";

const THUMB = 18;       // thumb diameter (px)
const HALF = THUMB / 2;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const snap = (v: number, step: number) => Math.round(v / step) * step;

function useTrack(min: number, max: number, step: number) {
  const ref = useRef<HTMLDivElement>(null);
  const valueAt = (clientX: number) => {
    const el = ref.current;
    if (!el) return min;
    const r = el.getBoundingClientRect();
    const frac = (clientX - r.left - HALF) / (r.width - THUMB); // account for the inset track
    return clamp(snap(min + frac * (max - min), step), min, max);
  };
  return { ref, valueAt };
}

// centre x of the thumb for a given 0-100 percentage, inset so it never overhangs
const centre = (pct: number) => `calc(${HALF}px + ${pct / 100} * (100% - ${THUMB}px))`;
const fmtDefault = (v: number) => `${v}`;

const RAIL = "absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-n200";
const FILL = "absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand";
const THUMB_CLS = "absolute top-1/2 rounded-full bg-white ring-1 ring-black/10 shadow-[0_1px_4px_rgba(16,24,40,0.28)]";

export function Slider({ value, onChange, min = 1, max = 100, step = 1, label, format = fmtDefault }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string; format?: (v: number) => string;
}) {
  const { ref, valueAt } = useTrack(min, max, step);
  const [drag, setDrag] = useState(false);
  const p = ((value - min) / (max - min)) * 100;
  return (
    <div className="pt-0.5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12.5px] text-n500">{label}</span>
        <span className="tnum text-[13px] font-semibold text-n900">{format(value)}</span>
      </div>
      <div
        ref={ref}
        className="relative h-5 cursor-pointer touch-none select-none"
        onPointerDown={(e) => { setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); onChange(valueAt(e.clientX)); }}
        onPointerMove={(e) => { if (drag) onChange(valueAt(e.clientX)); }}
        onPointerUp={(e) => { setDrag(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
      >
        <div className={RAIL} />
        <div className={FILL} style={{ width: centre(p) }} />
        <div className={THUMB_CLS} style={{ left: centre(p), width: THUMB, height: THUMB, transform: `translate(-50%,-50%) scale(${drag ? 1.12 : 1})` }} />
      </div>
    </div>
  );
}

export function RangeSlider({ minValue, maxValue, onChange, min = 18, max = 65, step = 1, label, format = fmtDefault }: {
  minValue: number; maxValue: number; onChange: (min: number, max: number) => void; min?: number; max?: number; step?: number; label?: string; format?: (v: number) => string;
}) {
  const { ref, valueAt } = useTrack(min, max, step);
  const [drag, setDrag] = useState<null | "min" | "max">(null);
  const pMin = ((minValue - min) / (max - min)) * 100;
  const pMax = ((maxValue - min) / (max - min)) * 100;

  const start = (which: "min" | "max") => (e: React.PointerEvent) => { e.stopPropagation(); setDrag(which); e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const v = valueAt(e.clientX);
    if (drag === "min") onChange(Math.min(v, maxValue - step), maxValue);
    else onChange(minValue, Math.max(v, minValue + step));
  };
  const end = (e: React.PointerEvent) => { if (drag) { setDrag(null); e.currentTarget.releasePointerCapture(e.pointerId); } };

  return (
    <div className="pt-0.5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12.5px] text-n500">{label}</span>
        <span className="tnum text-[13px] font-semibold text-n900">{format(minValue)} – {format(maxValue)}</span>
      </div>
      <div ref={ref} className="relative h-5 touch-none select-none" onPointerMove={move} onPointerUp={end}>
        <div className={RAIL} />
        <div className={FILL} style={{ left: centre(pMin), width: `calc(${(pMax - pMin) / 100} * (100% - ${THUMB}px))` }} />
        <div className={`${THUMB_CLS} cursor-grab active:cursor-grabbing`} style={{ left: centre(pMin), width: THUMB, height: THUMB, transform: `translate(-50%,-50%) scale(${drag === "min" ? 1.12 : 1})` }} onPointerDown={start("min")} />
        <div className={`${THUMB_CLS} cursor-grab active:cursor-grabbing`} style={{ left: centre(pMax), width: THUMB, height: THUMB, transform: `translate(-50%,-50%) scale(${drag === "max" ? 1.12 : 1})` }} onPointerDown={start("max")} />
      </div>
    </div>
  );
}
