"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { AI_CONFIG } from "@/lib/krakdai";
import { Section, Field, Row, Switch, LinkField, inputCls } from "./controls";
import { MessageCircle, Link2, Phone, ScrollText, Check, RefreshCw } from "lucide-react";

const TONES = ["Friendly & casual", "Warm & professional", "Concise & direct", "Enthusiastic"];
const LANGS = ["English", "Spanish", "French", "Portuguese", "Arabic", "Vietnamese"];

export function ChatbotTab() {
  const [tone, setTone] = useState(AI_CONFIG.persona);
  const [langs, setLangs] = useState<string[]>(["English", "Spanish"]);
  const [links, setLinks] = useState({ ...AI_CONFIG.links });
  const [testDrive, setTestDrive] = useState(AI_CONFIG.testDrive);
  const [creditApp, setCreditApp] = useState(AI_CONFIG.finance);
  const [forward, setForward] = useState("(512) 555-0100");
  const [rules, setRules] = useState(AI_CONFIG.custom);
  const toggleLang = (l: string) => setLangs((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l]);
  const setLink = (k: keyof typeof links, v: string) => setLinks((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {/* voice */}
        <Section icon={MessageCircle} title="Voice & tone" desc="How the agent introduces itself and sounds to buyers.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Agent name"><input defaultValue="Krakd AI" className={inputCls} /></Field>
            <Field label="Tone"><select value={tone} onChange={(e) => setTone(e.target.value)} className={inputCls}>{TONES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          </div>
          <div className="mt-4">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-n500">Languages</span>
            <div className="flex flex-wrap gap-1.5">{LANGS.map((l) => { const on = langs.includes(l); return <button key={l} type="button" onClick={() => toggleLang(l)} className={cn("rounded-full border px-2.5 py-1 text-[12px] font-medium transition", on ? "border-brand bg-brand text-white" : "border-n200 bg-white text-n600 hover:bg-n50")}>{on && <Check className="mr-1 inline h-3 w-3" />}{l}</button>; })}</div>
          </div>
        </Section>

        {/* links */}
        <Section icon={Link2} title="Links the agent shares" desc="Real URLs the AI hands buyers — it never invents or edits a link.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LinkField label="Inventory page" value={links.inventory} onChange={(v) => setLink("inventory", v)} />
            <LinkField label="Book appointment" value={links.appointment} onChange={(v) => setLink("appointment", v)} />
            <div>
              <div className="mb-1 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-n500">Test drive</span><Switch on={testDrive} onChange={setTestDrive} /></div>
              <input disabled={!testDrive} value={links.testDrive} onChange={(e) => setLink("testDrive", e.target.value)} className={cn(inputCls, !testDrive && "opacity-50")} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-n500">Credit application</span><Switch on={creditApp} onChange={setCreditApp} /></div>
              <input disabled={!creditApp} value={links.creditApp} onChange={(e) => setLink("creditApp", e.target.value)} className={cn(inputCls, !creditApp && "opacity-50")} />
            </div>
          </div>
        </Section>

        {/* phone */}
        <Section icon={Phone} title="AI phone line" desc="The number Krakd provides for your agent to text and call leads.">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/25 bg-brand-soft/40 p-4">
            <div>
              <div className="flex items-center gap-2"><span className="tnum text-[18px] font-bold text-n900">{AI_CONFIG.phone}</span><span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Provided by Krakd</span></div>
              <p className="mt-0.5 text-[12px] text-n600">Local Austin number · SMS &amp; voice · included in your plan</p>
            </div>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12px] font-semibold text-n700 transition hover:bg-n50"><RefreshCw className="h-3.5 w-3.5" />Change number</button>
          </div>
          <div className="mt-4"><Field label="Forward live calls to" hint="When a buyer asks for a person, Krakd rings this line.">
            <input value={forward} onChange={(e) => setForward(e.target.value)} className={cn(inputCls, "tnum")} /></Field></div>
        </Section>

        {/* rules */}
        <Section icon={ScrollText} title="House rules" desc="Guardrails injected on every conversation.">
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} className={cn(inputCls, "resize-none")} placeholder="e.g. Always mention our 7-day exchange policy…" />
          <p className="mt-1.5 text-[11.5px] text-n400">Treated as data — the agent still won&apos;t state a spec, price, or link that isn&apos;t real.</p>
        </Section>
      </div>

      {/* rail summary */}
      <div>
        <div className="sticky top-5 space-y-4">
          <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
            <p className="text-[13px] font-semibold text-n900">Agent summary</p>
            <div className="mt-3 space-y-2 text-[12.5px]">
              {[["Tone", tone], ["Languages", `${langs.length}`], ["Test drive", testDrive ? "On" : "Off"], ["Credit app", creditApp ? "On" : "Off"], ["Phone line", "Active"]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-n500">{k}</span><span className="font-semibold text-n900">{v}</span></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-brand/20 bg-brand-soft/30 p-4">
            <p className="text-[12px] font-semibold text-brand">What the agent does</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-n600">Responds in seconds, confirms the vehicle is still available, qualifies on financing &amp; trade-in, books the visit, and hands off to your team when it&apos;s time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
