"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { apiFetch, ApiError } from "@/lib/api";

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const SOURCES = ["Facebook", "Google", "Cars.com", "AutoTrader", "CarGurus", "Website", "Referral", "Walk-in"];

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}</label>{children}</div>;
}

export function AddLeadSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", email: "", source: "Website", vehicle: "", temperature: "WARM" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    if (!f.firstName.trim()) { setErr("Enter a first name."); return; }
    setBusy(true);
    try {
      await apiFetch("/leads", { method: "POST", body: JSON.stringify(f) });
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not add the lead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add a lead" subtitle="Krakd AI starts following up the moment it's saved."
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Adding…" : "Add lead"}</button>
      </>}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="First name"><input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} className={fieldCls} /></Labeled>
          <Labeled label="Last name"><input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} className={fieldCls} /></Labeled>
        </div>
        <Labeled label="Phone"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(512) 555-0100" className={cn(fieldCls, "tnum")} /></Labeled>
        <Labeled label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="buyer@email.com" className={fieldCls} /></Labeled>
        <Labeled label="Interested in"><input value={f.vehicle} onChange={(e) => set("vehicle", e.target.value)} placeholder="2023 Silverado 1500" className={fieldCls} /></Labeled>
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Source"><select value={f.source} onChange={(e) => set("source", e.target.value)} className={cn(fieldCls, "px-2.5")}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Labeled>
          <Labeled label="Temperature"><select value={f.temperature} onChange={(e) => set("temperature", e.target.value)} className={cn(fieldCls, "px-2.5")}><option value="HOT">Hot</option><option value="WARM">Warm</option><option value="COLD">Cold</option></select></Labeled>
        </div>
        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
      </div>
    </Sheet>
  );
}
