import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

function Widget({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] p-4 ${dark ? "bg-ink text-white" : "bg-card text-ink lift"} ${className}`}
    >
      {children}
    </div>
  );
}

function Avatar({ i }: { i: number }) {
  const bg = ["#d8d8d8", "#ff5a16", "#0a0a0a", "#ffd9c7", "#bdbdbd"][i % 5];
  const fg = i % 5 === 1 || i % 5 === 3 ? "#3a1500" : i % 5 === 2 ? "#fff" : "#3a3a3a";
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold"
      style={{ width: 26, height: 26, background: bg, color: fg, boxShadow: "0 0 0 2px #fff" }}
    >
      {"MRPKL"[i % 5]}
    </span>
  );
}

/** Gross sparkline — black line over an accent gradient fill, day labels. */
function AreaChart() {
  const vals = [4120, 6810, 5240, 3960, 7430, 8120, 9880];
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const W = 600;
  const H = 100;
  const stepX = W / (vals.length - 1);
  const points = vals
    .map((v, i) => `${i * stepX},${H - ((v - min) / range) * H}`)
    .join(" ");
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[92px] w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="kdspark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5a16" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ff5a16" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="url(#kdspark)" stroke="none" points={`0,${H} ${points} ${W},${H}`} />
        <polyline fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
      <div className="t-mono grid grid-cols-7 gap-1 text-[11px] text-faint">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-center">{d}</span>
        ))}
      </div>
    </div>
  );
}

/** The marketing hero's product mock — Krakd's dealer OS, Orvion-dressed. */
export function KrakdDash() {
  return (
    <div className="rounded-[26px] bg-card p-3 ring-1 ring-black/5 lift-2 sm:p-4">
      {/* chrome */}
      <div className="flex items-center justify-between gap-3 px-1.5 pb-3">
        <Logo className="text-[18px]" />
        <div className="flex items-center gap-2">
          <div className="hidden items-center -space-x-2 md:flex">
            {[0, 1, 2].map((i) => (
              <Avatar key={i} i={i} />
            ))}
            <span
              className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-inset text-[9px] font-semibold text-muted"
              style={{ boxShadow: "0 0 0 2px #fff" }}
            >
              +5
            </span>
          </div>
          <span className="hidden h-7 items-center rounded-full bg-inset px-3 text-[11px] font-medium text-ink-2 md:inline-flex">
            Store · Downtown
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* gross chart */}
        <Widget className="col-span-12 lg:col-span-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                Gross · this week
              </p>
              <p className="mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.03em]">
                $48,320
              </p>
            </div>
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-[11px] font-semibold text-accent-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> +14%
            </span>
          </div>
          <div className="mt-4">
            <AreaChart />
          </div>
        </Widget>

        {/* AI pipeline — the single dark featured surface */}
        <Widget dark className="col-span-12 lg:col-span-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/60">
              Krakd AI · pipeline
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Working
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-snug text-white/85">
            <span className="font-semibold text-white">37 leads</span> worked
            today — <span className="font-semibold text-white">12 booked</span>,
            4 need you.
          </p>
          <div className="mt-4 space-y-2.5">
            {[
              ["Texted Marcus R.", "replied 6s"],
              ["Booked test drive", "Sat 2:00"],
              ["Qualified · 720", "financing"],
            ].map(([a, b]) => (
              <div key={a} className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[13px]">
                <span className="text-white/85">{a}</span>
                <span className="t-mono text-[11px] text-white/45">{b}</span>
              </div>
            ))}
          </div>
        </Widget>

        {/* stat trio */}
        {[
          { v: "214", l: "units live", s: "18d avg age" },
          { v: "12 min", l: "lead response", s: "day or night" },
          { v: "32%", l: "close rate", s: "+5 pts MoM" },
        ].map((s) => (
          <Widget key={s.l} className="col-span-4">
            <p className="text-[24px] font-semibold leading-none tracking-[-0.03em]">
              {s.v}
            </p>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
              {s.l}
            </p>
            <p className="mt-1 hidden text-[12px] text-faint sm:block">{s.s}</p>
          </Widget>
        ))}
      </div>
    </div>
  );
}
