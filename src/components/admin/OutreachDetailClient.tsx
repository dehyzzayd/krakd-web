"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/api";
import { formatUSPhone } from "@/lib/phone";
import { useToast } from "@/components/app/Toast";
import { OutreachSheet, OUTREACH_STATUSES, type OutreachRecord } from "@/components/admin/OutreachSheet";
import { ArrowLeft, Pencil, Trash2, Phone, Mail, Globe, CalendarClock } from "lucide-react";

type Note = { id: string; type: string; content: string; authorName: string | null; when: string };
type Detail = OutreachRecord & { ownerName: string | null; lastContactedAt: string | null; createdAt: string; notes: Note[] };

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-n100 text-n600", CONTACTED: "bg-brand-soft text-brand", INTERESTED: "bg-brand-soft text-brand",
  DEMO: "bg-warn-soft text-warn", NEGOTIATING: "bg-warn-soft text-warn", WON: "bg-ok-soft text-ok", LOST: "bg-err-soft text-err",
};
const label = (v: string) => OUTREACH_STATUSES.find((s) => s.v === v)?.label ?? v;
const money = (n: number) => `$${n.toLocaleString()}`;
const when = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const NOTE_TYPES = [{ v: "NOTE", label: "Note" }, { v: "CALL", label: "Call" }, { v: "EMAIL", label: "Email" }, { v: "MEETING", label: "Meeting" }];
const dot = (t: string) => (t === "CALL" ? "#c08532" : t === "EMAIL" || t === "MEETING" ? "#1f8a65" : t === "STATUS" ? "#8a5cf6" : "#2b6ba4");

