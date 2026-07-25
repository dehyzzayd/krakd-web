"use client";

import Link from "next/link";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, Badge, Dot, type Tone } from "@/components/app/AppKit";
import { APPOINTMENTS, apptStats } from "@/lib/crm";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#3c7cab", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];
const ST_TONE: Record<string, Tone> = { confirmed: "ok", scheduled: "brand", completed: "neutral", no_show: "err", cancelled: "neutral" };
const ST_LABEL: Record<string, string> = { confirmed: "Confirmed", scheduled: "Scheduled", completed: "Completed", no_show: "No-show", cancelled: "Cancelled" };
const DAYS_ORDER = ["Today", "Tomorrow", "Thu · Jul 27", "Fri · Jul 28", "Sat · Jul 29"];

export default function AppointmentsPage() {
  const s = apptStats();
  const grouped = DAYS_ORDER.map((d) => ({ day: d, items: APPOINTMENTS.filter((a) => a.day === d).sort((x, y) => x.time.localeCompare(y.time)) })).filter((g) => g.items.length);
  const apptDays = new Set([26, 27, 28, 29]); // demo month markers

  return (
    <>
      <Topbar title="Calendar" action={{ label: "New appointment" }} />
      <AppMain>
        <div className="grid grid-cols-3 gap-3">
          {[{ l: "Today", v: s.today }, { l: "This week", v: s.week }, { l: "Confirmed", v: s.confirmed }].map((k) => (
            <Card key={k.l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{k.l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{k.v}</p></Card>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* agenda */}
          <div className="space-y-4 lg:col-span-2">
            {grouped.map((g) => (
              <div key={g.day}>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-n500">{g.day}</p>
                <div className="space-y-2">
                  {g.items.map((a) => (
                    <Link key={a.id} href={`/dashboard/leads/${a.leadId}`}>
                      <Card className="flex items-center gap-3 p-3.5 transition hover:sh-raised">
                        <div className="w-16 shrink-0 text-center"><p className="tnum text-[13px] font-semibold text-n900">{a.time.split(" ")[0]}</p><p className="text-[10.5px] text-n500">{a.time.split(" ")[1]}</p></div>
                        <span className="h-10 w-px bg-n200" />
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: avatarBg(a.name) }}>{initials(a.name)}</span>
                        <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold text-n900">{a.type} · {a.name}</p><p className="truncate text-[12px] text-n500">{a.vehicle} · with {a.owner}</p></div>
                        <Badge tone={ST_TONE[a.status]}><Dot tone={ST_TONE[a.status]} />{ST_LABEL[a.status]}</Badge>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* month */}
          <Card className="h-max p-4">
            <div className="mb-3 flex items-center justify-between"><p className="text-[13.5px] font-semibold text-n900">July 2026</p><div className="flex gap-1"><button className="grid h-7 w-7 place-items-center rounded-lg text-n500 hover:bg-n100">‹</button><button className="grid h-7 w-7 place-items-center rounded-lg text-n500 hover:bg-n100">›</button></div></div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] text-n400">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                const has = apptDays.has(d);
                const today = d === 25;
                return <div key={d} className={`relative grid h-8 place-items-center rounded-md text-[12px] ${today ? "bg-brand font-semibold text-white" : has ? "font-medium text-n800 hover:bg-n100" : "text-n500 hover:bg-n100"}`}>{d}{has && !today && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand" />}</div>;
              })}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-n200 pt-3 text-[12px]">
              {[["Confirmed", "ok"], ["Scheduled", "brand"]].map(([l, t]) => <div key={l} className="flex items-center gap-2 text-n600"><Dot tone={t as Tone} />{l}</div>)}
            </div>
          </Card>
        </div>
      </AppMain>
    </>
  );
}
