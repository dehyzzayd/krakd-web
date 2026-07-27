"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { useApi } from "@/lib/useApi";
import { apiFetch, ApiError } from "@/lib/api";
import { Sheet } from "@/components/app/Sheet";
import { Phone, MessageSquare, Calendar, StickyNote, Pencil } from "lucide-react";

type Activity = { id: string; type: string; content: string; actor: string; when: string };
type Lead = {
  id: string; name: string; phone: string; email: string; source: string; status: string; statusLabel: string;
  temperature: string; score: number; vehicle: string; assigned: string; hasTradeIn: boolean; financing: boolean; createdAgo: string;
  activities: Activity[]; appointments: { id: string; type: string; status: string; start: string }[];
};

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];
const TEMP: Record<string, string> = { HOT: "bg-err-soft text-err", WARM: "bg-warn-soft text-warn", COLD: "bg-brand-soft text-brand" };
const STATUSES = [["NEW", "New"], ["CONTACTED", "Contacted"], ["QUALIFIED", "Qualified"], ["APPOINTMENT", "Appt set"], ["SOLD", "Sold"], ["LOST", "Lost"]] as const;
const APPT_TYPES = [["TEST_DRIVE", "Test drive"], ["PHONE", "Phone consult"], ["DELIVERY", "Delivery"], ["TRADE_APPRAISAL", "Trade appraisal"], ["SERVICE", "Service"]] as const;
const field = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function CancelBtn({ onClose }: { onClose: () => void }) {
  return <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>;
}

