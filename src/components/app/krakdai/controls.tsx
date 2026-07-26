"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputCls = "w-full rounded-lg border border-n200 bg-white px-3 py-2 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-n400";

export function Switch({ on, onChange, disabled }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange?.(!on)}
      className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-brand" : "bg-n300", disabled && "opacity-60")}>
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

export function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-n200 bg-n50 p-0.5">
      {options.map((o) => <button key={o.v} type="button" onClick={() => onChange(o.v)} className={cn("rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition", value === o.v ? "bg-white text-n900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]" : "text-n500 hover:text-n700")}>{o.label}</button>)}
    </div>
  );
}

/* Type-led settings card — header rail + divider, no icon chrome. */
export function Section({ title, desc, children, right }: { icon?: React.ComponentType<{ className?: string }>; title: string; desc: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-n200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-n100 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-n900">{title}</h3>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-n500">{desc}</p>
        </div>
        {right && <div className="shrink-0 pt-0.5">{right}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Row({ title, desc, children, last }: { title: string; desc?: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3.5", !last && "border-b border-n100")}>
      <div className="min-w-0"><p className="text-[13px] font-medium text-n900">{title}</p>{desc && <p className="mt-0.5 text-[11.5px] leading-relaxed text-n500">{desc}</p>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-n500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-relaxed text-n400">{hint}</span>}
    </label>
  );
}

export function LinkField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center rounded-lg border border-n200 bg-white transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
        <span className="border-r border-n100 px-2.5 py-2 text-[12px] font-medium text-n400">https://</span>
        <input value={value.replace(/^https?:\/\//, "")} onChange={(e) => onChange("https://" + e.target.value.replace(/^https?:\/\//, ""))} className="h-9 flex-1 bg-transparent px-2.5 text-[13px] text-n700 outline-none" />
      </div>
    </Field>
  );
}
