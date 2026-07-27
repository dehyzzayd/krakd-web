"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { MessageSquare, Send, ExternalLink } from "lucide-react";

type Convo = { leadId: string; name: string; phone: string; email: string; vehicle: string; source: string; lastPreview: string; lastAgo: string; lastAt: string };
type Activity = { id: string; type: string; content: string; actor: string; when: string };
type Thread = { id: string; name: string; phone: string; email: string; vehicle: string; statusLabel: string; activities: Activity[] };

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];

export default function InboxPage() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [channel, setChannel] = useState<"SMS" | "EMAIL">("SMS");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const loadConvos = useCallback(() => apiFetch<{ items: Convo[] }>("/inbox").then((r) => { setConvos(r.items ?? []); setSel((s) => s ?? r.items?.[0]?.leadId ?? null); }).catch(() => setConvos([])), []);
  useEffect(() => { loadConvos(); }, [loadConvos]);

  const loadThread = useCallback((id: string) => apiFetch<Thread>(`/leads/${id}`).then(setThread).catch(() => setThread(null)), []);
  useEffect(() => { if (sel) loadThread(sel); }, [sel, loadThread]);

  const send = async () => {
    if (!sel || !text.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/leads/${sel}/activities`, { method: "POST", body: JSON.stringify({ type: channel, content: text.trim() }) });
      setText(""); await loadThread(sel); loadConvos();
    } finally { setSending(false); }
  };

  const filtered = convos.filter((c) => !q || `${c.name} ${c.vehicle} ${c.phone} ${c.email}`.toLowerCase().includes(q.toLowerCase()));
  const msgs = thread ? [...thread.activities].reverse() : [];

  return (
    <>
      <Topbar title="Inbox" />
      <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
        {/* conversation list */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-n200 bg-n50">
          <div className="border-b border-n200 p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations…" className="h-9 w-full rounded-lg border border-n200 bg-white px-3 text-[13px] outline-none placeholder:text-n400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="grid h-full place-items-center p-6 text-center"><div><p className="text-[13px] font-semibold text-n800">No conversations yet</p><p className="mt-1 text-[12px] text-n500">Leads and their messages land here.</p></div></div>
            ) : filtered.map((c) => (
              <button key={c.leadId} onClick={() => setSel(c.leadId)} className={cn("flex w-full items-start gap-2.5 border-b border-n200/70 px-3 py-3 text-left transition hover:bg-n100", sel === c.leadId && "bg-white")}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: avatarBg(c.name) }}>{initials(c.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2"><span className="truncate text-[13px] font-semibold text-n900">{c.name}</span><span className="shrink-0 text-[11px] text-n400">{c.lastAgo}</span></span>
                  <span className="mt-0.5 block truncate text-[12px] text-n500">{c.lastPreview}</span>
                  {c.vehicle && <span className="mt-0.5 block truncate text-[11px] text-n400">{c.vehicle}</span>}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* thread */}
        {!thread ? (
          <div className="grid flex-1 place-items-center bg-white">
            <div className="max-w-[36ch] text-center">
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><MessageSquare className="h-6 w-6" /></span>
              <p className="text-[15px] font-semibold text-n900">Your unified inbox</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-n500">Every message on a lead — text, email, notes and Krakd AI — in one thread. Pick a conversation to start.</p>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col bg-white">
            <div className="flex items-center gap-3 border-b border-n200 px-5 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: avatarBg(thread.name) }}>{initials(thread.name)}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold text-n900">{thread.name}</p><p className="truncate text-[12px] text-n500">{[thread.phone, thread.email, thread.vehicle].filter(Boolean).join(" · ") || thread.statusLabel}</p></div>
              <Link href={`/dashboard/leads/${thread.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12px] font-semibold text-n700 hover:bg-n50">Open lead<ExternalLink className="h-3.5 w-3.5" /></Link>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {msgs.length === 0 ? <p className="py-10 text-center text-[12.5px] text-n500">No messages yet. Send the first one below.</p>
                : msgs.map((a) => {
                  const mine = a.actor === "USER";
                  return (
                    <div key={a.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[76%] rounded-2xl px-3.5 py-2", mine ? "bg-brand text-white" : "bg-n100 text-n900")}>
                        <p className={cn("text-[10.5px] font-semibold uppercase tracking-wide", mine ? "text-white/70" : "text-n400")}>{a.type}{a.actor === "AI" ? " · Krakd AI" : ""}</p>
                        <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-snug">{a.content || "—"}</p>
                        <p className={cn("mt-1 text-[10.5px]", mine ? "text-white/70" : "text-n400")}>{a.when}</p>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="border-t border-n200 p-3">
              <div className="mb-2 inline-flex rounded-lg border border-n200 bg-white p-0.5">
                {(["SMS", "EMAIL"] as const).map((c) => <button key={c} onClick={() => setChannel(c)} className={cn("h-7 rounded-[7px] px-3 text-[12px] font-medium", channel === c ? "bg-n100 text-n900" : "text-n600")}>{c === "SMS" ? "Text" : "Email"}</button>)}
              </div>
              <div className="flex items-end gap-2">
                <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} rows={2} placeholder={`Write a ${channel === "SMS" ? "text" : "email"}…  (⌘↵ to send)`} className="min-h-[42px] flex-1 resize-none rounded-lg border border-n200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
                <button onClick={send} disabled={sending || !text.trim()} className="btn-brand grid h-[42px] w-[42px] shrink-0 place-items-center rounded-lg disabled:opacity-60"><Send className="h-4 w-4" /></button>
              </div>
              <p className="mt-1.5 text-[11px] text-n400">Logged to the lead. Live send activates once your number/email channel is connected.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