export function LeadDetailClient({ id }: { id: string }) {
  const { data: l, loading, error, reload } = useApi<Lead>(`/leads/${id}`);
  const [modal, setModal] = useState<null | "note" | "message" | "appt" | "edit">(null);
  const [busy, setBusy] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try { await apiFetch(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }); reload(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Update failed."); }
    finally { setBusy(false); }
  };

  if (loading) return <><Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: "Lead" }]} /><div className="p-12 text-center text-[13px] text-n400">Loading…</div></>;
  if (error || !l) return <><Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: "Not found" }]} /><div className="p-16 text-center"><p className="text-[14px] font-semibold text-n800">Lead not found</p><Link href="/dashboard/leads" className="mt-3 inline-block text-[13px] font-semibold text-brand">← Back to leads</Link></div></>;

  const actions = [
    { Icon: Phone, label: "Call", href: l.phone ? `tel:${l.phone}` : undefined, onClick: () => l.phone && logQuick("CALL", `Called ${l.phone}`) },
    { Icon: MessageSquare, label: "Message", onClick: () => setModal("message") },
    { Icon: StickyNote, label: "Note", onClick: () => setModal("note") },
    { Icon: Calendar, label: "Book appt", onClick: () => setModal("appt") },
  ];
  async function logQuick(type: string, content: string) {
    await apiFetch(`/leads/${id}/activities`, { method: "POST", body: JSON.stringify({ type, content }) }).catch(() => {});
    reload();
  }

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: l.name }]} />
      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <div className="flex items-center gap-3.5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-[18px] font-semibold text-white" style={{ background: avatarBg(l.name) }}>{initials(l.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-[20px] font-bold tracking-[-0.02em] text-n900">{l.name}</h1><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", TEMP[l.temperature] ?? "bg-n100 text-n600")}>{l.temperature[0] + l.temperature.slice(1).toLowerCase()}</span></div>
                <p className="text-[12.5px] text-n500">Interested in {l.vehicle} · via {l.source}</p>
              </div>
              <button onClick={() => setModal("edit")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-semibold text-n700 hover:bg-n50"><Pencil className="h-3.5 w-3.5" />Edit</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {actions.map((a, i) => (
                <button key={i} onClick={a.onClick} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-n200 bg-white text-[12.5px] font-semibold text-n700 transition hover:bg-n50">
                  <a.Icon className="h-3.5 w-3.5" />{a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h3 className="text-[14px] font-semibold text-n900">Activity timeline</h3>
            {l.activities.length === 0
              ? <p className="mt-3 text-[12.5px] text-n500">No activity yet. Log a note, message or call and it shows up here.</p>
              : (
                <div className="mt-3 space-y-3">
                  {l.activities.map((a) => (
                    <div key={a.id} className="flex gap-2.5 border-t border-n100 pt-3 first:border-t-0 first:pt-0">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                      <div className="min-w-0 flex-1"><p className="text-[12.5px] font-medium text-n900">{a.type}{a.actor === "AI" ? " · Krakd AI" : ""}</p>{a.content && <p className="text-[12px] text-n600">{a.content}</p>}</div>
                      <span className="shrink-0 text-[11px] text-n400">{a.when}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h3 className="text-[13px] font-semibold text-n900">Lead details</h3>
            <div className="mt-3 space-y-3">
              <div><span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-n500">Status</span>
                <select value={l.status} disabled={busy} onChange={(e) => patch({ status: e.target.value })} className={field}>{STATUSES.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}</select></div>
              <div><span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-n500">Temperature</span>
                <select value={l.temperature} disabled={busy} onChange={(e) => patch({ temperature: e.target.value })} className={field}><option value="HOT">Hot</option><option value="WARM">Warm</option><option value="COLD">Cold</option></select></div>
              <div className="space-y-2.5 border-t border-n100 pt-3 text-[12.5px]">
                {[["Assigned", l.assigned], ["Score", String(l.score)], ["Phone", l.phone || "—"], ["Email", l.email || "—"], ["Source", l.source], ["Trade-in", l.hasTradeIn ? "Yes" : "No"], ["Financing", l.financing ? "Yes" : "No"], ["Added", l.createdAgo]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3"><span className="text-n500">{k}</span><span className="truncate font-medium text-n900">{v}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <div className="flex items-center justify-between"><h3 className="text-[13px] font-semibold text-n900">Appointments</h3><button onClick={() => setModal("appt")} className="text-[12px] font-semibold text-brand">+ Add</button></div>
            {l.appointments.length === 0
              ? <p className="mt-2 text-[12.5px] text-n500">None scheduled yet.</p>
              : <div className="mt-3 space-y-2">{l.appointments.map((a) => <div key={a.id} className="rounded-lg border border-n200 p-2.5 text-[12.5px]"><p className="font-medium capitalize text-n900">{a.type.replace("_", " ").toLowerCase()}</p><p className="tnum text-n500">{new Date(a.start).toLocaleString()}</p></div>)}</div>}
          </div>
        </div>
      </div>

      {modal === "note" && <NoteModal id={id} onClose={() => setModal(null)} onDone={reload} />}
      {modal === "message" && <MessageModal id={id} lead={l} onClose={() => setModal(null)} onDone={reload} />}
      {modal === "appt" && <ApptModal id={id} onClose={() => setModal(null)} onDone={reload} />}
      {modal === "edit" && <EditModal id={id} lead={l} onClose={() => setModal(null)} onDone={reload} />}
    </div>
  );
}

function NoteModal({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const save = async () => { if (!text.trim()) return; setBusy(true); try { await apiFetch(`/leads/${id}/activities`, { method: "POST", body: JSON.stringify({ type: "NOTE", content: text }) }); onDone(); onClose(); } finally { setBusy(false); } };
  return (
    <Sheet open onClose={onClose} width="max-w-[440px]" title="Add a note" subtitle="Logged to this lead's timeline."
      footer={<><CancelBtn onClose={onClose} /><button onClick={save} disabled={busy || !text.trim()} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : "Add note"}</button></>}>
      <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Log a note about this lead…" className={cn(field, "h-auto resize-none py-2")} />
    </Sheet>
  );
}

function MessageModal({ id, lead, onClose, onDone }: { id: string; lead: Lead; onClose: () => void; onDone: () => void }) {
  const [channel, setChannel] = useState<"SMS" | "EMAIL">(lead.phone ? "SMS" : "EMAIL");
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const to = channel === "SMS" ? lead.phone : lead.email;
  const save = async () => { if (!text.trim()) return; setBusy(true); try { await apiFetch(`/leads/${id}/activities`, { method: "POST", body: JSON.stringify({ type: channel, content: `To ${to || "lead"}: ${text}` }) }); onDone(); onClose(); } finally { setBusy(false); } };
  return (
    <Sheet open onClose={onClose} width="max-w-[440px]" title="Send a message" subtitle="Recorded on the lead and in your inbox."
      footer={<><CancelBtn onClose={onClose} /><button onClick={save} disabled={busy || !text.trim()} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Sending…" : "Send & log"}</button></>}>
      <div className="space-y-3">
        <div className="inline-flex rounded-lg border border-n200 bg-white p-0.5">
          {(["SMS", "EMAIL"] as const).map((c) => <button key={c} onClick={() => setChannel(c)} className={cn("h-8 rounded-[7px] px-4 text-[12.5px] font-medium", channel === c ? "bg-n100 text-n900" : "text-n600")}>{c === "SMS" ? "Text" : "Email"}</button>)}
        </div>
        <p className="text-[12px] text-n500">To: <span className="font-medium text-n800">{to || "—"}</span></p>
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={channel === "SMS" ? "Type your text…" : "Type your email…"} className={cn(field, "h-auto resize-none py-2")} />
        <p className="text-[11px] text-n400">Live send hooks up once your number/email channel is connected.</p>
      </div>
    </Sheet>
  );
}

function ApptModal({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState("TEST_DRIVE");
  const [date, setDate] = useState(""); const [time, setTime] = useState("10:00");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    setErr(null);
    if (!date) { setErr("Pick a date."); return; }
    const start = new Date(`${date}T${time}`);
    if (isNaN(start.getTime())) { setErr("Invalid date/time."); return; }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setBusy(true);
    try { await apiFetch(`/appointments`, { method: "POST", body: JSON.stringify({ leadId: id, type, scheduledStart: start.toISOString(), scheduledEnd: end.toISOString() }) }); onDone(); onClose(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not book."); }
    finally { setBusy(false); }
  };
  return (
    <Sheet open onClose={onClose} width="max-w-[440px]" title="Book an appointment" subtitle="Books it and advances the lead."
      footer={<><CancelBtn onClose={onClose} /><button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Booking…" : "Book appointment"}</button></>}>
      <div className="space-y-3">
        <div><span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-n500">Type</span><select value={type} onChange={(e) => setType(e.target.value)} className={field}>{APPT_TYPES.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-n500">Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} /></div>
          <div><span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-n500">Time</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} /></div>
        </div>
        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
      </div>
    </Sheet>
  );
}

function EditModal({ id, lead, onClose, onDone }: { id: string; lead: Lead; onClose: () => void; onDone: () => void }) {
  const [firstName, ...rest] = lead.name.split(" ");
  const [f, setF] = useState({ firstName: firstName ?? "", lastName: rest.join(" "), phone: lead.phone, email: lead.email, source: lead.source === "—" ? "" : lead.source, hasTradeIn: lead.hasTradeIn, financing: lead.financing });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    setErr(null);
    if (!f.firstName.trim()) { setErr("First name is required."); return; }
    setBusy(true);
    try { await apiFetch(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(f) }); onDone(); onClose(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(false); }
  };
  const L = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-1.5"><label className="text-[12px] font-medium text-n700">{label}</label>{children}</div>;
  return (
    <Sheet open onClose={onClose} width="max-w-[440px]" title="Edit lead" subtitle="Update this lead's information."
      footer={<><CancelBtn onClose={onClose} /><button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <L label="First name"><input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} className={field} /></L>
          <L label="Last name"><input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} className={field} /></L>
        </div>
        <L label="Phone"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={field} /></L>
        <L label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} className={field} /></L>
        <L label="Source"><input value={f.source} onChange={(e) => set("source", e.target.value)} className={field} /></L>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 text-[13px] text-n700"><input type="checkbox" checked={f.hasTradeIn} onChange={(e) => set("hasTradeIn", e.target.checked)} />Trade-in</label>
          <label className="flex items-center gap-2 text-[13px] text-n700"><input type="checkbox" checked={f.financing} onChange={(e) => set("financing", e.target.checked)} />Financing</label>
        </div>
        {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
      </div>
    </Sheet>
  );
}
