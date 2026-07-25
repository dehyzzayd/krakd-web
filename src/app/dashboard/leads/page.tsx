"use client";

import { useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, Badge, Dot } from "@/components/app/AppKit";
import { Drawer } from "@/components/app/budget";
import { cn } from "@/lib/cn";
import { LEADS, STAGES, TEMP_TONE, crmStats, money, type Lead, type Stage } from "@/lib/leads";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#3c7cab", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];

function Score({ n }: { n: number }) {
  const tone = n >= 80 ? "text-ok" : n >= 60 ? "text-warn" : "text-n500";
  return <span className={cn("tnum text-[11.5px] font-semibold", tone)}>{n}</span>;
}

function LeadCard({ l, onClick }: { l: Lead; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-lg border border-n200 bg-white p-3 text-left transition hover:border-n300 hover:sh-card">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: avatarBg(l.name) }}>{initials(l.name)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5"><span className="truncate text-[13px] font-semibold text-n900">{l.name}</span><span className={cn("h-1.5 w-1.5 rounded-full", { err: "bg-err", warn: "bg-warn", neutral: "bg-n300" }[TEMP_TONE[l.temp]])} /></span>
          <span className="block truncate text-[11.5px] text-n500">{l.source}</span>
        </span>
        <Score n={l.score} />
      </div>
      <p className="mt-2 truncate text-[12px] text-n700">{l.vehicle}</p>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-n400">
        {l.ai ? <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-1.5 py-0.5 font-medium text-brand"><Dot tone="brand" />AI</span> : <span className="rounded bg-n100 px-1.5 py-0.5 font-medium text-n600">{l.owner}</span>}
        <span className="tnum ml-auto">{l.last}</span>
        {l.needsYou && <span className="rounded bg-err-soft px-1.5 py-0.5 font-semibold text-err">Needs you</span>}
      </div>
    </button>
  );
}

export default function LeadsPage() {
  const s = crmStats();
  const [sel, setSel] = useState<Lead | null>(null);
  const byStage = (st: Stage) => LEADS.filter((l) => l.stage === st);

  return (
    <>
      <Topbar title="Leads" action={{ label: "Add lead" }} />
      <AppMain>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { l: "Active leads", v: String(s.active) }, { l: "Appointments", v: String(s.appts) },
            { l: "AI working", v: String(s.aiWorking) }, { l: "Need your attention", v: String(s.needs), warn: s.needs > 0 },
          ].map((k) => (
            <Card key={k.l} className="p-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{k.l}</p>
              <p className={cn("tnum mt-1.5 text-[20px] font-semibold leading-none", k.warn ? "text-err" : "text-n900")}>{k.v}</p>
            </Card>
          ))}
        </div>

        {/* pipeline board */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((st) => {
            const items = byStage(st.id);
            const total = items.reduce((a, l) => a + l.value, 0);
            return (
              <div key={st.id} className="flex w-[260px] shrink-0 flex-col rounded-[10px] bg-n100/70 p-2">
                <div className="flex items-center justify-between px-1.5 py-1.5">
                  <span className="flex items-center gap-2 text-[12.5px] font-semibold text-n800">{st.label}<span className="tnum rounded-full bg-white px-1.5 text-[11px] font-semibold text-n600 sh-card">{items.length}</span></span>
                  <span className="tnum text-[11px] text-n500">{money(total)}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((l) => <LeadCard key={l.id} l={l} onClick={() => setSel(l)} />)}
                  {items.length === 0 && <p className="px-1.5 py-4 text-center text-[12px] text-n400">Nothing here</p>}
                </div>
              </div>
            );
          })}
        </div>

        <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ""} footer={
          <div className="flex gap-2">
            <button className="h-10 flex-1 rounded-lg border border-n200 bg-white text-[13px] font-semibold text-n700 transition hover:bg-n100">Call</button>
            <button className="h-10 flex-1 rounded-lg border border-n200 bg-white text-[13px] font-semibold text-n700 transition hover:bg-n100">Text</button>
            <button className="h-10 flex-[1.4] rounded-lg bg-brand text-[13px] font-semibold text-white transition hover:bg-brand-hover">Book appointment</button>
          </div>
        }>
          {sel && <LeadDetail l={sel} />}
        </Drawer>
      </AppMain>
    </>
  );
}

function LeadDetail({ l }: { l: Lead }) {
  const stageLabel = STAGES.find((s) => s.id === l.stage)?.label ?? "";
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white" style={{ background: avatarBg(l.name) }}>{initials(l.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[16px] font-semibold text-n900">{l.name}<Badge tone={TEMP_TONE[l.temp]}>{l.temp}</Badge></p>
          <p className="text-[12.5px] text-n500">{l.source} · {stageLabel} · score <span className="tnum font-semibold text-n700">{l.score}</span></p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
        <div className="rounded-lg border border-n200 px-3 py-2"><p className="text-[11px] text-n500">Phone</p><p className="tnum font-medium text-n900">{l.phone}</p></div>
        <div className="rounded-lg border border-n200 px-3 py-2"><p className="text-[11px] text-n500">Est. deal</p><p className="tnum font-medium text-n900">{money(l.value)}</p></div>
      </div>

      <div className="mt-3 rounded-lg border border-n200 p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">Interested in</p>
        <p className="mt-1 text-[13.5px] font-semibold text-n900">{l.vehicle}</p>
      </div>

      <div className="mt-3 rounded-lg bg-brand-soft p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-brand"><Dot tone="brand" />AI · next best action</p>
        <p className="mt-1.5 text-[13px] leading-snug text-n800">{l.next}</p>
      </div>

      <div className="mt-5">
        <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-n500">Conversation</p>
        <div className="space-y-2">
          {l.messages.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "lead" ? "justify-start" : "justify-end")}>
              <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug", m.from === "lead" ? "rounded-bl-sm bg-n100 text-n800" : m.from === "ai" ? "rounded-br-sm bg-brand text-white" : "rounded-br-sm bg-n800 text-white")}>
                {m.from !== "lead" && <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-70">{m.from === "ai" ? "Krakd AI" : "You"}</span>}
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-n500">Activity</p>
        <div className="space-y-3">
          {l.timeline.map((a, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn("mt-1 h-2 w-2 rounded-full", { ai: "bg-brand", you: "bg-n700", lead: "bg-ok", system: "bg-n400" }[a.who])} />
                {i < l.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-n200" />}
              </div>
              <div className="pb-1">
                <p className="text-[12.5px] text-n800">{a.text}</p>
                <p className="mt-0.5 text-[11px] text-n400">{a.who === "ai" ? "Krakd AI" : a.who === "you" ? l.owner : a.who === "lead" ? l.name : "System"} · {a.when}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
