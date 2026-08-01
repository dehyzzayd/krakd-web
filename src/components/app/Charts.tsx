"use client";

/* Lightweight, dependency-free SVG charts. Clean 2D — matches the platform. */

import { useRef, useState } from "react";

const BRAND = "#ff5a16";
const LEAD = "#0ea5e9";

type Pt = { label: string; a: number; b: number };

const smooth = (pts: [number, number][]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
};

/** Dual-series trend: filled area (a, e.g. spend) + line (b, e.g. leads), each on its own scale. */
export function AreaChart({ data, aName, bName, fmtA, fmtB, height = 200 }: {
  data: Pt[]; aName: string; bName: string; fmtA: (n: number) => string; fmtB: (n: number) => string; height?: number;
}) {
  const W = 680, H = height, P = { t: 14, r: 12, b: 22, l: 12 };
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  if (!data.length) return null;

  const aMax = Math.max(1, ...data.map((d) => d.a));
  const bMax = Math.max(1, ...data.map((d) => d.b));
  const x = (i: number) => P.l + (i / Math.max(1, data.length - 1)) * (W - P.l - P.r);
  const yA = (v: number) => P.t + (1 - v / aMax) * (H - P.t - P.b);
  const yB = (v: number) => P.t + (1 - v / bMax) * (H - P.t - P.b);

  const aPts = data.map((d, i) => [x(i), yA(d.a)] as [number, number]);
  const bPts = data.map((d, i) => [x(i), yB(d.b)] as [number, number]);
  const area = `${smooth(aPts)} L ${x(data.length - 1)},${H - P.b} L ${x(0)},${H - P.b} Z`;

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - P.l) / (W - P.l - P.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const ticks = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} preserveAspectRatio="none">
        <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND} stopOpacity="0.20" /><stop offset="100%" stopColor={BRAND} stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={P.l} x2={W - P.r} y1={P.t + g * (H - P.t - P.b)} y2={P.t + g * (H - P.t - P.b)} stroke="#eef0f2" strokeWidth="1" />)}
        <path d={area} fill="url(#areaFill)" />
        <path d={smooth(aPts)} fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" />
        <path d={smooth(bPts)} fill="none" stroke={LEAD} strokeWidth="2" strokeDasharray="1 0" strokeLinecap="round" opacity="0.9" />
        {hover !== null && <>
          <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="#c9ced4" strokeWidth="1" />
          <circle cx={x(hover)} cy={yA(data[hover].a)} r="4" fill={BRAND} stroke="#fff" strokeWidth="1.5" />
          <circle cx={x(hover)} cy={yB(data[hover].b)} r="4" fill={LEAD} stroke="#fff" strokeWidth="1.5" />
        </>}
        {ticks.map((i) => <text key={i} x={x(i)} y={H - 6} fontSize="10" fill="#98a2b3" textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}>{data[i].label}</text>)}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-1 rounded-lg border border-n200 bg-white px-2.5 py-1.5 text-[11px] shadow-md" style={{ left: `min(calc(${(hover / Math.max(1, data.length - 1)) * 100}% - 10px), calc(100% - 130px))` }}>
          <p className="font-semibold text-n900">{data[hover].label}</p>
          <p className="mt-0.5 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: BRAND }} />{aName} <span className="tnum ml-auto font-semibold">{fmtA(data[hover].a)}</span></p>
          <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: LEAD }} />{bName} <span className="tnum ml-auto font-semibold">{fmtB(data[hover].b)}</span></p>
        </div>
      )}
    </div>
  );
}

/** Conversion funnel — horizontal bars with drop-off rate + cost per step. */
export function FunnelChart({ stages }: { stages: { key: string; value: number; rate: number | null; cost: string }[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="space-y-2">
      {stages.map((s) => {
        const w = Math.max(2, (s.value / max) * 100);
        const inside = w > 32; // wide enough to hold the number legibly
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-right text-[12px] font-medium text-n600">{s.key}</div>
            <div className="relative h-8 flex-1 rounded-md bg-n100">
              <div className="h-full rounded-md bg-gradient-to-r from-brand to-brand/75" style={{ width: `${w}%` }} />
              <span className={`tnum absolute top-1/2 -translate-y-1/2 text-[12px] font-semibold ${inside ? "left-2.5 text-white" : "text-n800"}`} style={inside ? undefined : { left: `calc(${w}% + 8px)` }}>{s.value.toLocaleString()}</span>
            </div>
            <div className="w-16 shrink-0 text-right"><p className="tnum text-[12px] font-semibold text-n800">{s.rate === null ? "—" : `${s.rate.toFixed(0)}%`}</p><p className="tnum text-[10px] text-n400">{s.cost}</p></div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal share bar — network spend split. */
export function SplitBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = Math.max(1, parts.reduce((s, p) => s + p.value, 0));
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-n100">
        {parts.map((p) => p.value > 0 && <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={p.label} />)}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {parts.filter((p) => p.value > 0).map((p) => <span key={p.label} className="flex items-center gap-1.5 text-[11.5px] text-n600"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.label} <span className="tnum font-semibold text-n800">{Math.round((p.value / total) * 100)}%</span></span>)}
        {parts.every((p) => p.value === 0) && <span className="text-[11.5px] text-n400">No spend yet</span>}
      </div>
    </div>
  );
}
