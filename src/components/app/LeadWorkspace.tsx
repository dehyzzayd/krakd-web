"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Card, Badge, Dot, type Tone } from "@/components/app/AppKit";
import { Topbar } from "@/components/app/Topbar";
import { CHECKLIST, STAGES, TEMP_TONE, money, type LeadProfile } from "@/lib/leads";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#2563eb", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];

const TABS = ["Overview", "Activities", "Communications", "Documents", "Notes"] as const;
type Tab = (typeof TABS)[number];
const PRIO_DOT: Record<string, string> = { High: "bg-err", Medium: "bg-warn", Low: "bg-n400" };

function ScoreRing({ score }: { score: number }) {
  const r = 32, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-[88px] w-[88px]">
      <circle cx="40" cy="40" r={r} stroke="#eef0f3" strokeWidth="8" fill="none" />
      <circle cx="40" cy="40" r={r} stroke="#2563eb" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform="rotate(-90 40 40)" />
      <text x="40" y="38" textAnchor="middle" className="fill-n900 tnum text-[16px] font-semibold">{score}</text>
      <text x="40" y="52" textAnchor="middle" className="fill-n500 text-[8px] uppercase tracking-wide">score</text>
    </svg>
  );
}

const SPARK = [3, 5, 4, 8, 6, 4, 5];
function Interaction() {
  const max = Math.max(...SPARK), W = 560, H = 90, step = W / (SPARK.length - 1);
  const pts = SPARK.map((v, i) => `${i * step},${H - (v / max) * (H - 14) - 7}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[90px] w-full" preserveAspectRatio="none" aria-hidden>
      <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} stroke="#eef0f3" strokeWidth="1" strokeDasharray="3 4" />
      <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {SPARK.map((v, i) => <circle key={i} cx={i * step} cy={H - (v / max) * (H - 14) - 7} r="2.5" fill="#fff" stroke="#2563eb" strokeWidth="1.6" />)}
    </svg>
  );
}

function Composer({ placeholder, cta }: { placeholder: string; cta: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-n200 bg-white p-2.5">
      <textarea placeholder={placeholder} rows={3} className="w-full resize-none bg-transparent text-[13px] text-n800 outline-none placeholder:text-n400" />
      <div className="flex justify-end gap-2"><button className="h-8 rounded-lg bg-n100 px-3 text-[12.5px] font-semibold text-n600 hover:bg-n200">AI draft</button><button className="h-8 rounded-lg bg-brand px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">{cta}</button></div>
    </div>
  );
}

function FileRow({ d }: { d: { name: string; size: string; date: string; status: string } }) {
  const tone: Tone = d.status === "verified" ? "ok" : d.status === "received" ? "brand" : "warn";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-n200 bg-white p-3">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", d.status === "missing" ? "bg-warn-soft text-warn" : "bg-brand-soft text-brand")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      </span>
      <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-n900">{d.name}</p><p className="text-[11.5px] text-n500">{d.status === "missing" ? "Not uploaded yet" : `${d.size} · ${d.date}`}</p></div>
      {d.status === "missing" ? <button className="text-[12px] font-semibold text-brand hover:underline">Request</button> : <Badge tone={tone}>{d.status === "verified" ? "Verified" : "Received"}</Badge>}
    </div>
  );
}

function TimelineList({ p }: { p: NonNullable<LeadProfile> }) {
  return (
    <div className="space-y-4">
      {p.timeline.map((a, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", { ai: "bg-brand", you: "bg-n700", lead: "bg-ok", system: "bg-n400" }[a.who])} />
            {i < p.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-n200" />}
          </div>
          <div className="pb-1.5"><p className="text-[13px] text-n800">{a.text}</p><p className="mt-0.5 text-[11.5px] text-n400">{a.who === "ai" ? "Krakd AI" : a.who === "you" ? p.owner : a.who === "lead" ? p.name : "System"} · {a.when}</p></div>
        </div>
      ))}
    </div>
  );
}

export function LeadWorkspace({ p }: { p: NonNullable<LeadProfile> }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [comm, setComm] = useState<"Texts" | "Calls" | "Emails">("Texts");
  const [taskTab, setTaskTab] = useState<"To do" | "In progress" | "Done">("To do");
  const [stage, setStage] = useState(p.stage);
  const done = CHECKLIST.filter((c) => p.checklist[c.key]).length;
  const tasks = p.tasks.filter((t) => (taskTab === "Done" ? t.done : taskTab === "To do" ? !t.done : false));

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: "Leads", href: "/dashboard/leads" }, { label: p.name }]} />

      {/* identity + tabs */}
      <div className="border-b border-[#e4e7ec] bg-white">
        <div className="w-full px-6 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white" style={{ background: avatarBg(p.name) }}>{initials(p.name)}</span>
            <div className="mr-auto">
              <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.02em] text-n900">{p.name}<Badge tone={TEMP_TONE[p.temp]}>{p.temp}</Badge></h1>
              <p className="text-[13px] text-n500">Interested in {p.vehicle} · via {p.source}</p>
            </div>
            <select value={stage} onChange={(e) => setStage(e.target.value as typeof stage)} className="h-9 rounded-lg border border-[#e4e7ec] bg-white px-2.5 text-[13px] font-medium text-n700 outline-none focus:border-brand">
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e4e7ec] bg-white px-3 text-[13px] font-semibold text-n700 transition hover:bg-n100"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18 10l-4-4L4 16v4zM14 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>Edit</button>
            <div className="flex gap-1.5">
              {["Call", "Text"].map((a) => <button key={a} className="h-9 rounded-lg border border-[#e4e7ec] bg-white px-3 text-[13px] font-semibold text-n700 transition hover:bg-n100">{a}</button>)}
              <button className="h-9 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white transition hover:bg-brand-hover">Book appointment</button>
            </div>
          </div>
          <div className="mt-4 flex gap-1">
            {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("relative px-3 py-2.5 text-[13.5px] font-medium transition", tab === t ? "text-n900" : "text-n500 hover:text-n800")}>{t}{tab === t && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />}</button>)}
          </div>
        </div>
      </div>

      {/* persistent left rail + tab content (keeps width consistent) */}
      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-[72px] xl:self-start">
          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-n900">Lead details</h3>
            <div className="mt-4 space-y-3">
              {[["Full name", p.name], ["Phone", p.phone], ["Email", p.email], ["Source", p.source], ["Created", "Jul 24, 2026"]].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3"><span className="shrink-0 text-[12px] text-n500">{k}</span><span className="truncate text-[13px] font-medium text-n900">{v}</span></div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-err-soft px-2.5 py-1 text-[11.5px] font-medium text-err">{p.temp === "hot" ? "Hot lead" : "Warm lead"}</span>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-brand">{p.financing === "cash" ? "Cash buyer" : "Financing"}</span>
              {p.hasTrade && <span className="rounded-full bg-warn-soft px-2.5 py-1 text-[11.5px] font-medium text-warn">Has trade</span>}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[13px] font-semibold text-n900">Assigned to</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full text-[13px] font-semibold text-white" style={{ background: avatarBg(p.owner) }}>{p.owner === "AI" ? "AI" : initials(p.owner)}</span>
              <div><p className="text-[13.5px] font-semibold text-n900">{p.owner === "AI" ? "Krakd AI" : p.owner}</p><p className="text-[12px] text-n500">{p.owner === "AI" ? "Autonomous follow-up" : "Salesperson"}</p></div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[13px] font-semibold text-n900">Opportunity</p>
            <div className="mt-2 flex items-baseline gap-1.5"><span className="tnum text-[24px] font-semibold text-n900">{money(p.value)}</span><span className="text-[12px] text-n500">est. deal</span></div>
            <div className="mt-3 space-y-2 text-[12.5px]">
              <div className="flex justify-between"><span className="text-n500">Payment</span><span className="font-medium text-n900">{p.financing === "cash" ? "Cash" : "Financing"}</span></div>
              {p.financing === "finance" ? (<>
                <div className="flex justify-between"><span className="text-n500">Est. monthly</span><span className="tnum font-medium text-n900">{money(p.deal.monthly)}/mo</span></div>
                <div className="flex justify-between"><span className="text-n500">Credit</span><span className="font-medium text-n900">{p.bureau ? `${p.bureau.fico} · ${p.bureau.tier.split(" ")[0]}` : "Not pulled"}</span></div>
              </>) : <div className="flex justify-between"><span className="text-n500">Total</span><span className="tnum font-medium text-n900">Paid in full</span></div>}
              {p.hasTrade && <div className="flex justify-between"><span className="text-n500">Trade equity</span><span className={cn("tnum font-medium", p.deal.netEquity >= 0 ? "text-ok" : "text-err")}>{money(p.deal.netEquity)}</span></div>}
            </div>
            <div className="mt-4"><div className="mb-1.5 flex justify-between text-[11.5px]"><span className="text-n500">Deal readiness</span><span className="tnum font-semibold text-n700">{done}/6</span></div><div className="h-1.5 overflow-hidden rounded-full bg-n100"><span className="block h-full bg-brand" style={{ width: `${(done / 6) * 100}%` }} /></div></div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between"><p className="text-[13px] font-semibold text-n900">Attachments</p><button onClick={() => setTab("Documents")} className="text-[12.5px] font-medium text-brand hover:text-brand-hover">All</button></div>
            <div className="mt-3 space-y-2">{p.docs.slice(0, 3).map((d) => <FileRow key={d.name} d={d} />)}</div>
          </Card>
        </aside>

        {/* main */}
        <main className="min-w-0">
          {tab === "Overview" && (
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="text-[14px] font-semibold text-n900">Lead metrics</h3>
                <div className="mt-3 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={p.score} />
                    <div className="space-y-2 text-[12.5px]">
                      <p className="flex items-center gap-2 text-n700"><Dot tone="ok" />High engagement</p>
                      <p className="flex items-center gap-2 text-n700"><Dot tone="warn" />Medium response rate</p>
                      <p className="flex items-center gap-2 text-n700"><Dot tone="brand" />{p.score}% conversion probability</p>
                    </div>
                  </div>
                  <div className="min-w-[280px] flex-1">
                    <div className="mb-1 flex items-center justify-between text-[11.5px] text-n500"><span>Interaction frequency</span><span>Last 7 days</span></div>
                    <Interaction />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between"><h3 className="text-[14px] font-semibold text-n900">Communication timeline</h3><button onClick={() => setTab("Activities")} className="text-[12.5px] font-medium text-brand hover:text-brand-hover">View all</button></div>
                <div className="mt-4 space-y-4">
                  {p.timeline.slice(0, 4).map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", { ai: "bg-brand-soft text-brand", you: "bg-n100 text-n600", lead: "bg-ok-soft text-ok", system: "bg-n100 text-n500" }[a.who])}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M3 8l9 5 9-5" stroke="currentColor" strokeWidth="1.5" /></svg>
                      </span>
                      <div className="min-w-0 flex-1"><p className="text-[13px] font-medium text-n900">{a.text}</p><p className="mt-0.5 text-[11.5px] text-n400">{a.who === "ai" ? "Krakd AI" : a.who === "you" ? p.owner : a.who === "lead" ? p.name : "System"} · {a.when}</p></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between"><h3 className="text-[14px] font-semibold text-n900">Tasks &amp; reminders</h3><button className="text-[12.5px] font-medium text-brand hover:text-brand-hover">+ Add task</button></div>
                <div className="mt-3 flex gap-1">
                  {(["To do", "In progress", "Done"] as const).map((t) => <button key={t} onClick={() => setTaskTab(t)} className={cn("h-8 rounded-lg px-3 text-[12.5px] font-medium transition", taskTab === t ? "bg-brand text-white" : "bg-n100 text-n600 hover:bg-n200")}>{t}</button>)}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {tasks.length ? tasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-2xl border border-n200 p-3">
                      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border", t.done ? "border-ok bg-ok text-white" : "border-n300")}>{t.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                      <div className="min-w-0 flex-1"><p className={cn("truncate text-[13px] font-medium", t.done ? "text-n400 line-through" : "text-n900")}>{t.title}</p><p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-n500"><span className={cn("h-1.5 w-1.5 rounded-full", PRIO_DOT[t.priority])} />{t.due} · {t.priority}</p></div>
                    </div>
                  )) : <p className="col-span-full rounded-xl border border-dashed border-n200 py-8 text-center text-[12.5px] text-n400">Nothing {taskTab.toLowerCase()}</p>}
                </div>
              </Card>
            </div>
          )}

          {tab === "Activities" && <Card className="p-5"><TimelineList p={p} /></Card>}

          {tab === "Communications" && (
            <Card className="p-0">
              <div className="flex gap-1 border-b border-[#e4e7ec] px-4 pt-2">{(["Texts", "Calls", "Emails"] as const).map((c) => <button key={c} onClick={() => setComm(c)} className={cn("relative px-3 py-2 text-[12.5px] font-medium transition", comm === c ? "text-n900" : "text-n500 hover:text-n800")}>{c}{comm === c && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}</button>)}</div>
              <div className="p-4">
                {comm === "Texts" && (<><div className="space-y-2">{p.messages.map((m, i) => <div key={i} className={cn("flex", m.from === "lead" ? "justify-start" : "justify-end")}><div className={cn("max-w-[70%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-snug", m.from === "lead" ? "rounded-bl-sm bg-n100 text-n800" : m.from === "ai" ? "rounded-br-sm bg-brand text-white" : "rounded-br-sm bg-n800 text-white")}>{m.from !== "lead" && <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-70">{m.from === "ai" ? "Krakd AI" : "You"}</span>}{m.text}</div></div>)}</div><Composer placeholder="Send a text…" cta="Send" /></>)}
                {comm === "Calls" && (<div className="space-y-2">{(p.calls.length ? p.calls : [{ dir: "out", text: "No calls yet", when: "" }]).map((c, i) => <div key={i} className="flex items-center gap-3 rounded-2xl border border-n200 px-3 py-2.5"><span className={cn("grid h-8 w-8 place-items-center rounded-full", c.dir === "out" ? "bg-brand-soft text-brand" : "bg-ok-soft text-ok")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg></span><span className="flex-1 text-[12.5px] text-n800">{c.text}</span><span className="text-[11px] text-n400">{c.when}</span></div>)}<button className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] bg-white text-[12.5px] font-semibold text-n700 hover:bg-n100">Log a call</button></div>)}
                {comm === "Emails" && (<div className="space-y-2">{(p.emails.length ? p.emails : [{ subject: "No emails yet", when: "" }]).map((e, i) => <div key={i} className="rounded-2xl border border-n200 px-3 py-2.5"><p className="text-[13px] font-medium text-n900">{e.subject}</p><p className="text-[11px] text-n400">{e.when}</p></div>)}<Composer placeholder="Compose an email…" cta="Send email" /></div>)}
              </div>
            </Card>
          )}

          {tab === "Documents" && (
            <div>
              <div className="mb-3 flex items-center justify-between"><p className="text-[13px] text-n500">{p.docs.filter((d) => d.status !== "missing").length} of {p.docs.length} on file{p.financing === "cash" && " · cash deal, no credit app"}</p><button className="h-9 rounded-lg bg-brand px-3.5 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Upload file</button></div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{p.docs.map((d) => <FileRow key={d.name} d={d} />)}</div>
            </div>
          )}

          {tab === "Notes" && <Card className="p-5"><div className="space-y-2">{p.notes.map((n, i) => <div key={i} className="rounded-xl bg-n50 px-3.5 py-3"><p className="text-[13px] text-n800">{n.text}</p><p className="mt-1 text-[11px] text-n400">{n.by} · {n.when}</p></div>)}<Composer placeholder="Add an internal note…" cta="Add note" /></div></Card>}
        </main>
      </div>
    </div>
  );
}
