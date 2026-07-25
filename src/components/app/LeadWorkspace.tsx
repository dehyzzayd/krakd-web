"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Card, Badge, Dot, type Tone } from "@/components/app/AppKit";
import { CHECKLIST, STAGES, TEMP_TONE, money, type LeadProfile } from "@/lib/leads";

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const avatarBg = (n: string) => ["#3c7cab", "#1f8a65", "#c08532", "#6b5bab", "#b23b5b"][n.charCodeAt(0) % 5];

const TABS = ["Overview", "Credit application", "Documents", "Communications", "Activity", "Deal"] as const;
type Tab = (typeof TABS)[number];

const CREDIT_TONE: Record<string, Tone> = { not_started: "neutral", submitted: "brand", approved: "ok", declined: "err" };
const CREDIT_LABEL: Record<string, string> = { not_started: "Not started", submitted: "Submitted", approved: "Approved", declined: "Declined" };

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="mb-1 block text-[11.5px] font-medium text-n500">{label}</label>
      <input defaultValue={value} className="tnum h-9 w-full rounded-lg border border-n200 bg-white px-2.5 text-[13px] text-n800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" />
    </div>
  );
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="mb-2.5 mt-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-n500 first:mt-0">{children}</p>;
}
function Composer({ placeholder, cta }: { placeholder: string; cta: string }) {
  return (
    <div className="mt-3 rounded-lg border border-n200 bg-white p-2.5">
      <textarea placeholder={placeholder} rows={3} className="w-full resize-none bg-transparent text-[13px] text-n800 outline-none placeholder:text-n400" />
      <div className="flex justify-end"><button className="h-8 rounded-lg bg-brand px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">{cta}</button></div>
    </div>
  );
}

