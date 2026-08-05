"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";
import { apiFetch, ApiError } from "@/lib/api";
import { formatUSPhone } from "@/lib/phone";

type Veh = { id: string; year: number; make: string; model: string; trim: string; price: number };

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const SOURCES = ["Facebook", "Google", "Cars.com", "AutoTrader", "CarGurus", "Website", "Referral", "Walk-in"];

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}</label>{children}</div>;
}

export function AddLeadSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", email: "", source: "Website", vehicle: "", vehicleId: "", temperature: "WARM", assignedToId: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [vehicles, setVehicles] = useState<Veh[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; status: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    apiFetch<{ items: Veh[] }>("/inventory").then((r) => setVehicles(r.items ?? [])).catch(() => setVehicles([]));
    apiFetch<{ members: { id: string; name: string; status: string }[] }>("/team").then((r) => setMembers((r.members ?? []).filter((m) => m.status === "ACTIVE"))).catch(() => setMembers([]));
  }, [open]);

  const save = async () => {
    setErr(null);
    if (!f.firstName.trim()) { setErr("Enter a first name."); return; }
    setBusy(true);
    try {
      const { vehicleId, assignedToId, ...rest } = f;
      await apiFetch("/leads", { method: "POST", body: JSON.stringify({ ...rest, ...(vehicleId ? { vehicleId } : {}), ...(assignedToId ? { assignedToId } : {}) }) });
      toast.success("Lead added");
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not add the lead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} width="max-w-[420px]" title="Add a lead" subtitle="Krakd AI starts following up the moment it's saved."
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Adding…" : "Add lead"}</button>
      </>}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="First name"><input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} className={fieldCls} /></Labeled>
          <Labeled label="Last name"><input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} className={fieldCls} /></Labeled>
        </div>
        <Labeled label="Phone"><input value={f.phone} inputMode="tel" onChange={(e) => set("phone", formatUSPhone(e.target.value))} placeholder="(512) 555-0100" className={cn(fieldCls, "tnum")} /></Labeled>
        <Labeled label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="buyer@email.com" className={fieldCls} /></Labeled>
        <Labeled label="Interested in">
          {vehicles.length > 0 ? (
            <select value={f.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} className={cn(fieldCls, "px-2.5")}>
              <option value="">Not from inventory…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}{v.trim ? ` ${v.trim}` : ""} · ${v.price.toLocaleString()}</option>)}
            </select>
          ) : (
            <input value={f.vehicle} onChange={(e) => set("vehicle", e.target.value)} placeholder="2023 Silverado 1500" className={fieldCls} />
          )}
          {vehicles.length > 0 && !f.vehicleId && (
            <input value={f.vehicle} onChange={(e) => set("vehicle", e.target.value)} placeholder="Or type what they're after" className={cn(fieldCls, "mt-2")} />
          )}
        </Labeled>
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Source"><select value={f.source} onChange={(e) => set("source", e.target.value)} className={cn(fieldCls, "px-2.5")}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Labeled>
          <Labeled label="Temperature"><select value={f.temperature} onChange={(e) => set("temperature", e.target.value)} className={cn(fieldCls, "px-2.5")}><option value="HOT">Hot</option><option value="WARM">Warm</option><option value="COLD">Cold</option></select></Labeled>
        </div>
        {members.length > 0 && (
          <Labeled label="Assign to"><select value={f.assignedToId} onChange={(e) => set("assignedToId", e.target.value)} className={cn(fieldCls, "px-2.5")}><option value="">Unassigned · Krakd AI works it</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Labeled>
        )}
        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
      </div>
    </Sheet>
  );
}
