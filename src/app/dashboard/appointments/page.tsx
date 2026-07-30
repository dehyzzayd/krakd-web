"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge, Dot, type Tone } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { EditAppointmentSheet } from "@/components/app/EditAppointmentSheet";
import { useApi } from "@/lib/useApi";

type Appt = { id: string; leadId: string | null; name: string; vehicle: string; type: string; typeKey: string; status: string; time: string; date: number; month: number; year: number; day: string; owner: string };
type ApiAppt = { id: string; leadId: string | null; name: string; vehicle: string; type: string; typeKey: string; statusKey: string; owner: string; start: string };

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#2b6ba4", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][(n.charCodeAt(0) || 0) % 5];
const ST_TONE: Record<string, Tone> = { confirmed: "ok", scheduled: "brand", completed: "neutral", no_show: "err", canceled: "neutral" };
const ST_LABEL: Record<string, string> = { confirmed: "Confirmed", scheduled: "Scheduled", completed: "Completed", no_show: "No-show", canceled: "Canceled" };
const TYPE_TONE: Record<string, string> = { TEST_DRIVE: "bg-brand", DELIVERY: "bg-ok", PHONE: "bg-warn", SERVICE: "bg-n500", TRADE_APPRAISAL: "bg-n500" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const { data, reload } = useApi<{ items: ApiAppt[] }>("/appointments");
  const appts: Appt[] = useMemo(() => (data?.items ?? []).map((a) => {
    const st = new Date(a.start);
    return {
      id: a.id, leadId: a.leadId, name: a.name, vehicle: a.vehicle, type: a.type, typeKey: a.typeKey, status: a.statusKey, owner: a.owner,
      time: st.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      date: st.getDate(), month: st.getMonth(), year: st.getFullYear(),
      day: st.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  }), [data]);

  const now = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const isCurrentMonth = anchor.y === now.getFullYear() && anchor.m === now.getMonth();
  const todayNum = now.getDate();
  const firstWeekday = new Date(anchor.y, anchor.m, 1).getDay();
  const daysInMonth = new Date(anchor.y, anchor.m + 1, 0).getDate();
  const monthLabel = `${MONTHS[anchor.m]} ${anchor.y}`;
  const shiftMonth = (dir: number) => setAnchor((a) => { const d = new Date(a.y, a.m + dir, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const eventsOn = (d: number) => appts.filter((a) => a.date === d && a.month === anchor.m && a.year === anchor.y).sort((a, b) => a.time.localeCompare(b.time));

  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [day, setDay] = useState(() => new Date().getDate());
  const [apptEdit, setApptEdit] = useState<{ appt: null } | null>(null);
  const [sel, setSel] = useState<Appt | null>(null);
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const weekStart = day - new Date(anchor.y, anchor.m, day).getDay();
  const week = Array.from({ length: 7 }, (_, i) => weekStart + i); // day-numbers; out-of-range shown blank
  const isToday = (d: number) => isCurrentMonth && d === todayNum;

  return (
    <>
      <Topbar title="Calendar" />
      <div className="w-full px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1"><button onClick={() => shiftMonth(-1)} className="grid h-8 w-8 place-items-center rounded-lg text-n500 hover:bg-n100">‹</button><button onClick={() => shiftMonth(1)} className="grid h-8 w-8 place-items-center rounded-lg text-n500 hover:bg-n100">›</button></div>
          <h2 className="text-[17px] font-semibold text-n900">{view === "day" ? `${MONTHS[anchor.m]} ${day}, ${anchor.y}` : monthLabel}</h2>
          <button className="h-8 rounded-lg border border-[#e4e7ec] bg-white px-3 text-[12.5px] font-medium text-n700 hover:bg-n100" onClick={() => { const d = new Date(); setAnchor({ y: d.getFullYear(), m: d.getMonth() }); setView("day"); setDay(d.getDate()); }}>Today</button>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-[#e4e7ec] bg-white p-0.5">
              {(["month", "week", "day"] as const).map((m) => <button key={m} onClick={() => setView(m)} className={cn("h-8 rounded-[7px] px-3 text-[12.5px] font-medium capitalize transition", view === m ? "bg-n100 text-n900" : "text-n600 hover:text-n900")}>{m}</button>)}
            </div>
            <button onClick={() => setApptEdit({ appt: null })} className="btn-brand h-9 rounded-lg px-3.5 text-[12.5px] font-semibold transition">+ New appointment</button>
          </div>
        </div>

        {/* MONTH — taller cells */}
        {view === "month" && (
          <div className="overflow-hidden rounded-2xl border border-n200 bg-white sh-card">
            <div className="grid grid-cols-7 border-b border-[#e4e7ec] text-center text-[11px] font-medium uppercase tracking-wide text-n500">{WEEKDAYS.map((d) => <div key={d} className="py-2.5">{d}</div>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => (
                <div key={i} className={cn("min-h-[132px] border-b border-r border-[#e4e7ec] p-2 [&:nth-child(7n)]:border-r-0", d === null && "bg-n50/60")}>
                  {d && (<>
                    <button onClick={() => { setView("day"); setDay(d); }} className={cn("mb-1.5 grid h-7 w-7 place-items-center rounded-full text-[12.5px]", isToday(d) ? "bg-brand font-semibold text-white" : "text-n600 hover:bg-n100")}>{d}</button>
                    <div className="space-y-1">
                      {eventsOn(d).slice(0, 3).map((a) => (
                        <button key={a.id} onClick={() => setSel(a)} className="flex w-full items-center gap-1.5 rounded-md bg-n50 px-1.5 py-1 text-left text-[11px] transition hover:bg-n100">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TYPE_TONE[a.typeKey])} /><span className="tnum shrink-0 text-n500">{a.time.split(" ")[0]}</span><span className="truncate font-medium text-n700">{a.name}</span>
                        </button>
                      ))}
                      {eventsOn(d).length > 3 && <button onClick={() => { setView("day"); setDay(d); }} className="px-1.5 text-[11px] font-medium text-brand">+{eventsOn(d).length - 3} more</button>}
                    </div>
                  </>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEEK */}
        {view === "week" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {week.map((d, i) => {
              const inMonth = d >= 1 && d <= daysInMonth;
              return (
              <div key={i} className={cn("min-h-[420px] rounded-xl border bg-white p-2.5 sh-card", inMonth && isToday(d) ? "border-brand" : "border-[#e4e7ec]", !inMonth && "bg-n50/60")}>
                <div className="mb-2 flex items-center justify-between px-1"><span className="text-[11px] font-medium uppercase text-n500">{WEEKDAYS[i]}</span>{inMonth && <span className={cn("tnum grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold", isToday(d) ? "bg-brand text-white" : "text-n800")}>{d}</span>}</div>
                <div className="space-y-1.5">
                  {eventsOn(d).map((a) => (
                    <button key={a.id} onClick={() => setSel(a)} className="block w-full rounded-lg border border-[#e4e7ec] p-2 text-left transition hover:bg-n50">
                      <p className="tnum text-[11px] font-semibold text-n800">{a.time}</p><p className="mt-0.5 truncate text-[11.5px] text-n700">{a.type} · {a.name}</p><span className={cn("mt-1 inline-block h-1.5 w-1.5 rounded-full", TYPE_TONE[a.typeKey])} />
                    </button>
                  ))}
                  {eventsOn(d).length === 0 && <p className="py-2 text-center text-[11px] text-n300">—</p>}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* DAY */}
        {view === "day" && (
          <div className="mx-auto max-w-[760px]">
            <div className="mb-3 flex items-center gap-2"><button onClick={() => setDay((d) => Math.max(1, d - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4e7ec] bg-white text-n500 hover:bg-n100">‹</button><p className="text-[14px] font-semibold text-n900">{WEEKDAYS[new Date(anchor.y, anchor.m, day).getDay()]}, {MONTHS[anchor.m]} {day}</p><button onClick={() => setDay((d) => Math.min(daysInMonth, d + 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4e7ec] bg-white text-n500 hover:bg-n100">›</button></div>
            <div className="space-y-2">
              {eventsOn(day).length ? eventsOn(day).map((a) => (
                <button key={a.id} onClick={() => setSel(a)} className="flex w-full items-center gap-3 rounded-2xl border border-n200 bg-white p-4 text-left sh-card transition hover:sh-raised">
                  <div className="w-16 shrink-0 text-center"><p className="tnum text-[13px] font-semibold text-n900">{a.time.split(" ")[0]}</p><p className="text-[10.5px] text-n500">{a.time.split(" ")[1]}</p></div>
                  <span className="h-9 w-px bg-n200" />
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: avatarBg(a.name) }}>{initials(a.name)}</span>
                  <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-n900">{a.type} · {a.name}</p><p className="truncate text-[11.5px] text-n500">{a.vehicle} · {a.owner}</p></div>
                  <Badge tone={ST_TONE[a.status]}><Dot tone={ST_TONE[a.status]} />{ST_LABEL[a.status]}</Badge>
                </button>
              )) : <div className="rounded-xl border border-dashed border-n200 py-12 text-center text-[13px] text-n400">No appointments on this day</div>}
            </div>
          </div>
        )}
      </div>

      {/* appointment details popup */}
      {sel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setSel(null)}>
          <div className="w-full max-w-[420px] rounded-[16px] border border-[#e4e7ec] bg-white sh-raised" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e4e7ec] px-5 py-3.5">
              <div className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", TYPE_TONE[sel.typeKey])} /><h3 className="text-[14px] font-semibold text-n900">{sel.type}</h3></div>
              <button onClick={() => setSel(null)} className="grid h-7 w-7 place-items-center rounded-md text-[15px] text-n500 hover:bg-n100">✕</button>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full text-[13px] font-semibold text-white" style={{ background: avatarBg(sel.name) }}>{initials(sel.name)}</span>
                <div><p className="text-[14px] font-semibold text-n900">{sel.name}</p><p className="text-[12px] text-n500">{sel.vehicle}</p></div>
                <span className="ml-auto"><Badge tone={ST_TONE[sel.status]}><Dot tone={ST_TONE[sel.status]} />{ST_LABEL[sel.status]}</Badge></span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <div><p className="text-[11px] text-n500">When</p><p className="mt-0.5 font-medium text-n900">{sel.day} · {sel.time}</p></div>
                <div><p className="text-[11px] text-n500">With</p><p className="mt-0.5 font-medium text-n900">{sel.owner}</p></div>
              </div>
              <div className="rounded-lg bg-n50 px-3 py-2.5 text-[12.5px] text-n600">Reminder scheduled 1 hour before. AI will confirm the morning of.</div>
            </div>
            <div className="flex items-center gap-2 border-t border-[#e4e7ec] px-5 py-3">
              <button onClick={() => { setApptEdit({ appt: null }); setSel(null); }} className="h-9 rounded-lg px-3 text-[13px] font-medium text-n600 hover:text-n900">Reschedule</button>
              <button className="h-9 rounded-lg px-3 text-[13px] font-medium text-err hover:bg-err-soft">Cancel</button>
              <Link href={`/dashboard/leads/${sel.leadId}`} className="ml-auto h-9 rounded-lg bg-brand px-4 text-[13px] font-semibold leading-9 text-white transition hover:bg-brand-hover">Open lead</Link>
            </div>
          </div>
        </div>
      )}

      {apptEdit && <EditAppointmentSheet open onClose={() => setApptEdit(null)} onCreated={reload} />}
    </>
  );
}
