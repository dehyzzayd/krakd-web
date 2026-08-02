"use client";

import { cn } from "@/lib/cn";
import { categoryById, fieldVisible, type Field } from "@/lib/vehicleSpecs";

const inputCls = "h-9 w-full rounded-lg border border-n200 bg-white px-2.5 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-n400";

type Values = Record<string, string | boolean>;

function SpecField({ f, value, onChange }: { f: Field; value: string | boolean | undefined; onChange: (v: string | boolean) => void }) {
  if (f.type === "toggle") {
    const on = value === true || value === "true";
    return (
      <div className="flex items-center justify-between rounded-lg border border-n200 px-2.5 py-1.5">
        <span className="text-[12.5px] font-medium text-n700">{f.label}</span>
        <button type="button" onClick={() => onChange(!on)} className={cn("relative h-5 w-9 shrink-0 rounded-full transition", on ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", on ? "left-4" : "left-0.5")} /></button>
      </div>
    );
  }
  const label = <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-n500">{f.label}{f.unit && <span className="font-normal normal-case text-n400">· {f.unit}</span>}</span>;
  return (
    <label className="block">
      {label}
      {f.type === "select" ? (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input value={String(value ?? "")} onChange={(e) => onChange(f.type === "number" ? e.target.value.replace(/[^0-9.,]/g, "") : e.target.value)} inputMode={f.type === "number" ? "decimal" : undefined} placeholder={f.placeholder} className={cn(inputCls, f.type === "number" && "tnum")} />
      )}
    </label>
  );
}

/** Renders the deep spec sections for a category, honoring conditional (showIf) fields. */
export function SpecFields({ category, values, onChange }: { category: string; values: Values; onChange: (next: Values) => void }) {
  const def = categoryById(category);
  const set = (key: string, v: string | boolean) => onChange({ ...values, [key]: v });

  return (
    <div className="space-y-5">
      {def.sections.map((section) => {
        const visible = section.fields.filter((f) => fieldVisible(f, values));
        if (visible.length === 0) return null;
        return (
          <div key={section.title}>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-n400">{section.title}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visible.map((f) => <SpecField key={f.key} f={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
