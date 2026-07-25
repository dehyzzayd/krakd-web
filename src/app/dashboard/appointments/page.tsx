"use client";

import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge, Dot, type Tone } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { APPOINTMENTS, LEADS, type Appt } from "@/lib/crm";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#3c7cab", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];
const ST_TONE: Record<string, Tone> = { confirmed: "ok", scheduled: "brand", completed: "neutral", no_show: "err", cancelled: "neutral" };
const ST_LABEL: Record<string, string> = { confirmed: "Confirmed", scheduled: "Scheduled", completed: "Completed", no_show: "No-show", cancelled: "Cancelled" };
const TYPE_TONE: Record<string, string> = { "Test drive": "bg-brand", Delivery: "bg-ok", "Phone consultation": "bg-warn", Service: "bg-n500" };

const OFFSET = 6; // Jul 1 2026 = Saturday
const TODAY = 25;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const eventsOn = (d: number) => APPOINTMENTS.filter((a) => a.date === d).sort((a, b) => a.time.localeCompare(b.time));

function EventRow({ a }: { a: Appt }) {
  return (
    <Link href={`/dashboard/leads/${a.leadId}`}>
      <div className="flex items-center gap-3 rounded-lg border border-n200 bg-white p-3 transition hover:sh-card">
        <div className="w-16 shrink-0 text-center"><p className="tnum text-[13px] font-semibold text-n900">{a.time.split(" ")[0]}</p><p className="text-[10.5px] text-n500">{a.time.split(" ")[1]}</p></div>
        <span className="h-9 w-px bg-n200" />
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: avatarBg(a.name) }}>{initials(a.name)}</span>
        <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-n900">{a.type} · {a.name}</p><p className="truncate text-[11.5px] text-n500">{a.vehicle} · {a.owner}</p></div>
        <Badge tone={ST_TONE[a.status]}><Dot tone={ST_TONE[a.status]} />{ST_LABEL[a.status]}</Badge>
      </div>
    </Link>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [day, setDay] = useState(TODAY);
  const [modal, setModal] = useState(false);
  const cells = [...Array(OFFSET).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];
  const week = [23, 24, 25, 26, 27, 28, 29];

  return (
    <>
      <Topbar title="Calendar" />
      <div className="w-full px-6 py-5">
        {/* header */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1"><button className="grid h-8 w-8 place-items-center rounded-lg text-n500 hover:bg-n100">‹</button><button className="grid h-8 w-8 place-items-center rounded-lg text-n500 hover:bg-n100">›</button></div>
          <h2 className="text-[17px] font-semibold text-n900">{view === "day" ? `July ${day}, 2026` : "July 2026"}</h2>
          <button className="h-8 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-medium text-n700 hover:bg-n100" onClick={() => { setView("day"); setDay(TODAY); }}>Today</button>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-n200 bg-white p-0.5">
              {(["month", "week", "day"] as const).map((m) => <button key={m} onClick={() => setView(m)} className={cn("h-8 rounded-[7px] px-3 text-[12.5px] font-medium capitalize transition", view === m ? "bg-n100 text-n900" : "text-n600 hover:text-n900")}>{m}</button>)}
            </div>
            <button onClick={() => setModal(true)} className="h-9 rounded-lg bg-brand px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">+ New appointment</button>
          </div>
        </div>

        {/* MONTH */}
        {view === "month" && (
          <div className="overflow-hidden rounded-[10px] border border-n200 bg-white sh-card">
            <div className="grid grid-cols-7 border-b border-n200 text-center text-[11px] font-medium uppercase tracking-wide text-n500">{WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => (
                <div key={i} className={cn("min-h-[104px] border-b border-r border-n200 p-1.5 [&:nth-child(7n)]:border-r-0", d === null && "bg-n50/50")}>
                  {d && (<>
                    <button onClick={() => { setView("day"); setDay(d); }} className={cn("mb-1 grid h-6 w-6 place-items-center rounded-full text-[12px]", d === TODAY ? "bg-brand font-semibold text-white" : "text-n600 hover:bg-n100")}>{d}</button>
                    <div className="space-y-1">
                      {eventsOn(d).slice(0, 2).map((a) => (
                        <Link key={a.id} href={`/dashboard/leads/${a.leadId}`} className="flex items-center gap-1.5 rounded bg-n50 px-1.5 py-1 text-[10.5px] transition hover:bg-n100">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TYPE_TONE[a.type])} /><span className="tnum shrink-0 text-n500">{a.time.split(" ")[0]}</span><span className="truncate font-medium text-n700">{a.name}</span>
                        </Link>
                      ))}
                      {eventsOn(d).length > 2 && <button onClick={() => { setView("day"); setDay(d); }} className="px-1.5 text-[10.5px] font-medium text-brand">+{eventsOn(d).length - 2} more</button>}
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
            {week.map((d) => (
              <div key={d} className={cn("rounded-[10px] border bg-white p-2 sh-card", d === TODAY ? "border-brand" : "border-n200")}>
                <div className="mb-2 flex items-center justify-between px-1"><span className="text-[11px] font-medium uppercase text-n500">{WEEKDAYS[(OFFSET + d - 1) % 7]}</span><span className={cn("tnum grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold", d === TODAY ? "bg-brand text-white" : "text-n800")}>{d}</span></div>
                <div className="space-y-1.5">
                  {eventsOn(d).map((a) => (
                    <Link key={a.id} href={`/dashboard/leads/${a.leadId}`} className="block rounded-lg border border-n200 p-2 transition hover:bg-n50">
                      <p className="tnum text-[11px] font-semibold text-n800">{a.time}</p><p className="mt-0.5 truncate text-[11.5px] text-n700">{a.type} · {a.name}</p><span className={cn("mt-1 inline-block h-1.5 w-1.5 rounded-full", TYPE_TONE[a.type])} />
                    </Link>
                  ))}
                  {eventsOn(d).length === 0 && <p className="py-2 text-center text-[11px] text-n300">—</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DAY */}
        {view === "day" && (
          <div className="mx-auto max-w-[720px]">
            <div className="mb-3 flex items-center gap-2"><button onClick={() => setDay((d) => Math.max(1, d - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-n200 bg-white text-n500 hover:bg-n100">‹</button><p className="text-[14px] font-semibold text-n900">{WEEKDAYS[(OFFSET + day - 1) % 7]}, July {day}</p><button onClick={() => setDay((d) => Math.min(31, d + 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-n200 bg-white text-n500 hover:bg-n100">›</button></div>
            <div className="space-y-2">
              {eventsOn(day).length ? eventsOn(day).map((a) => <EventRow key={a.id} a={a} />) : <div className="rounded-[10px] border border-dashed border-n200 py-12 text-center text-[13px] text-n400">No appointments on this day</div>}
            </div>
          </div>
        )}
      </div>

      {/* add-event modal */}
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="w-full max-w-[460px] rounded-xl border border-n200 bg-white sh-raised" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-n200 px-4 py-3"><h3 className="text-[14px] font-semibold text-n900">New appointment</h3><button onClick={() => setModal(false)} className="grid h-7 w-7 place-items-center rounded-md text-[15px] text-n500 hover:bg-n100">✕</button></div>
            <div className="max-h-[70vh] space-y-3.5 overflow-y-auto p-4">
              <Field label="Appointment type"><select className={sel}><option>Test drive</option><option>Delivery</option><option>Phone consultation</option><option>Service</option></select></Field>
              <Field label="Lead"><select className={sel}>{LEADS.map((l) => <option key={l.id}>{l.name}</option>)}</select></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Date"><input className={inp} defaultValue="07/25/2026" /></Field>
                <Field label="Start"><input className={inp} defaultValue="2:00 PM" /></Field>
                <Field label="End"><input className={inp} defaultValue="2:45 PM" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Assigned to"><select className={sel}><option>AI</option><option>Dana M.</option><option>Marco T.</option></select></Field>
                <Field label="Priority"><select className={sel}><option>Medium</option><option>High</option><option>Low</option></select></Field>
              </div>
              <Field label="Status"><select className={sel}><option>Scheduled</option><option>Confirmed</option></select></Field>
              <Field label="Note"><textarea rows={2} className={cn(inp, "h-auto py-2")} placeholder="Optional note…" /></Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-n200 px-4 py-3"><button onClick={() => setModal(false)} className="h-9 rounded-lg px-3 text-[13px] font-medium text-n600 hover:text-n900">Cancel</button><button onClick={() => setModal(false)} className="h-9 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-hover">Create appointment</button></div>
          </div>
        </div>
      )}
    </>
  );
}

const inp = "h-9 w-full rounded-lg border border-n200 bg-white px-2.5 text-[13px] text-n800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const sel = inp + " appearance-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[12px] font-medium text-n700">{label}</label>{children}</div>;
}
