"use client";

/* Pointer-driven sliders — custom-built so they match the design system exactly
   (native range styling is inconsistent across browsers). */

import { useRef, useState } from "react";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const snap = (v: number, step: number) => Math.round(v / step) * step;

function useTrack(min: number, max: number, step: number) {
  const ref = useRef<HTMLDivElement>(null);
  const valueAt = (clientX: number) => {
    const el = ref.current;
    if (!el) return min;
    const r = el.getBoundingClientRect();
    const raw = min + ((clientX - r.left) / r.width) * (max - min);
    return clamp(snap(raw, step), min, max);
  };
  return { ref, valueAt };
}

const fmtDefault = (v: number) => `${v}`;

export function Slider({ value, onChange, min = 1, max = 100, step = 1, label, format = fmtDefault }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string; format?: (v: number) => string;
}) {
  const { ref, valueAt } = useTrack(min, max, step);
  const [drag, setDrag] = useState(false);
  const p = ((value - min) / (max - min)) * 100;
  return (
    <div className="pt-0.5">
      <div className="mb-2.5 flex items-center justify-between">
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
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-n200" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand" style={{ width: `${p}%` }} />
        <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-white shadow-sm transition-transform" style={{ left: `${p}%`, transform: `translate(-50%,-50%) scale(${drag ? 1.15 : 1})` }} />
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

  const start = (which: "min" | "max") => (e: React.PointerEvent) => {
    e.stopPropagation();
    setDrag(which);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const v = valueAt(e.clientX);
    if (drag === "min") onChange(Math.min(v, maxValue - step), maxValue);
    else onChange(minValue, Math.max(v, minValue + step));
  };
  const end = (e: React.PointerEvent) => { if (drag) { setDrag(null); e.currentTarget.releasePointerCapture(e.pointerId); } };

  const thumb = "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-white shadow-sm cursor-grab active:cursor-grabbing";
  return (
    <div className="pt-0.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[12.5px] text-n500">{label}</span>
        <span className="tnum text-[13px] font-semibold text-n900">{format(minValue)} – {format(maxValue)}</span>
      </div>
      <div ref={ref} className="relative h-5 touch-none select-none" onPointerMove={move} onPointerUp={end}>
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-n200" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand" style={{ left: `${pMin}%`, width: `${pMax - pMin}%` }} />
        <div className={thumb} style={{ left: `${pMin}%`, transform: `translate(-50%,-50%) scale(${drag === "min" ? 1.15 : 1})` }} onPointerDown={start("min")} />
        <div className={thumb} style={{ left: `${pMax}%`, transform: `translate(-50%,-50%) scale(${drag === "max" ? 1.15 : 1})` }} onPointerDown={start("max")} />
      </div>
    </div>
  );
}