export function OutreachDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data, loading, reload } = useApi<Detail>(`/outreach/${id}`);
  const { data: list } = useApi<{ team: { id: string; name: string }[]; categories: string[] }>("/outreach");
  const [edit, setEdit] = useState(false);
  const [noteType, setNoteType] = useState("NOTE");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <div className="grid min-h-dvh place-items-center text-[13px] text-n400">Loading…</div>;
  if (!data) return <div className="mx-auto max-w-[900px] px-6 py-10 text-[13px] text-n500">Prospect not found. <Link href="/admin/outreach" className="text-brand">Back to outreach</Link></div>;
  const d = data;

  const setStatus = async (status: string) => {
    if (status === d.status) return;
    try { await apiFetch(`/outreach/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); reload(); }
    catch (e) { toast.error(e instanceof ApiError ? e.message : "Couldn't update status."); }
  };
  const logNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try { await apiFetch(`/outreach/${id}/notes`, { method: "POST", body: JSON.stringify({ type: noteType, content: note.trim() }) }); setNote(""); reload(); }
    catch (e) { toast.error(e instanceof ApiError ? e.message : "Couldn't log that."); }
    finally { setBusy(false); }
  };
  const del = async () => {
    if (!confirm(`Delete ${d.company} from outreach? This can't be undone.`)) return;
    try { await apiFetch(`/outreach/${id}`, { method: "DELETE" }); toast.success("Prospect deleted"); router.push("/admin/outreach"); }
    catch { toast.error("Couldn't delete."); }
  };

  const Row = ({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) =>
    <div className="flex items-center gap-2.5 py-1.5 text-[13px] text-n700"><Icon className="h-4 w-4 shrink-0 text-n400" />{children}</div>;

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-6">
      <Link href="/admin/outreach" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-n500 transition hover:text-n900"><ArrowLeft className="h-3.5 w-3.5" />Outreach</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-tight text-n900">{d.company}</h1>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_BADGE[d.status])}>{label(d.status)}</span>
          </div>
          <p className="text-[13px] text-n500">{[d.contactName, d.title].filter(Boolean).join(" · ") || "No contact set"}{d.category ? ` · ${d.category}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEdit(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3.5 text-[12.5px] font-semibold text-n700 transition hover:bg-n50"><Pencil className="h-3.5 w-3.5" />Edit</button>
          <button onClick={del} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-semibold text-err transition hover:bg-err-soft"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* status pipeline */}
      <div className="mt-4 flex flex-wrap gap-1.5 rounded-xl border border-n200 bg-n50 p-1.5">
        {OUTREACH_STATUSES.map((s) => (
          <button key={s.v} onClick={() => setStatus(s.v)} className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition", d.status === s.v ? "bg-white text-n900 sh-card" : "text-n500 hover:text-n900")}>{s.label}</button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* activity timeline */}
        <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
          <h3 className="text-[14px] font-semibold text-n900">Activity</h3>
          <div className="mt-3">
            <div className="flex gap-1.5">
              {NOTE_TYPES.map((t) => <button key={t.v} onClick={() => setNoteType(t.v)} className={cn("rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition", noteType === t.v ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n50")}>{t.label}</button>)}
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={noteType === "CALL" ? "How did the call go?" : noteType === "EMAIL" ? "What did you send?" : noteType === "MEETING" ? "Meeting notes…" : "Log a note about this prospect…"} className="mt-2 w-full rounded-lg border border-n200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            <div className="mt-2 flex justify-end"><button onClick={logNote} disabled={busy || !note.trim()} className="btn-brand h-9 rounded-lg px-4 text-[12.5px] font-semibold disabled:opacity-50">{busy ? "Saving…" : "Log activity"}</button></div>
          </div>
          <div className="mt-4 space-y-3">
            {d.notes.length === 0 ? <p className="text-[12.5px] text-n500">No activity yet. Log a call, email or note and it shows up here.</p>
              : d.notes.map((n) => (
                <div key={n.id} className="flex gap-2.5 border-t border-n100 pt-3 first:border-t-0 first:pt-0">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: dot(n.type) }} />
                  <div className="min-w-0 flex-1"><p className="text-[12.5px] font-medium text-n900">{n.type === "STATUS" ? "Status change" : n.type[0] + n.type.slice(1).toLowerCase()}{n.authorName ? ` · ${n.authorName}` : ""}</p><p className="whitespace-pre-wrap text-[12.5px] text-n600">{n.content}</p></div>
                  <span className="shrink-0 text-[11px] text-n400">{when(n.when)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* details */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <p className="text-[13px] font-semibold text-n900">Contact</p>
            <div className="mt-2 divide-y divide-n100">
              {d.phone && <Row icon={Phone}><a href={`tel:${d.phone}`} className="tnum hover:text-brand">{formatUSPhone(d.phone)}</a></Row>}
              {d.email && <Row icon={Mail}><a href={`mailto:${d.email}`} className="truncate hover:text-brand">{d.email}</a></Row>}
              {d.website && <Row icon={Globe}><a href={d.website.startsWith("http") ? d.website : `https://${d.website}`} target="_blank" rel="noopener" className="truncate hover:text-brand">{d.website}</a></Row>}
              {(d.city || d.state) && <Row icon={CalendarClock}>{[d.city, d.state].filter(Boolean).join(", ")}</Row>}
              {!d.phone && !d.email && !d.website && <p className="py-2 text-[12.5px] text-n400">No contact details yet — hit Edit to add them.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <p className="text-[13px] font-semibold text-n900">Deal</p>
            <dl className="mt-2 space-y-2 text-[12.5px]">
              {([["Owner", d.ownerName || "Unassigned"], ["Category", d.category || "—"], ["Potential", d.value ? `${money(d.value)}/mo` : "—"], ["Source", d.source || "—"], ["Next follow-up", d.nextFollowUpAt ? new Date(d.nextFollowUpAt).toLocaleDateString() : "—"], ["Last contacted", d.lastContactedAt ? new Date(d.lastContactedAt).toLocaleDateString() : "—"]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-n500">{k}</dt><dd className="text-right font-medium text-n900">{v}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <OutreachSheet open={edit} onClose={() => setEdit(false)} onSaved={reload} team={list?.team ?? []} categories={list?.categories ?? []} contact={d} />
    </div>
  );
}
