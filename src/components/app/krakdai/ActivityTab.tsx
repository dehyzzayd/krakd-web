"use client";

import { cn } from "@/lib/cn";
import { useApi } from "@/lib/useApi";
import { MessageSquare, UserPlus, CalendarCheck, Percent, Flag } from "lucide-react";

type Stats = {
  conversations: number; leadsCaptured: number; appointments: number; captureRate: number; escalations: number;
  actions: { kind: string; title: string; detail: string; time: string }[];
  escalationList: { reason: string; tone: string; who: string; note: string; time: string }[];
};

function Kpi({ icon: Icon, label, value, sub, tone = "default" }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string | number; sub: string; tone?: string }) {
  const accent = tone === "danger" ? "text-err" : tone === "success" ? "text-ok" : "text-n300";
  return (
    <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
      <div className="flex items-center justify-between"><p className="truncate text-[11.5px] font-medium text-n500">{label}</p><Icon className={cn("h-4 w-4 shrink-0", accent)} strokeWidth={2.25} /></div>
      <p className="tnum mt-2.5 text-[25px] font-semibold leading-none tracking-[-0.03em] text-n900">{value}</p>
      <p className="mt-1 truncate text-[12px] text-n400">{sub}</p>
    </div>
  );
}

export function ActivityTab() {
  const { data } = useApi<Stats>("/ai/stats");
  const s = data;

  return (
    <div className="space-y-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <Kpi icon={MessageSquare} label="Conversations" value={s?.conversations ?? 0} sub="all time" />
        <Kpi icon={UserPlus} label="Leads captured" value={s?.leadsCaptured ?? 0} sub={`${s?.captureRate ?? 0}% of leads`} tone="success" />
        <Kpi icon={CalendarCheck} label="Appointments" value={s?.appointments ?? 0} sub="booked by AI" tone="success" />
        <Kpi icon={Flag} label="Escalations" value={s?.escalations ?? 0} sub="flagged for a human" tone="danger" />
        <Kpi icon={Percent} label="Capture rate" value={`${s?.captureRate ?? 0}%`} sub="leads → captured" tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
          <h3 className="mb-3 text-[14px] font-semibold text-n900">Recent AI actions</h3>
          {(!s || s.actions.length === 0)
            ? <p className="py-6 text-center text-[12.5px] text-n500">No AI activity yet. As leads come in, every text, booking and handoff Krakd AI makes shows up here.</p>
            : <div className="space-y-3">{s.actions.map((a, i) => <div key={i} className="flex gap-2.5"><div className="min-w-0 flex-1 leading-tight"><p className="text-[12.5px] font-medium text-n900">{a.title}</p><p className="truncate text-[11.5px] text-n500">{a.detail}</p></div><span className="shrink-0 text-[11px] text-n400">{a.time}</span></div>)}</div>}
        </div>

        <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
          <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-n900"><Flag className="h-3.5 w-3.5 text-err" />Needs a human</h3></div>
          {(!s || s.escalationList.length === 0)
            ? <p className="py-6 text-center text-[12.5px] text-n500">Nothing needs you right now. Krakd AI flags complaints and hot leads here.</p>
            : <div className="space-y-2">{s.escalationList.map((e, i) => <div key={i} className="rounded-lg border border-n200 p-2.5"><p className="text-[11.5px] font-semibold text-n900">{e.reason}</p><p className="mt-0.5 text-[12px] text-n700">{e.note}</p></div>)}</div>}
        </div>
      </div>
    </div>
  );
}
