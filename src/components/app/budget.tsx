"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card, CardHead } from "./AppKit";

export type Freq = "one-time" | "weekly" | "monthly";
export const perLabel = (f: Freq) => (f === "one-time" ? "one-time" : f === "weekly" ? "week" : "month");
const FREQ: Record<Freq, string> = { "one-time": "One-time", weekly: "Weekly", monthly: "Monthly" };
export const MIN_BUDGET = 250;

/* ── right-side drawer with a blurred page behind ─────────────────────── */
export function Drawer({
  open, onClose, title, footer, children,
}: {
  open: boolean; onClose: () => void; title: string; footer?: ReactNode; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="overlay-in absolute inset-0 bg-n950/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="drawer-in absolute inset-y-0 right-0 flex h-full w-full max-w-[460px] flex-col overflow-hidden border-l border-n200 bg-n50 shadow-[-16px_0_40px_-16px_rgba(0,0,0,0.25)]">
        <div className="flex shrink-0 items-center justify-between border-b border-n200 bg-white px-5 py-3.5">
          <h3 className="text-[15px] font-semibold text-n900">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[15px] text-n500 transition hover:bg-n100" aria-label="Close">✕</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-n200 bg-white px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ── shared controls ──────────────────────────────────────────────────── */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div className={cn("grid gap-2", options.length === 3 ? "grid-cols-3" : options.length === 2 ? "grid-cols-2" : "grid-cols-4")}>
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={cn("h-9 rounded-lg border text-[12.5px] font-medium transition", value === o.v ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n100")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function BudgetSlider({ value, onChange, max = 5000 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="tnum text-[30px] font-semibold leading-none text-n900">${value.toLocaleString()}</span>
        <span className="text-[12px] text-n500">drag to set</span>
      </div>
      <input type="range" min={MIN_BUDGET} max={max} step={50} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-3 w-full accent-brand" />
      <div className="tnum mt-1 flex justify-between text-[11px] text-n400"><span>${MIN_BUDGET}</span><span>${max.toLocaleString()}+</span></div>
    </div>
  );
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : String(n));
export function estimatesFor(budget: number, freq: Freq) {
  const monthly = freq === "weekly" ? budget * 4.3 : budget; // one-time & monthly ~ face value
  const impressions = Math.round(monthly * 140);
  const reach = Math.round(impressions * 0.62);
  const leads = Math.max(1, Math.round(monthly / 22));
  return { impressions, reach, leads };
}

/** Live estimate tiles — update as the budget slider moves. */
export function Estimates({ budget, freq }: { budget: number; freq: Freq }) {
  const e = estimatesFor(budget, freq);
  const tiles = [
    ["Est. reach", fmt(e.reach)],
    ["Impressions", fmt(e.impressions)],
    ["Leads / mo", String(e.leads)],
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map(([l, v]) => (
        <div key={l} className="rounded-lg border border-n200 bg-white p-3">
          <p className="tnum text-[19px] font-semibold leading-none text-n900">{v}</p>
          <p className="mt-1.5 text-[11px] text-n500">{l}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Add-budget drawer (slider + freq + live estimates) ───────────────── */
export function AddBudgetDrawer({ open, onClose, onConfirm, networkName, initial = 500 }: {
  open: boolean; onClose: () => void; onConfirm: (v: { amount: number; freq: Freq }) => void; networkName?: string; initial?: number;
}) {
  const [budget, setBudget] = useState(Math.max(initial, MIN_BUDGET));
  const [freq, setFreq] = useState<Freq>("monthly");
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Add budget${networkName ? ` · ${networkName}` : ""}`}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="h-10 rounded-lg px-4 text-[13px] font-medium text-n600 transition hover:text-n900">Cancel</button>
          <button onClick={() => { onConfirm({ amount: budget, freq }); onClose(); }} className="h-10 flex-1 rounded-lg bg-brand text-[13.5px] font-semibold text-white transition hover:bg-brand-hover">
            Confirm ${budget.toLocaleString()} / {perLabel(freq)}
          </button>
        </div>
      }
    >
      <p className="mb-2 text-[13px] font-medium text-n800">Budget</p>
      <BudgetSlider value={budget} onChange={setBudget} />
      <div className="mt-5">
        <p className="mb-2 text-[13px] font-medium text-n800">Frequency</p>
        <Segmented value={freq} onChange={setFreq} options={(Object.keys(FREQ) as Freq[]).map((f) => ({ v: f, label: FREQ[f] }))} />
      </div>
      <div className="mt-6">
        <p className="mb-2 text-[13px] font-medium text-n800">Estimated performance</p>
        <Estimates budget={budget} freq={freq} />
        <p className="mt-2 text-[11.5px] text-n500">Estimates scale with your budget. Actual results vary by market and creative.</p>
      </div>
    </Drawer>
  );
}

/* ── Connected-network budget card ────────────────────────────────────── */
export function BudgetCard({ networkName, initialBudget, initialFreq = "monthly" }: { networkName: string; initialBudget: number; initialFreq?: Freq }) {
  const [budget, setBudget] = useState(initialBudget);
  const [freq, setFreq] = useState<Freq>(initialFreq);
  const [open, setOpen] = useState(false);
  const est = estimatesFor(budget, freq);
  return (
    <Card>
      <CardHead title="Budget" />
      <div className="p-4">
        <div className="flex items-baseline gap-1.5">
          <span className="tnum text-[24px] font-semibold text-n900">${budget.toLocaleString()}</span>
          <span className="text-[13px] text-n500">/ {perLabel(freq)}</span>
        </div>
        <p className="mt-1 text-[12.5px] text-n500">≈ {est.leads} leads / mo at this budget</p>
        <button onClick={() => setOpen(true)} className="mt-3 h-9 w-full rounded-lg bg-brand text-[13px] font-semibold text-white transition hover:bg-brand-hover">Add budget</button>
      </div>
      <AddBudgetDrawer open={open} onClose={() => setOpen(false)} onConfirm={({ amount, freq }) => { setBudget(amount); setFreq(freq); }} networkName={networkName} initial={budget} />
    </Card>
  );
}
