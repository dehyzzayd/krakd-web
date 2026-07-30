"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { apiFetch, ApiError } from "@/lib/api";
import { vertical as verticalDef } from "@/components/site/verticals";
import { Check } from "lucide-react";

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const CHANNELS = [{ v: "FACEBOOK", label: "Facebook" }, { v: "INSTAGRAM", label: "Instagram" }, { v: "GOOGLE", label: "Google" }] as const;
const OBJECTIVES = [{ v: "LEADS", label: "Leads" }, { v: "CALLS", label: "Calls" }, { v: "TRAFFIC", label: "Traffic" }, { v: "MESSAGES", label: "Messages" }] as const;
const FREQS = [{ v: "MONTHLY", label: "Monthly" }, { v: "WEEKLY", label: "Weekly" }, { v: "ONE_TIME", label: "One-time" }] as const;

type Veh = { id: string; year: number; make: string; model: string; trim: string; price: number };

function Labeled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}{hint && <span className="ml-1.5 text-[11.5px] font-normal text-n400">{hint}</span>}</label>{children}</div>;
}

function Pills<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly { v: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value === o.v;
        return <button key={o.v} type="button" onClick={() => onChange(o.v)} className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition", on ? "border-brand bg-brand text-white" : "border-n200 bg-white text-n600 hover:bg-n50")}>{o.label}</button>;
      })}
    </div>
  );
}

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export function NewCampaignSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({
    name: "", channel: "FACEBOOK" as (typeof CHANNELS)[number]["v"], objective: "LEADS" as (typeof OBJECTIVES)[number]["v"],
    frequency: "MONTHLY" as (typeof FREQS)[number]["v"], budget: "500", radiusMiles: "25", ageMin: "18", ageMax: "65",
    gender: "all" as "all" | "male" | "female", smartTargeting: true,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const [vehicles, setVehicles] = useState<Veh[]>([]);
  const [vertical, setVertical] = useState<string>("AUTOMOTIVE");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const def = verticalDef(vertical);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    apiFetch<{ items: Veh[]; vertical?: string }>("/inventory").then((r) => { setVehicles(r.items ?? []); if (r.vertical) setVertical(r.vertical); }).catch(() => setVehicles([]));
  }, [open]);

  const togglePick = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const budgetCents = Math.round((parseFloat(f.budget) || 0) * 100);
  const feeCents = Math.round(budgetCents * 0.1);
  const netCents = budgetCents - feeCents;

  const save = async () => {
    setErr(null);
    if (!f.name.trim()) { setErr("Name your campaign."); return; }
    if (budgetCents < 5000) { setErr("Minimum budget is $50."); return; }
    setBusy(true);
    try {
      await apiFetch("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: f.name, channel: f.channel, objective: f.objective, frequency: f.frequency,
          budgetCents, radiusMiles: parseInt(f.radiusMiles) || 25, ageMin: parseInt(f.ageMin) || 18,
          ageMax: parseInt(f.ageMax) || 65, gender: f.gender, smartTargeting: f.smartTargeting,
          promotedVehicleIds: [...picked],
        }),
      });
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not create the campaign.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Launch a campaign" subtitle="Krakd manages the ads and reports cost per sale."
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Creating…" : "Create campaign"}</button>
      </>}>
      <div className="space-y-5">
        <Labeled label="Campaign name"><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Certified Trucks — spring" className={fieldCls} /></Labeled>

        <Labeled label="Network"><Pills value={f.channel} onChange={(v) => set("channel", v)} options={CHANNELS} /></Labeled>
        <Labeled label="Objective"><Pills value={f.objective} onChange={(v) => set("objective", v)} options={OBJECTIVES} /></Labeled>
        <Labeled label="Frequency"><Pills value={f.frequency} onChange={(v) => set("frequency", v)} options={FREQS} /></Labeled>

        <Labeled label="Budget" hint="per cycle">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-n400">$</span>
            <input value={f.budget} onChange={(e) => set("budget", e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className={cn(fieldCls, "tnum pl-7")} />
          </div>
        </Labeled>
        {budgetCents >= 5000 && (
          <div className="rounded-lg border border-brand/20 bg-brand-soft/30 p-3 text-[12.5px]">
            <div className="flex justify-between"><span className="text-n500">Krakd fee (10%)</span><span className="tnum font-semibold text-n900">{money(feeCents)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-n500">Real media spend (90%)</span><span className="tnum font-semibold text-n900">{money(netCents)}</span></div>
          </div>
        )}

        <div className="border-t border-n200 pt-4">
          <p className="mb-3 text-[13px] font-semibold text-n900">Targeting</p>
          <div className="grid grid-cols-3 gap-3">
            <Labeled label="Radius" hint="mi"><input value={f.radiusMiles} onChange={(e) => set("radiusMiles", e.target.value.replace(/[^0-9]/g, ""))} className={cn(fieldCls, "tnum")} /></Labeled>
            <Labeled label="Age min"><input value={f.ageMin} onChange={(e) => set("ageMin", e.target.value.replace(/[^0-9]/g, ""))} className={cn(fieldCls, "tnum")} /></Labeled>
            <Labeled label="Age max"><input value={f.ageMax} onChange={(e) => set("ageMax", e.target.value.replace(/[^0-9]/g, ""))} className={cn(fieldCls, "tnum")} /></Labeled>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-n900">Gender</span>
            <Pills value={f.gender} onChange={(v) => set("gender", v)} options={[{ v: "all", label: "All" }, { v: "male", label: "Men" }, { v: "female", label: "Women" }] as const} />
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-between">
            <span><span className="block text-[13px] font-medium text-n900">Smart targeting</span><span className="text-[11.5px] text-n500">Let Krakd optimize the audience automatically.</span></span>
            <button type="button" onClick={() => set("smartTargeting", !f.smartTargeting)} className={cn("relative h-5 w-9 rounded-full transition", f.smartTargeting ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", f.smartTargeting ? "left-4" : "left-0.5")} /></button>
          </label>
        </div>

        <div className="border-t border-n200 pt-4">
          <p className="mb-1 text-[13px] font-semibold capitalize text-n900">Promote {def.plural} <span className="font-normal normal-case text-n400">{picked.size > 0 && `· ${picked.size} selected`}</span></p>
          {vehicles.length === 0
            ? <p className="rounded-lg bg-n50 px-3 py-3 text-[12.5px] text-n500">No {def.plural} yet. Add {def.noun}s first, or launch a general awareness campaign.</p>
            : <div className="max-h-52 space-y-1.5 overflow-y-auto">
                {vehicles.map((v) => {
                  const on = picked.has(v.id);
                  return (
                    <button key={v.id} type="button" onClick={() => togglePick(v.id)} className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition", on ? "border-brand bg-brand-soft/40" : "border-n200 bg-white hover:bg-n50")}>
                      <span className="min-w-0"><span className="block truncate text-[12.5px] font-medium text-n900">{v.year} {v.make} {v.model} {v.trim}</span><span className="tnum text-[11.5px] text-n500">${v.price.toLocaleString()}</span></span>
                      <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full border", on ? "border-brand bg-brand text-white" : "border-n300")}>{on && <Check className="h-2.5 w-2.5" />}</span>
                    </button>
                  );
                })}
              </div>}
        </div>

        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
      </div>
    </Sheet>
  );
}
