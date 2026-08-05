"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
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
const inCls = "h-9 w-full rounded-lg border border-n200 bg-white px-2.5 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-n400";

/** Let dealers add any spec/feature that isn't in the preset list — stored as
 *  free-form attributes (used on the VDP, window sticker and marketplace feeds). */
function CustomSpecs({ values, knownKeys, onChange }: { values: Values; knownKeys: Set<string>; onChange: (next: Values) => void }) {
  const [name, setName] = useState("");
  const [val, setVal] = useState("");
  const custom = Object.keys(values).filter((k) => !knownKeys.has(k) && String(values[k] ?? "").trim() !== "");

  const add = () => {
    const label = name.trim();
    if (!label) return;
    onChange({ ...values, [label]: val.trim() || "Yes" });
    setName(""); setVal("");
  };
  const remove = (k: string) => { const next = { ...values }; delete next[k]; onChange(next); };
  const setVal2 = (k: string, v: string) => onChange({ ...values, [k]: v });

  return (
    <div>
      <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-n400">Features & custom specs</p>
      {custom.length > 0 && (
        <div className="mb-3 space-y-2">
          {custom.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="w-40 shrink-0 truncate text-[12.5px] font-medium text-n700" title={k}>{k}</span>
              <input value={String(values[k] ?? "")} onChange={(e) => setVal2(k, e.target.value)} className={inCls} />
              <button type="button" onClick={() => remove(k)} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-n400 transition hover:bg-n100 hover:text-err"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Spec or feature (e.g. Tow Package, 0-60)" className={cn(inCls, "w-48 shrink-0")} />
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Value (optional — defaults to “Yes”)" className={inCls} />
        <button type="button" onClick={add} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-semibold text-n700 transition hover:bg-n100"><Plus className="h-3.5 w-3.5" />Add</button>
      </div>
      <p className="mt-1.5 text-[11.5px] text-n400">Anything you add shows on the vehicle page, window sticker and marketplace feeds.</p>
    </div>
  );
}

export function SpecFields({ category, values, onChange }: { category: string; values: Values; onChange: (next: Values) => void }) {
  const def = categoryById(category);
  const set = (key: string, v: string | boolean) => onChange({ ...values, [key]: v });
  const knownKeys = new Set(def.sections.flatMap((s) => s.fields.map((f) => f.key)));

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
      <CustomSpecs values={values} knownKeys={knownKeys} onChange={onChange} />
    </div>
  );
}
