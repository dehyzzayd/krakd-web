"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { useApi } from "@/lib/useApi";
import { apiFetch, ApiError } from "@/lib/api";
import { Sheet } from "@/components/app/Sheet";
import { DealSheet } from "@/components/app/DealSheet";
import { vertical as verticalDef } from "@/components/site/verticals";
import { Phone, MessageSquare, Calendar, StickyNote, Pencil, Sparkles, Check, Copy, CircleDollarSign, ChevronRight, Flag, ShieldCheck } from "lucide-react";
import { ConsentSheet } from "@/components/app/ConsentSheet";
import { useToast } from "@/components/app/Toast";

type Activity = { id: string; type: string; kind: string; content: string; actor: string; when: string };
type Lead = {
  id: string; name: string; phone: string; email: string; source: string; status: string; statusLabel: string;
  temperature: string; score: number; vehicle: string; assigned: string; hasTradeIn: boolean; financing: boolean; createdAgo: string;
  nextAction: string | null; nextActionAt: string | null; creditAppToken: string | null;
  creditApps: { id: string; status: string; when: string }[];
  activities: Activity[]; appointments: { id: string; type: string; status: string; start: string }[];
  calls: { id: string; direction: string; durationSec: number; recordingUrl: string | null; transcript: string | null; analysis: Record<string, unknown> | null; transcriptStatus: string; when: string }[];
};

const PIPELINE = ["NEW", "CONTACTED", "QUALIFIED", "APPOINTMENT", "SOLD"] as const;
const PIPE_LABEL: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", APPOINTMENT: "Appointment", SOLD: "Sold" };
const CREDIT_TONE: Record<string, string> = { NEW: "bg-brand-soft text-brand", REVIEWING: "bg-warn-soft text-warn", APPROVED: "bg-ok-soft text-ok", DECLINED: "bg-err-soft text-err" };

/** Deterministic deal summary from the lead's real signals — no LLM required. */
function summarize(l: Lead): string {
  const p: string[] = [];
  p.push(`${l.name.split(" ")[0]} came in via ${l.source}${l.vehicle !== "—" ? `, eyeing the ${l.vehicle}` : ""}.`);
  p.push(`They're ${l.statusLabel.toLowerCase()} and running ${l.temperature.toLowerCase()}.`);
  if (l.financing) p.push("Looking for financing.");
  if (l.hasTradeIn) p.push("Has a trade-in to appraise.");
  if (l.creditApps.length) p.push(`Credit app is ${l.creditApps[0].status.toLowerCase()}.`);
  const upcoming = l.appointments.find((a) => new Date(a.start).getTime() > Date.now());
  if (upcoming) p.push(`Appointment ${new Date(upcoming.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}.`);
  if (l.activities[0]) p.push(`Last touch: ${l.activities[0].type.toLowerCase()} ${l.activities[0].when}.`);
  const rec = l.status === "NEW" ? "Call now while it's hot." : l.status === "APPOINTMENT" ? "Confirm the appointment and prep the unit." : l.financing && !l.creditApps.length ? "Send the credit app link." : l.status === "SOLD" ? "Handle delivery + follow-up." : "Follow up to keep it moving.";
  p.push(`Next best step — ${rec}`);
  return p.join(" ");
}

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];
const TEMP: Record<string, string> = { HOT: "bg-err-soft text-err", WARM: "bg-warn-soft text-warn", COLD: "bg-brand-soft text-brand" };
const STATUSES = [["NEW", "New"], ["CONTACTED", "Contacted"], ["QUALIFIED", "Qualified"], ["APPOINTMENT", "Appt set"], ["SOLD", "Sold"], ["LOST", "Lost"]] as const;
const field = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function CancelBtn({ onClose }: { onClose: () => void }) {
  return <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>;
}

