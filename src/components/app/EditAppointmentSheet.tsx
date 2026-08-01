"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { useApi } from "@/lib/useApi";
import { apiFetch, ApiError } from "@/lib/api";
import { vertical as verticalDef } from "@/components/site/verticals";

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const addMinutes = (time: string, mins: number) => { const [h, m] = time.split(":").map(Number); const t = new Date(2000, 0, 1, h, m + mins); return `${pad(t.getHours())}:${pad(t.getMinutes())}`; };
const fmtTime = (t: string) => { const [h, m] = t.split(":").map(Number); if (isNaN(h)) return t; const am = h < 12; const hr = h % 12 || 12; return `${hr}:${pad(m)} ${am ? "AM" : "PM"}`; };

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}</label>{children}</div>;
}

type ApptFull = { id: string; leadId: string | null; type: string; date: string; startTime: string; endTime: string; tz: string; location: string | null; notes: string | null };

export function EditAppointmentSheet({ open, onClose, onCreated, apptId }: { open: boolean; onClose: () => void; onCreated?: () => void; apptId?: string }) {
  const editing = !!apptId;
  const { data } = useApi<{ items: { id: string; name: string }[] }>("/leads");
  const { data: me } = useApi<{ vertical?: string }>("/auth/me");
  const { data: settings } = useApi<{ timezone?: string }>("/settings");
  const leads = data?.items ?? [];
  const TYPES = verticalDef(me?.vertical).apptTypes;
  const [tz, setTz] = useState<string>("");
  const storeTz = tz || settings?.timezone || "";

  const [type, setType] = useState("TEST_DRIVE");
  const [leadId, setLeadId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startT, setStartT] = useState("14:00");
  const [endT, setEndT] = useState("14:45");
  const [location, setLocation] = useState("Showroom");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // reschedule mode → load the appointment and prefill
  useEffect(() => {
    if (!open || !apptId) return;
    setLoading(true); setErr(null);
    apiFetch<ApptFull>(`/appointments/${apptId}`).then((a) => {
      setType(a.type); setLeadId(a.leadId ?? "");
      setDate(a.date); setStartT(a.startTime); setEndT(a.endTime); setTz(a.tz);
      setLocation(a.location ?? ""); setNote(a.notes ?? "");
    }).catch(() => setErr("Could not load this appointment.")).finally(() => setLoading(false));
  }, [open, apptId]);

  const effectiveLead = leadId || leads[0]?.id || "";
  const onStart = (v: string) => { setStartT(v); if (!endT || endT <= v) setEndT(addMinutes(v, 45)); };

  const save = async () => {
    setErr(null);
    if (!editing && !effectiveLead) { setErr("Add a lead first — appointments are booked against a lead."); return; }
    if (!date || !startT || !endT) { setErr("Choose a date, start and end time."); return; }
    if (endT <= startT) { setErr("End time must be after the start time."); return; }
    setBusy(true);
    // send wall-clock times — the server interprets them in the store's timezone
    const body = { type, date, startTime: startT, endTime: endT, location, notes: note };
    try {
      if (editing) {
        await apiFetch(`/appointments/${apptId}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/appointments", { method: "POST", body: JSON.stringify({ leadId: effectiveLead, ...body }) });
      }
      onCreated?.();
      onClose();
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Could not save the appointment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Reschedule appointment" : "New appointment"} subtitle={editing ? "Update the time or details of this visit." : "Schedule a visit against a lead."}
      footer={<>
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        <button onClick={save} disabled={busy || loading} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : editing ? "Save changes" : "Create appointment"}</button>
      </>}>
      <div className="space-y-5">
        <Labeled label="Appointment type"><select value={type} onChange={(e) => setType(e.target.value)} className={cn(fieldCls, "px-2.5")}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Labeled>
        <Labeled label="Lead / customer">
          {leads.length === 0
            ? <p className="rounded-md border border-dashed border-n300 px-3 py-2.5 text-[12.5px] text-n500">No leads yet — add a lead first, then book.</p>
            : <select value={effectiveLead} onChange={(e) => setLeadId(e.target.value)} disabled={editing} className={cn(fieldCls, "px-2.5 disabled:bg-n50 disabled:text-n500")}>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>}
        </Labeled>

        <div className="border-t border-n200" />

        <div className="grid grid-cols-3 gap-3">
          <Labeled label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
          <Labeled label="Start"><input type="time" value={startT} onChange={(e) => onStart(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
          <Labeled label="End"><input type="time" value={endT} onChange={(e) => setEndT(e.target.value)} className={cn(fieldCls, "tnum")} /></Labeled>
        </div>
        <p className="-mt-2 text-[11.5px] text-n400">{fmtTime(startT)} – {fmtTime(endT)}{storeTz && ` · ${storeTz.split("/").pop()?.replace(/_/g, " ")} time`}</p>

        <div className="border-t border-n200" />

        <Labeled label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} className={fieldCls} /></Labeled>
        <Labeled label="Note"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional note for the team…" className={cn(fieldCls, "h-auto resize-none py-2")} /></Labeled>

        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
        <div className="rounded-lg bg-brand-soft/50 px-3 py-2.5 text-[12.5px] text-n600">Krakd AI will text a reminder 1 hour before and confirm the morning of.</div>
      </div>
    </Sheet>
  );
}
