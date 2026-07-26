"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { useApi } from "@/lib/useApi";
import { apiFetch, ApiError } from "@/lib/api";

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const TYPES: [string, string][] = [["TEST_DRIVE", "Test drive"], ["DELIVERY", "Delivery"], ["PHONE", "Phone consultation"], ["SERVICE", "Service"], ["TRADE_APPRAISAL", "Trade appraisal"]];

const today = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`; };

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}</label>{children}</div>;
}

export function EditAppointmentSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const { data } = useApi<{ items: { id: string; name: string }[] }>("/leads");
  const leads = data?.items ?? [];

  const [type, setType] = useState("TEST_DRIVE");
  const [leadId, setLeadId] = useState("");
  const [date, setDate] = useState(today());
  const [start, setStart] = useState("2:00 PM");
  const [end, setEnd] = useState("2:45 PM");
  const [location, setLocation] = useState("Showroom");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const effectiveLead = leadId || leads[0]?.id || "";

  const save = async () => {
    setErr(null);
    if (!effectiveLead) { setErr("Add a lead first — appointments are booked against a lead."); return; }
    const s = new Date(`${date} ${start}`), e = new Date(`${date} ${end}`);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) { setErr("Enter a valid date and time (e.g. 07/26/2026, 2:00 PM)."); return; }
    setBusy(true);
    try {
      await apiFetch("/appointments", { method: "POST", body: JSON.stringify({ leadId: effectiveLead, type, scheduledStart: s.toISOString(), scheduledEnd: e.toISOString(), location, notes: note }) });
      onCreated?.();
      onClose();
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Could not create the appointment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="New appointment" subtitle="Schedule a visit against a lead."
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Creating…" : "Create appointment"}</button>
      </>}>
      <div className="space-y-5">
        <Labeled label="Appointment type"><select value={type} onChange={(e) => setType(e.target.value)} className={cn(fieldCls, "px-2.5")}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Labeled>
        <Labeled label="Lead / customer">
          {leads.length === 0
            ? <p className="rounded-md border border-dashed border-n300 px-3 py-2.5 text-[12.5px] text-n500">No leads yet — add a lead first, then book.</p>
            : <select value={effectiveLead} onChange={(e) => setLeadId(e.target.value)} className={cn(fieldCls, "px-2.5")}>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>}
        </Labeled>

        <div className="border-t border-n200" />

        <div className="grid grid-cols-3 gap-3">
          <Labeled label="Date"><input value={date} onChange={(e) => setDate(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
          <Labeled label="Start"><input value={start} onChange={(e) => setStart(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
          <Labeled label="End"><input value={end} onChange={(e) => setEnd(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
        </div>

        <div className="border-t border-n200" />

        <Labeled label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} className={fieldCls} /></Labeled>
        <Labeled label="Note"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional note for the team…" className={cn(fieldCls, "h-auto resize-none py-2")} /></Labeled>

        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
        <div className="rounded-lg bg-brand-soft/50 px-3 py-2.5 text-[12.5px] text-n600">Krakd AI will text a reminder 1 hour before and confirm the morning of.</div>
      </div>
    </Sheet>
  );
}
