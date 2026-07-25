"use client";

import Link from "next/link";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, Dot } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { LEADS, STAGES, TEMP_TONE, crmStats, money, type Lead, type Stage } from "@/lib/leads";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#3c7cab", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];

function Score({ n }: { n: number }) {
  const tone = n >= 80 ? "text-ok" : n >= 60 ? "text-warn" : "text-n500";
  return <span className={cn("tnum text-[11.5px] font-semibold", tone)}>{n}</span>;
}

function LeadCard({ l }: { l: Lead }) {
  return (
    <Link href={`/dashboard/leads/${l.id}`} className="block w-full rounded-lg border border-n200 bg-white p-3 text-left transition hover:border-n300 hover:sh-card">
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
    </Link>
  );
}

export default function LeadsPage() {
  const s = crmStats();
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
                  {items.map((l) => <LeadCard key={l.id} l={l} />)}
                  {items.length === 0 && <p className="px-1.5 py-4 text-center text-[12px] text-n400">Nothing here</p>}
                </div>
              </div>
            );
          })}
        </div>
      </AppMain>
    </>
  );
}
