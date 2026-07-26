"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { LEADS, type Appt } from "@/lib/crm";

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const TYPES = ["Test drive", "Delivery", "Phone consultation", "Service", "Trade appraisal"];

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}</label>{children}</div>;
}

export function EditAppointmentSheet({ open, onClose, appt }: { open: boolean; onClose: () => void; appt?: Appt | null }) {
  const [type, setType] = useState(appt?.type ?? "Test drive");
  const [lead, setLead] = useState(appt?.name ?? LEADS[0].name);
  const [vehicle, setVehicle] = useState(appt?.vehicle ?? "");
  const [date, setDate] = useState("07/26/2026");
  const [start, setStart] = useState(appt?.time ?? "2:00 PM");
  const [end, setEnd] = useState("2:45 PM");
  const [owner, setOwner] = useState(appt?.owner ?? "Krakd AI");
  const [priority, setPriority] = useState("Medium");
  const [location, setLocation] = useState("Downtown Auto — showroom");
  const [note, setNote] = useState("");

  return (
    <Sheet open={open} onClose={onClose} title={appt ? "Edit appointment" : "New appointment"} subtitle={appt ? "Update the appointment details" : "Schedule a new appointment"}
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={onClose} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold">{appt ? "Save changes" : "Create appointment"}</button>
      </>}>
      <div className="space-y-5">
        <Labeled label="Appointment type"><select value={type} onChange={(e) => setType(e.target.value)} className={cn(fieldCls, "px-2.5")}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Labeled>
        <Labeled label="Lead / customer"><select value={lead} onChange={(e) => setLead(e.target.value)} className={cn(fieldCls, "px-2.5")}>{LEADS.map((l) => <option key={l.id}>{l.name}</option>)}</select></Labeled>
        <Labeled label="Vehicle"><input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="2023 Chevrolet Silverado 1500" className={fieldCls} /></Labeled>

        <div className="border-t border-n200" />

        <div className="grid grid-cols-3 gap-3">
          <Labeled label="Date"><input value={date} onChange={(e) => setDate(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
          <Labeled label="Start"><input value={start} onChange={(e) => setStart(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
          <Labeled label="End"><input value={end} onChange={(e) => setEnd(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Assigned to"><select value={owner} onChange={(e) => setOwner(e.target.value)} className={cn(fieldCls, "px-2.5")}><option>Krakd AI</option><option>Dana M.</option><option>Marco T.</option></select></Labeled>
          <Labeled label="Priority"><select value={priority} onChange={(e) => setPriority(e.target.value)} className={cn(fieldCls, "px-2.5")}><option>Medium</option><option>High</option><option>Low</option></select></Labeled>
        </div>

        <div className="border-t border-n200" />

        <Labeled label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} className={fieldCls} /></Labeled>
        <Labeled label="Note"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional note for the team…" className={cn(fieldCls, "h-auto resize-none py-2")} /></Labeled>

        <div className="rounded-lg bg-brand-soft/50 px-3 py-2.5 text-[12.5px] text-n600">Krakd AI will text a reminder 1 hour before and confirm the morning of.</div>
      </div>
    </Sheet>
  );
}
