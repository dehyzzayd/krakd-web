"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge, Dot } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { CONVERSATIONS, CHANNEL_LABEL, type Channel } from "@/lib/crm";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#3c7cab", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];
const CH_TONE: Record<Channel, "brand" | "warn" | "ok"> = { sms: "brand", email: "warn", messenger: "ok" };

const FILTERS: { k: "all" | "unread" | Channel; label: string }[] = [
  { k: "all", label: "All" }, { k: "unread", label: "Unread" }, { k: "sms", label: "SMS" }, { k: "email", label: "Email" }, { k: "messenger", label: "Messenger" },
];

export default function InboxPage() {
  const [filter, setFilter] = useState<"all" | "unread" | Channel>("all");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState(CONVERSATIONS[0]?.id);
  const [showLead, setShowLead] = useState(false);

  const list = useMemo(() => CONVERSATIONS.filter((c) => {
    if (filter === "unread" && !c.unread) return false;
    if (filter !== "all" && filter !== "unread" && c.channel !== filter) return false;
    if (q.trim() && !`${c.name} ${c.vehicle} ${c.preview}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [filter, q]);

  const sel = CONVERSATIONS.find((c) => c.id === selId) ?? list[0];

  return (
    <>
      <Topbar title="Inbox" />
      <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
        {/* list */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-n200 bg-n50">
          <div className="border-b border-n200 p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations…" className="h-9 w-full rounded-lg border border-n200 bg-white px-3 text-[13px] outline-none placeholder:text-n400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
            <div className="mt-2 flex gap-1 overflow-x-auto">
              {FILTERS.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} className={cn("h-7 shrink-0 rounded-full px-2.5 text-[12px] font-medium transition", filter === f.k ? "bg-ink text-white" : "bg-white text-n600 ring-1 ring-n200 hover:bg-n100")}>{f.label}</button>)}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.map((c) => (
              <button key={c.id} onClick={() => setSelId(c.id)} className={cn("flex w-full gap-2.5 border-b border-n200 px-3 py-3 text-left transition", sel?.id === c.id ? "bg-white" : "hover:bg-white/60")}>
                <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: avatarBg(c.name) }}>{initials(c.name)}{c.unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-err ring-2 ring-n50" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2"><span className={cn("truncate text-[13px]", c.unread ? "font-semibold text-n900" : "font-medium text-n800")}>{c.name}</span><span className="tnum shrink-0 text-[11px] text-n400">{c.when}</span></span>
                  <span className="mt-0.5 flex items-center gap-1.5"><Badge tone={CH_TONE[c.channel]}>{CHANNEL_LABEL[c.channel]}</Badge><span className="truncate text-[12px] text-n500">{c.preview}</span></span>
                </span>
              </button>
            ))}
            {list.length === 0 && <p className="p-6 text-center text-[13px] text-n400">No conversations</p>}
          </div>
        </aside>

        {/* thread */}
        {sel ? (
          <section className="flex min-w-0 flex-1 flex-col bg-n100/40">
            <div className="flex items-center gap-3 border-b border-n200 bg-n50 px-5 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: avatarBg(sel.name) }}>{initials(sel.name)}</span>
              <div className="mr-auto"><p className="text-[14px] font-semibold text-n900">{sel.name}</p><p className="text-[12px] text-n500">{sel.vehicle} · via {CHANNEL_LABEL[sel.channel]}</p></div>
              <button onClick={() => setShowLead((v) => !v)} className={cn("h-8 rounded-lg border px-3 text-[12.5px] font-semibold transition", showLead ? "border-brand bg-brand-soft text-brand" : "border-n200 bg-white text-n700 hover:bg-n100")}>{showLead ? "Hide lead" : "See lead"}</button>
            </div>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-5">
              {sel.messages.map((m, i) => (
                <div key={i} className={cn("flex", m.from === "lead" ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[62%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug", m.from === "lead" ? "rounded-bl-sm bg-white text-n800 ring-1 ring-n200" : m.from === "ai" ? "rounded-br-sm bg-brand text-white" : "rounded-br-sm bg-n800 text-white")}>
                    {m.from !== "lead" && <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-70">{m.from === "ai" ? "Krakd AI" : "You"}</span>}
                    {m.text}<span className="mt-1 block text-[10px] opacity-60">{m.when}</span>
                  </div>
                </div>
              ))}
              {sel.unread && <div className="flex items-center gap-2 text-[11.5px] text-brand"><Dot tone="brand" />Krakd AI is drafting a reply…</div>}
            </div>
            <div className="border-t border-n200 bg-n50 p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-n200 bg-white p-2">
                <textarea rows={1} placeholder={`Reply via ${CHANNEL_LABEL[sel.channel]}…`} className="max-h-28 min-h-[24px] flex-1 resize-none bg-transparent px-1.5 py-1 text-[13px] outline-none placeholder:text-n400" />
                <button className="h-8 rounded-lg bg-n100 px-3 text-[12.5px] font-semibold text-n600 transition hover:bg-n200">AI reply</button>
                <button className="h-8 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">Send</button>
              </div>
            </div>
          </section>
        ) : <section className="flex-1 bg-n100/40" />}

        {/* context — hidden until "See lead" */}
        {sel && showLead && (
          <aside className="flex w-[300px] shrink-0 flex-col border-l border-n200 bg-n50">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full text-[16px] font-semibold text-white" style={{ background: avatarBg(sel.name) }}>{initials(sel.name)}</span>
                <p className="mt-2 text-[14px] font-semibold text-n900">{sel.name}</p>
                <p className="text-[12px] text-n500">Lead · {sel.vehicle}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Call", "Text", "Email", "Book"].map((a) => <button key={a} className="h-9 rounded-lg border border-n200 bg-white text-[12.5px] font-semibold text-n700 transition hover:bg-n100">{a}</button>)}
              </div>
              <div className="mt-4 rounded-lg border border-n200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-n500">Vehicle of interest</p>
                <p className="mt-1 text-[13px] font-semibold text-n900">{sel.vehicle}</p>
              </div>
              <div className="mt-3 rounded-lg bg-brand-soft p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-brand"><Dot tone="brand" />AI summary</p>
                <p className="mt-1.5 text-[12.5px] leading-snug text-n800">Actively shopping the {sel.vehicle.split(" ").slice(1).join(" ")}. Responsive, asking about {sel.channel === "sms" ? "financing & trade" : "availability"}. Book the visit.</p>
              </div>
              <Link href={`/dashboard/leads/${sel.leadId}`} className="mt-3 block rounded-lg bg-ink py-2.5 text-center text-[13px] font-semibold text-white transition hover:bg-black">Open full lead workspace</Link>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