export function LeadDetailClient({ id }: { id: string }) {
  const { data: l, loading, error, reload } = useApi<Lead>(`/leads/${id}`);
  // deep-link from the leads list: ?action=message / ?action=appt opens that action straight away
  const initialAction = useSearchParams().get("action");
  const [modal, setModal] = useState<null | "note" | "message" | "appt" | "edit" | "deal" | "consent">(
    initialAction === "message" ? "message" : initialAction === "appt" ? "appt" : initialAction === "deal" ? "deal" : null,
  );
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try { await apiFetch(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }); toast.success("Lead updated"); reload(); }
    catch (e) { toast.error(e instanceof ApiError ? e.message : "Update failed."); }
    finally { setBusy(false); }
  };

  if (loading) return <><Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: "Lead" }]} /><div className="p-12 text-center text-[13px] text-n400">Loading…</div></>;
  if (error || !l) return <><Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: "Not found" }]} /><div className="p-16 text-center"><p className="text-[14px] font-semibold text-n800">Lead not found</p><Link href="/dashboard/leads" className="mt-3 inline-block text-[13px] font-semibold text-brand">← Back to leads</Link></div></>;

  const actions = [
    { Icon: Phone, label: "Call", href: l.phone ? `tel:${l.phone}` : undefined, onClick: () => l.phone && logQuick("CALL", `Called ${l.phone}`) },
    { Icon: MessageSquare, label: "Message", onClick: () => setModal("message") },
    { Icon: StickyNote, label: "Note", onClick: () => setModal("note") },
    { Icon: Calendar, label: "Book appt", onClick: () => setModal("appt") },
    { Icon: CircleDollarSign, label: "Deal", onClick: () => setModal("deal") },
    { Icon: ShieldCheck, label: "Consent", onClick: () => setModal("consent") },
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
            {/* deal pipeline path */}
            <div className="mt-4 border-t border-n100 pt-4"><Pipeline l={l} onSet={(s) => patch({ status: s })} busy={busy} /></div>
          </div>

          {/* AI summary */}
          <AiSummary l={l} />

        <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
          <h3 className="text-[14px] font-semibold text-n900">Activity</h3>
          <Composer id={id} lead={l} onDone={reload} />
          {l.activities.length === 0
            ? <p className="mt-4 text-[12.5px] text-n500">No activity yet. Log a note, call or text and it shows up here.</p>
            : (
              <div className="mt-4 space-y-3">
                {l.activities.map((a) => (
                  <div key={a.id} className="flex gap-2.5 border-t border-n100 pt-3 first:border-t-0 first:pt-0">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: a.kind === "CALL" ? "#c08532" : a.kind === "SMS" || a.kind === "EMAIL" ? "#1f8a65" : "#2b6ba4" }} />
                    <div className="min-w-0 flex-1"><p className="text-[12.5px] font-medium text-n900">{a.type}{a.actor === "AI" ? " · Krakd AI" : a.actor === "SYSTEM" ? " · System" : ""}</p>{a.content && <p className="text-[12px] text-n600">{a.content}</p>}</div>
                    <span className="shrink-0 text-[11px] text-n400">{a.when}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
        </div>

        <div className="space-y-4">
          <NextActionCard l={l} id={id} onDone={reload} />
          <CreditCard l={l} />

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

          {l.calls.length > 0 && (
            <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
              <h3 className="text-[13px] font-semibold text-n900">Calls</h3>
              <div className="mt-3 space-y-3">{l.calls.map((c) => <CallItem key={c.id} c={c} onReload={reload} />)}</div>
            </div>
          )}
        </div>
      </div>

      {modal === "note" && <NoteModal id={id} onClose={() => setModal(null)} onDone={reload} />}
      {modal === "message" && <MessageModal id={id} lead={l} onClose={() => setModal(null)} onDone={reload} onRecordConsent={() => setModal("consent")} />}
      {modal === "appt" && <ApptModal id={id} onClose={() => setModal(null)} onDone={reload} />}
      {modal === "edit" && <EditModal id={id} lead={l} onClose={() => setModal(null)} onDone={reload} />}
      {modal === "deal" && <DealSheet id={id} leadName={l.name} onClose={() => setModal(null)} onSaved={reload} />}
      {modal === "consent" && <ConsentSheet id={id} leadName={l.name} onClose={() => setModal(null)} onSaved={reload} />}
    </div>
  );
}

function Pipeline({ l, onSet, busy }: { l: Lead; onSet: (s: string) => void; busy: boolean }) {
  const lost = l.status === "LOST";
  const idx = PIPELINE.indexOf(l.status as (typeof PIPELINE)[number]);
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-n500">Deal pipeline</p>
        {!lost && l.status !== "SOLD" && <button onClick={() => onSet("LOST")} disabled={busy} className="inline-flex items-center gap-1 text-[11.5px] font-medium text-n400 transition hover:text-err"><Flag className="h-3 w-3" />Mark lost</button>}
      </div>
      {lost ? (
        <div className="flex items-center justify-between rounded-lg bg-err-soft px-3 py-2 text-[12.5px]"><span className="font-semibold text-err">Marked lost</span><button onClick={() => onSet("NEW")} className="text-[12px] font-medium text-n600 hover:text-n900">Reopen</button></div>
      ) : (
        <div className="flex gap-1.5">
          {PIPELINE.map((s, i) => (
            <button key={s} onClick={() => onSet(s)} disabled={busy} className="min-w-0 flex-1 text-left">
              <div className={cn("h-1.5 rounded-full transition", i <= idx ? "bg-brand" : "bg-n200")} />
              <span className={cn("mt-1.5 block truncate text-[10.5px] font-medium transition", i === idx ? "text-n900" : i < idx ? "text-n600" : "text-n400")}>{PIPE_LABEL[s]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AiSummary({ l }: { l: Lead }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-n900"><Sparkles className="h-4 w-4 text-brand" />AI summary</h3>
        {!open && <button onClick={() => setOpen(true)} className="text-[12px] font-semibold text-brand">Summarize</button>}
      </div>
      {open ? <p className="mt-2.5 text-[13px] leading-relaxed text-n700">{summarize(l)}</p> : <p className="mt-2 text-[12px] text-n400">Generate a quick read on where this deal stands.</p>}
    </div>
  );
}

function Composer({ id, lead, onDone }: { id: string; lead: Lead; onDone: () => void }) {
  const [tab, setTab] = useState<"NOTE" | "CALL" | "SMS">("NOTE");
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState("Connected");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (tab !== "CALL" && !text.trim()) return;
    setBusy(true);
    const content = tab === "CALL" ? `Call — ${outcome}${text.trim() ? `: ${text}` : ""}` : tab === "SMS" ? `Text${lead.phone ? ` to ${lead.phone}` : ""}: ${text}` : text;
    try { await apiFetch(`/leads/${id}/activities`, { method: "POST", body: JSON.stringify({ type: tab, content }) }); setText(""); onDone(); } finally { setBusy(false); }
  };
  return (
    <div className="mt-3 rounded-xl border border-n200 p-2.5">
      <div className="mb-2 flex gap-1">
        {([["NOTE", "Note"], ["CALL", "Log call"], ["SMS", "Text"]] as const).map(([v, lbl]) => <button key={v} onClick={() => setTab(v)} className={cn("h-7 rounded-md px-2.5 text-[12px] font-semibold transition", tab === v ? "bg-brand-soft text-brand" : "text-n500 hover:bg-n100")}>{lbl}</button>)}
      </div>
      {tab === "CALL" && <div className="mb-2 flex flex-wrap gap-1.5">{["Connected", "Voicemail", "No answer", "Bad number"].map((o) => <button key={o} onClick={() => setOutcome(o)} className={cn("rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition", outcome === o ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n50")}>{o}</button>)}</div>}
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={tab === "CALL" ? "Add a call note (optional)…" : tab === "SMS" ? "Type your text…" : "Log a note…"} className="w-full resize-none rounded-lg border border-n200 px-2.5 py-2 text-[13px] text-n900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
      <div className="mt-2 flex justify-end"><button onClick={send} disabled={busy || (tab !== "CALL" && !text.trim())} className="btn-brand h-8 rounded-md px-3.5 text-[12.5px] font-semibold disabled:opacity-50">{busy ? "Logging…" : tab === "CALL" ? "Log call" : tab === "SMS" ? "Send & log" : "Add note"}</button></div>
    </div>
  );
}

function NextActionCard({ l, id, onDone }: { l: Lead; id: string; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(l.nextAction ?? "");
  const [date, setDate] = useState(l.nextActionAt ? l.nextActionAt.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const save = async () => { if (!text.trim()) return; setBusy(true); try { await apiFetch(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ nextAction: text.trim(), nextActionAt: date ? new Date(`${date}T09:00`).toISOString() : null }) }); setEditing(false); onDone(); } finally { setBusy(false); } };
  const complete = async () => { setBusy(true); try { await apiFetch(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ nextAction: null, nextActionAt: null }) }); await apiFetch(`/leads/${id}/activities`, { method: "POST", body: JSON.stringify({ type: "NOTE", content: `✓ Completed: ${l.nextAction}` }) }); onDone(); } finally { setBusy(false); } };
  const overdue = l.nextActionAt && new Date(l.nextActionAt).getTime() < Date.now();
  return (
    <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
      <h3 className="text-[13px] font-semibold text-n900">Next action</h3>
      {editing || (!l.nextAction) ? (
        <div className="mt-3 space-y-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Call to confirm test drive" className={field} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          <div className="flex gap-2">
            <button onClick={save} disabled={busy || !text.trim()} className="btn-brand h-9 flex-1 rounded-md text-[12.5px] font-semibold disabled:opacity-50">{busy ? "Saving…" : "Set action"}</button>
            {l.nextAction && <button onClick={() => setEditing(false)} className="h-9 rounded-md border border-n200 px-3 text-[12.5px] font-medium text-n600">Cancel</button>}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-[13px] font-medium text-n900">{l.nextAction}</p>
          {l.nextActionAt && <p className={cn("mt-0.5 text-[12px]", overdue ? "font-semibold text-err" : "text-n500")}>{overdue ? "Overdue · " : "Due "}{new Date(l.nextActionAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={complete} disabled={busy} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-ok-soft px-3 text-[12px] font-semibold text-ok disabled:opacity-50"><Check className="h-3.5 w-3.5" />Mark done</button>
            <button onClick={() => setEditing(true)} className="h-8 rounded-md border border-n200 px-3 text-[12px] font-medium text-n600 hover:bg-n50">Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreditCard({ l }: { l: Lead }) {
  const [copied, setCopied] = useState(false);
  const latest = l.creditApps[0];
  const link = l.creditAppToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/apply/${l.creditAppToken}` : "";
  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-n900"><CircleDollarSign className="h-4 w-4 text-brand" />Credit application</h3>
      {latest ? (
        <div className="mt-3">
          <div className="flex items-center justify-between"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", CREDIT_TONE[latest.status] ?? "bg-n100 text-n600")}>{latest.status[0] + latest.status.slice(1).toLowerCase()}</span><span className="text-[11px] text-n400">{latest.when}</span></div>
          <Link href={`/dashboard/crm/credit/${latest.id}`} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand">View application <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
      ) : link ? (
        <div className="mt-3">
          <p className="text-[12.5px] text-n500">No application yet — send this buyer the secure link.</p>
          <button onClick={copy} className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Link copied" : "Copy credit app link"}</button>
        </div>
      ) : <p className="mt-2 text-[12.5px] text-n500">Set up your form under CRM → Credit applications to share a link.</p>}
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

function CallItem({ c, onReload }: { c: Lead["calls"][number]; onReload: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const a = c.analysis as { summary?: string; nextSteps?: string[] } | null;
  const transcribe = async () => {
    setBusy(true);
    try { await apiFetch(`/calls/${c.id}/transcribe`, { method: "POST", body: "{}" }); toast.success("Transcription started"); onReload(); }
    catch (e) { toast.error(e instanceof ApiError ? e.message : "Could not transcribe."); }
    finally { setBusy(false); }
  };
  return (
    <div className="rounded-lg border border-n200 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold capitalize text-n900">{c.direction} call · {c.durationSec}s</span>
        <span className="text-[11.5px] text-n400">{c.when}</span>
      </div>
      {c.recordingUrl && <audio controls preload="none" src={c.recordingUrl} className="mt-2 h-8 w-full" />}
      {a?.summary && <div className="mt-2 rounded-md bg-brand-soft/40 p-2.5 text-[12px] text-n700"><p className="font-semibold text-brand">AI summary</p><p className="mt-0.5">{a.summary}</p>{a.nextSteps?.length ? <ul className="mt-1 list-disc pl-4 text-n600">{a.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul> : null}</div>}
      {c.transcript && <button onClick={() => setOpen((o) => !o)} className="mt-2 text-[11.5px] font-semibold text-brand">{open ? "Hide" : "Show"} transcript</button>}
      {open && c.transcript && <p className="mt-1 max-h-56 overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-n600">{c.transcript}</p>}
      {c.transcriptStatus === "processing" && <p className="mt-2 text-[11.5px] text-n400">Transcribing…</p>}
      {c.recordingUrl && c.transcriptStatus === "none" && <button onClick={transcribe} disabled={busy} className="mt-2 rounded-md border border-n200 px-2.5 py-1 text-[11.5px] font-semibold text-n700 transition hover:bg-n100 disabled:opacity-60">{busy ? "…" : "Transcribe"}</button>}
      {c.transcriptStatus === "failed" && <button onClick={transcribe} disabled={busy} className="mt-2 rounded-md border border-n200 px-2.5 py-1 text-[11.5px] font-semibold text-err transition hover:bg-err-soft disabled:opacity-60">Retry transcription</button>}
    </div>
  );
}

function MessageModal({ id, lead, onClose, onDone, onRecordConsent }: { id: string; lead: Lead; onClose: () => void; onDone: () => void; onRecordConsent: () => void }) {
  const [channel, setChannel] = useState<"SMS" | "EMAIL">(lead.phone ? "SMS" : "EMAIL");
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const to = channel === "SMS" ? lead.phone : lead.email;
  const save = async () => {
    if (!text.trim() || !to) return;
    setBusy(true); setNote(null); setBlocked(false);
    try {
      const r = await apiFetch<{ sent: boolean; reason: string | null }>(`/leads/${id}/message`, { method: "POST", body: JSON.stringify({ channel, content: text }) });
      if (r.sent) { onDone(); onClose(); return; }
      // couldn't deliver — it's still logged; keep the sheet open and tell the truth
      setNote(`${r.reason ?? "Not connected"} — saved to the timeline, but not delivered yet.`);
      onDone();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Couldn't send.";
      if (e instanceof ApiError && e.status === 403) setBlocked(true);
      setNote(msg);
    } finally { setBusy(false); }
  };
  return (
    <Sheet open onClose={onClose} width="max-w-[440px]" title="Send a message" subtitle="Texts and emails send live, then log to the timeline."
      footer={<><CancelBtn onClose={onClose} /><button onClick={save} disabled={busy || !text.trim() || !to} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Sending…" : "Send & log"}</button></>}>
      <div className="space-y-3">
        <div className="inline-flex rounded-lg border border-n200 bg-white p-0.5">
          {(["SMS", "EMAIL"] as const).map((c) => <button key={c} onClick={() => { setChannel(c); setNote(null); }} className={cn("h-8 rounded-[7px] px-4 text-[12.5px] font-medium", channel === c ? "bg-n100 text-n900" : "text-n600")}>{c === "SMS" ? "Text" : "Email"}</button>)}
        </div>
        <p className="text-[12px] text-n500">To: <span className="font-medium text-n800">{to || "—"}</span></p>
        {!to && <p className="text-[12px] font-medium text-warn">This lead has no {channel === "SMS" ? "phone number" : "email"} on file.</p>}
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={channel === "SMS" ? "Type your text…" : "Type your email…"} className={cn(field, "h-auto resize-none py-2")} />
        {note && <p className="text-[12px] font-medium text-warn">{note}</p>}
        {blocked && <button onClick={onRecordConsent} className="inline-flex items-center gap-1.5 rounded-md border border-brand/30 bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand transition hover:bg-brand-soft/70"><ShieldCheck className="h-3.5 w-3.5" />Record consent</button>}
      </div>
    </Sheet>
  );
}

function ApptModal({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const { data: me } = useApi<{ vertical?: string }>("/auth/me");
  const APPT_TYPES = verticalDef(me?.vertical).apptTypes;
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
        <div><span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-n500">Type</span><select value={type} onChange={(e) => setType(e.target.value)} className={field}>{APPT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
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
