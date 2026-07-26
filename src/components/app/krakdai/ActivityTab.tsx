"use client";

import { cn } from "@/lib/cn";
import { AI_STATS, AI_ACTIONS, AI_ESCALATIONS } from "@/lib/krakdai";
import {
  MessageSquare, UserPlus, CalendarCheck, Car, Repeat, ClipboardList, Flag, Search,
  Percent, Zap, Sparkles, ChevronRight,
} from "lucide-react";

const TOOL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  lead: UserPlus, appointment: CalendarCheck, voi: Car, tradein: Repeat, task: ClipboardList, handoff: Flag, inventory: Search,
};

function Kpi({ label, value, sub, tone = "default" }: { icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string | number; sub: string; tone?: string }) {
  const subTone = tone === "danger" ? "text-err" : tone === "success" ? "text-ok" : "text-n400";
  return (
    <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
      <p className="tnum text-[25px] font-semibold leading-none tracking-[-0.03em] text-n900">{value}</p>
      <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-n500">{label}</p>
      <p className={cn("mt-1 truncate text-[12px]", subTone)}>{sub}</p>
    </div>
  );
}

export function ActivityTab() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <Kpi icon={MessageSquare} label="Conversations" value={AI_STATS.conversations.toLocaleString()} sub="last 30 days" />
        <Kpi icon={UserPlus} label="Leads captured" value={AI_STATS.leadsCaptured} sub={`${AI_STATS.captureRate}% capture rate`} tone="success" />
        <Kpi icon={CalendarCheck} label="Appointments" value={AI_STATS.appointments} sub="test drives set" tone="success" />
        <Kpi icon={Zap} label="Avg response" value={AI_STATS.avgResponse} sub="first reply" />
        <Kpi icon={Flag} label="Escalations" value={AI_STATS.escalations} sub="flagged for a human" tone="danger" />
        <Kpi icon={Percent} label="Cost / lead" value={`$${AI_STATS.costPerLead.toFixed(2)}`} sub="vs $28 industry" tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* activity */}
        <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
          <h3 className="mb-3 text-[14px] font-semibold text-n900">Recent AI actions</h3>
          <div className="space-y-3">
            {AI_ACTIONS.map((a, i) => { const Icon = TOOL_ICON[a.kind] ?? Sparkles; return (
              <div key={i} className="flex gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1 leading-tight"><p className="text-[12.5px] font-medium text-n900">{a.title}</p><p className="truncate text-[11.5px] text-n500">{a.detail}</p></div>
                <span className="shrink-0 text-[11px] text-n400">{a.time}</span>
              </div>
            ); })}
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-n200 py-2 text-[12px] font-semibold text-n700 transition hover:bg-n50">View all activity<ChevronRight className="h-3.5 w-3.5" /></button>
        </div>

        {/* escalations */}
        <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
          <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-n900"><Flag className="h-3.5 w-3.5 text-err" />Needs a human</h3><span className="tnum rounded-full bg-err-soft px-1.5 text-[11px] font-semibold text-err">{AI_ESCALATIONS.length}</span></div>
          <div className="space-y-2">
            {AI_ESCALATIONS.map((e, i) => (
              <div key={i} className="rounded-lg border border-n200 p-2.5">
                <div className="flex items-center justify-between"><span className={cn("text-[11.5px] font-semibold", e.tone === "err" ? "text-err" : e.tone === "warn" ? "text-warn" : "text-brand")}>{e.reason}</span><span className="text-[10.5px] text-n400">{e.time}</span></div>
                <p className="mt-0.5 text-[12px] text-n700">{e.note}</p>
                <p className="mt-0.5 text-[11px] text-n400">{e.who}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