export function LeadWorkspace({ p }: { p: NonNullable<LeadProfile> }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [comm, setComm] = useState<"Notes" | "Texts" | "Calls" | "Emails">("Texts");
  const [stage, setStage] = useState(p.stage);
  const done = CHECKLIST.filter((c) => p.checklist[c.key]).length;

  return (
    <div className="app-scope min-h-dvh bg-n50">
      {/* header */}
      <div className="sticky top-0 z-20 border-b border-n200 bg-n50/90 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 py-3">
          <Link href="/dashboard/leads" className="text-[12.5px] font-medium text-brand hover:text-brand-hover">← Pipeline</Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-semibold text-white" style={{ background: avatarBg(p.name) }}>{initials(p.name)}</span>
            <div className="mr-auto">
              <h1 className="flex items-center gap-2 text-[18px] font-semibold text-n900">{p.name}<Badge tone={TEMP_TONE[p.temp]}>{p.temp}</Badge></h1>
              <p className="text-[12.5px] text-n500">{p.source} · score <span className="tnum font-semibold text-n700">{p.score}</span> · owner {p.owner}</p>
            </div>
            <select value={stage} onChange={(e) => setStage(e.target.value as typeof stage)} className="h-9 rounded-lg border border-n200 bg-white px-2.5 text-[12.5px] font-medium text-n700 outline-none focus:border-brand">
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="flex gap-1.5">
              {["Call", "Text", "Email"].map((a) => <button key={a} className="h-9 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-semibold text-n700 transition hover:bg-n100">{a}</button>)}
              <button className="h-9 rounded-lg bg-brand px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">Book appointment</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-5 px-6 py-5 lg:grid-cols-[320px_1fr]">
        {/* rail */}
        <aside className="space-y-3 lg:sticky lg:top-[92px] lg:self-start">
          <Card className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-n500">Contact</p>
            <div className="mt-2 space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-n500">Phone</span><span className="tnum font-medium text-n900">{p.phone}</span></div>
              <div className="flex justify-between gap-3"><span className="text-n500">Email</span><span className="truncate font-medium text-n900">{p.email}</span></div>
              <div className="flex justify-between"><span className="text-n500">Est. deal</span><span className="tnum font-medium text-n900">{money(p.value)}</span></div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-n500">Deal readiness</p><span className="tnum text-[12px] font-semibold text-n700">{done}/6</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-n100"><span className="block h-full bg-brand" style={{ width: `${(done / 6) * 100}%` }} /></div>
            <div className="mt-3 space-y-2">
              {CHECKLIST.map((c) => {
                const on = p.checklist[c.key];
                return (
                  <div key={c.key} className="flex items-center gap-2.5">
                    <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[9px] text-white", on ? "bg-ok" : "bg-n200")}>{on ? "✓" : ""}</span>
                    <span className={cn("text-[12.5px]", on ? "text-n800" : "text-n500")}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-n500">Vehicle of interest</p>
            <p className="mt-1.5 text-[14px] font-semibold text-n900">{p.vehicle}</p>
            <p className="text-[12px] text-n500">Stock in inventory · {money(p.value)}</p>
          </Card>

          <Card className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-n500">Deal snapshot</p>
            <div className="mt-2 flex items-baseline gap-1"><span className="tnum text-[22px] font-semibold text-n900">{money(p.deal.monthly)}</span><span className="text-[12px] text-n500">/mo · {p.deal.term}mo</span></div>
            <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-[12px]">
              <span className="text-n500">Down</span><span className="tnum text-right font-medium text-n900">{money(p.deal.down)}</span>
              <span className="text-n500">APR</span><span className="tnum text-right font-medium text-n900">{p.deal.apr}%</span>
              {p.hasTrade && (<><span className="text-n500">Trade equity</span><span className={cn("tnum text-right font-medium", p.deal.netEquity >= 0 ? "text-ok" : "text-err")}>{money(p.deal.netEquity)}</span></>)}
            </div>
          </Card>
        </aside>

        {/* main */}
        <div>
          <div className="mb-3 flex gap-1 overflow-x-auto border-b border-n200">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("relative shrink-0 px-3 py-2.5 text-[13px] font-medium transition", tab === t ? "text-n900" : "text-n500 hover:text-n800")}>
                {t}{tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
              </button>
            ))}
          </div>

          {tab === "Overview" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-brand-soft p-3.5"><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand"><Dot tone="brand" />AI · next best action</p><p className="mt-1.5 text-[13.5px] leading-snug text-n800">{p.next}</p></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Stage", STAGES.find((s) => s.id === stage)?.label ?? ""], ["Credit", CREDIT_LABEL[p.creditStatus]], ["Docs", `${p.docs.filter((d) => d.status !== "missing").length}/${p.docs.length}`], ["FICO", p.bureau ? String(p.bureau.fico) : "—"]].map(([l, v]) => (
                  <Card key={l} className="p-3"><p className="text-[11px] uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1 text-[16px] font-semibold text-n900">{v}</p></Card>
                ))}
              </div>
              <Card className="p-4"><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-n500">Recent activity</p>
                <div className="mt-3 space-y-3">{p.timeline.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex gap-3"><span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", { ai: "bg-brand", you: "bg-n700", lead: "bg-ok", system: "bg-n400" }[a.who])} /><div><p className="text-[12.5px] text-n800">{a.text}</p><p className="text-[11px] text-n400">{a.when}</p></div></div>
                ))}</div>
              </Card>
            </div>
          )}

          {tab === "Credit application" && (
            <Card className="p-5">
              <div className="flex items-center justify-between"><p className="text-[13.5px] font-semibold text-n900">Credit application</p><Badge tone={CREDIT_TONE[p.creditStatus]}><Dot tone={CREDIT_TONE[p.creditStatus]} />{CREDIT_LABEL[p.creditStatus]}</Badge></div>
              {p.bureau && (<div className="mt-3 flex items-center justify-between rounded-lg bg-ok-soft px-3.5 py-2.5"><span className="text-[12.5px] text-n700">Bureau pulled {p.bureau.pulledAt}</span><span className="tnum text-[13px] font-semibold text-ok">FICO {p.bureau.fico} · {p.bureau.tier}</span></div>)}

              <SectionTitle>Applicant</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name" value={p.name} /><Field label="Date of birth" value="04 / 18 / 1989" />
                <Field label="SSN (last 4)" value="•••• 4821" /><Field label="Driver's license #" value="TX 3390 1187" />
                <Field label="Marital status" value="Married" /><Field label="Dependents" value="2" />
              </div>
              <SectionTitle>Residence</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Street address" value="1200 S Lamar Blvd" wide /><Field label="City" value="Austin" /><Field label="State / ZIP" value="TX 78704" />
                <Field label="Years at address" value="3" /><Field label="Own / Rent" value="Rent" /><Field label="Monthly housing" value="$1,850" />
              </div>
              <SectionTitle>Employment & income</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Employer" value="Dell Technologies" wide /><Field label="Job title" value="Field technician" /><Field label="Years employed" value="4" />
                <Field label="Gross monthly income" value="$6,400" /><Field label="Employer phone" value="(512) 555-0190" />
              </div>
              <SectionTitle>Deal terms requested</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preferred down" value={money(p.deal.down)} /><Field label="Target monthly" value={money(p.deal.monthly)} />
                <Field label="Term (months)" value={String(p.deal.term)} /><Field label="Desired trade-in" value={p.hasTrade ? "2018 Ford F-150" : "None"} />
              </div>
              <div className="mt-5 flex gap-2"><button className="h-10 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white transition hover:bg-brand-hover">Run credit check</button><button className="h-10 rounded-lg border border-n200 bg-white px-4 text-[13px] font-semibold text-n700 transition hover:bg-n100">Send secure form</button></div>
            </Card>
          )}

          {tab === "Documents" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {p.docs.map((d) => {
                const tone: Tone = d.status === "verified" ? "ok" : d.status === "received" ? "brand" : "warn";
                return (
                  <Card key={d.name} className="flex items-center gap-3 p-3.5">
                    <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg", d.status === "missing" ? "bg-warn-soft text-warn" : "bg-n100 text-n500")}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                    </span>
                    <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-n900">{d.name}</p><p className="text-[11.5px] text-n500">{d.kind}{d.when ? ` · ${d.when}` : ""}</p></div>
                    <div className="text-right"><Badge tone={tone}>{d.status === "verified" ? "Verified" : d.status === "received" ? "Received" : "Missing"}</Badge>
                      <button className="mt-1.5 block text-[11.5px] font-semibold text-brand hover:underline">{d.status === "missing" ? "Request" : "View"}</button></div>
                  </Card>
                );
              })}
            </div>
          )}

          {tab === "Communications" && (
            <Card className="p-0">
              <div className="flex gap-1 border-b border-n200 px-3 pt-2">
                {(["Texts", "Calls", "Emails", "Notes"] as const).map((c) => (
                  <button key={c} onClick={() => setComm(c)} className={cn("relative px-3 py-2 text-[12.5px] font-medium transition", comm === c ? "text-n900" : "text-n500 hover:text-n800")}>{c}{comm === c && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}</button>
                ))}
              </div>
              <div className="p-4">
                {comm === "Texts" && (<><div className="space-y-2">{p.messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.from === "lead" ? "justify-start" : "justify-end")}><div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug", m.from === "lead" ? "rounded-bl-sm bg-n100 text-n800" : m.from === "ai" ? "rounded-br-sm bg-brand text-white" : "rounded-br-sm bg-n800 text-white")}>{m.from !== "lead" && <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-70">{m.from === "ai" ? "Krakd AI" : "You"}</span>}{m.text}</div></div>
                ))}</div><Composer placeholder="Send a text…" cta="Send" /></>)}
                {comm === "Calls" && (<div className="space-y-2">{(p.calls.length ? p.calls : [{ dir: "out", text: "No calls yet", when: "" }]).map((c, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-n200 px-3 py-2.5"><span className={cn("grid h-8 w-8 place-items-center rounded-full", c.dir === "out" ? "bg-brand-soft text-brand" : "bg-ok-soft text-ok")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg></span><span className="flex-1 text-[12.5px] text-n800">{c.text}</span><span className="text-[11px] text-n400">{c.when}</span></div>
                ))}<button className="mt-1 h-9 w-full rounded-lg border border-n200 bg-white text-[12.5px] font-semibold text-n700 transition hover:bg-n100">Log a call</button></div>)}
                {comm === "Emails" && (<div className="space-y-2">{(p.emails.length ? p.emails : [{ subject: "No emails yet", when: "" }]).map((e, i) => (
                  <div key={i} className="rounded-lg border border-n200 px-3 py-2.5"><p className="text-[13px] font-medium text-n900">{e.subject}</p><p className="text-[11px] text-n400">{e.when}</p></div>
                ))}<Composer placeholder="Compose an email…" cta="Send email" /></div>)}
                {comm === "Notes" && (<div className="space-y-2">{p.notes.map((n, i) => (
                  <div key={i} className="rounded-lg bg-n50 px-3 py-2.5"><p className="text-[12.5px] text-n800">{n.text}</p><p className="mt-1 text-[11px] text-n400">{n.by} · {n.when}</p></div>
                ))}<Composer placeholder="Add an internal note…" cta="Add note" /></div>)}
              </div>
            </Card>
          )}

          {tab === "Activity" && (
            <Card className="p-4"><div className="space-y-3.5">{p.timeline.map((a, i) => (
              <div key={i} className="flex gap-3"><div className="flex flex-col items-center"><span className={cn("mt-1 h-2.5 w-2.5 rounded-full", { ai: "bg-brand", you: "bg-n700", lead: "bg-ok", system: "bg-n400" }[a.who])} />{i < p.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-n200" />}</div><div className="pb-1.5"><p className="text-[13px] text-n800">{a.text}</p><p className="mt-0.5 text-[11px] text-n400">{a.who === "ai" ? "Krakd AI" : a.who === "you" ? p.owner : a.who === "lead" ? p.name : "System"} · {a.when}</p></div></div>
            ))}</div></Card>
          )}

          {tab === "Deal" && (
            <div className="space-y-3">
              <Card className="p-5">
                <p className="text-[13.5px] font-semibold text-n900">Deal structure</p>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-3">
                  {[["Selling price", money(p.deal.price)], ["Cash down", money(p.deal.down)], ["APR", `${p.deal.apr}%`], ["Term", `${p.deal.term} mo`], ["Amount financed", money(p.deal.price - p.deal.down - Math.max(0, p.deal.netEquity))], ["Monthly", money(p.deal.monthly)]].map(([l, v]) => (
                    <div key={l} className="flex flex-col"><span className="text-[11.5px] text-n500">{l}</span><span className="tnum font-semibold text-n900">{v}</span></div>
                  ))}
                </div>
              </Card>
              {p.hasTrade && (
                <Card className="p-5"><p className="text-[13.5px] font-semibold text-n900">Trade & equity</p>
                  <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-2 text-[13px]">
                    {[["Trade value", money(p.deal.tradeValue)], ["Payoff", money(p.deal.payoff)], ["Net equity", money(p.deal.netEquity)]].map(([l, v], i) => (
                      <div key={l} className="flex flex-col"><span className="text-[11.5px] text-n500">{l}</span><span className={cn("tnum font-semibold", i === 2 ? (p.deal.netEquity >= 0 ? "text-ok" : "text-err") : "text-n900")}>{v}</span></div>
                    ))}
                  </div>
                </Card>
              )}
              <Card className="p-5"><p className="text-[13.5px] font-semibold text-n900">Gross</p>
                <div className="mt-3 flex items-center gap-8 text-[13px]">
                  <div><span className="block text-[11.5px] text-n500">Front gross</span><span className="tnum font-semibold text-n900">{money(p.deal.frontGross)}</span></div>
                  <div><span className="block text-[11.5px] text-n500">Back gross</span><span className="tnum font-semibold text-n900">{money(p.deal.backGross)}</span></div>
                  <div><span className="block text-[11.5px] text-n500">Total gross</span><span className="tnum font-semibold text-ok">{money(p.deal.frontGross + p.deal.backGross)}</span></div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
