"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { AI_CONFIG } from "@/lib/krakdai";
import { Section, Row, Switch, Seg } from "./controls";
import { Scale, Wrench, Clock, Radio, Check } from "lucide-react";

const POSTURES: { v: "Flexible" | "Mostly firm" | "No negotiation"; title: string; desc: string }[] = [
  { v: "Flexible", title: "Flexible", desc: "Signals room to deal; still defers final numbers to your team." },
  { v: "Mostly firm", title: "Mostly firm", desc: "Holds price as set, invites the buyer in to talk numbers." },
  { v: "No negotiation", title: "No negotiation", desc: "States prices are firm; never entertains an offer." },
];

export function BehaviorTab() {
  const [posture, setPosture] = useState<"Flexible" | "Mostly firm" | "No negotiation">(AI_CONFIG.negotiation);
  const [booking, setBooking] = useState<"Disabled" | "Internal" | "External">(AI_CONFIG.booking as "Internal");
  const [followups, setFollowups] = useState(true);
  const [tradeIn, setTradeIn] = useState(AI_CONFIG.tradeIn);
  const [voi, setVoi] = useState(true);
  const [handoff, setHandoff] = useState(true);
  const [afterHours, setAfterHours] = useState(AI_CONFIG.afterHours);
  const [channels, setChannels] = useState<Record<string, boolean>>({ website: true, fbmp: true, sms: true, email: false });
  const toggleCh = (k: string) => setChannels((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-5">
      <Section icon={Scale} title="Negotiation posture" desc="How hard the agent holds the line on price.">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {POSTURES.map((p) => { const on = posture === p.v; return (
            <button key={p.v} type="button" onClick={() => setPosture(p.v)} className={cn("rounded-xl border p-3 text-left transition", on ? "border-brand bg-brand-soft/50 ring-1 ring-brand/30" : "border-n200 bg-white hover:bg-n50")}>
              <div className="flex items-center justify-between"><span className={cn("text-[13px] font-semibold", on ? "text-brand" : "text-n900")}>{p.title}</span><span className={cn("grid h-4 w-4 place-items-center rounded-full border", on ? "border-brand bg-brand text-white" : "border-n300")}>{on && <Check className="h-2.5 w-2.5" />}</span></div>
              <p className="mt-1 text-[11px] leading-snug text-n500">{p.desc}</p>
            </button>
          ); })}
        </div>
      </Section>

      <Section icon={Wrench} title="Actions the agent can take" desc="Every enabled tool writes straight to your CRM — autonomously.">
        <Row title="Capture leads" desc="Save name, mobile and email to the CRM. Always on."><span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok"><Check className="h-3 w-3" />Core</span></Row>
        <Row title="Book appointments" desc="Internal lets the agent book directly; Link hands off a scheduler URL.">
          <Seg value={booking} onChange={setBooking} options={[{ v: "Disabled", label: "Off" }, { v: "Internal", label: "Internal" }, { v: "External", label: "Link" }]} />
        </Row>
        <Row title="Schedule follow-ups" desc="Silently create a call-back task when a buyer asks to be contacted."><Switch on={followups} onChange={setFollowups} /></Row>
        <Row title="Capture trade-ins" desc="Log a structured trade-in; appraisal stays with your team."><Switch on={tradeIn} onChange={setTradeIn} /></Row>
        <Row title="Record vehicle of interest" desc="Attach the exact unit a buyer is shopping to their record."><Switch on={voi} onChange={setVoi} /></Row>
        <Row title="Hand off to a human" desc="Flag complaints, hot leads and out-of-scope asks for a person." last><Switch on={handoff} onChange={setHandoff} /></Row>
      </Section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section icon={Clock} title="Availability" desc="When the agent is live.">
          <Row title="24/7 coverage" desc="Answer and book around the clock, including after-hours." last><Switch on={afterHours} onChange={setAfterHours} /></Row>
          {!afterHours && <p className="mt-2 rounded-lg bg-n50 px-3 py-2 text-[11.5px] text-n500">Falls back to your dealership hours (Mon–Sat 9–7).</p>}
        </Section>
        <Section icon={Radio} title="Channels" desc="Where the agent works.">
          {([["website", "Dealer website"], ["fbmp", "Facebook Marketplace"], ["sms", "SMS / text"], ["email", "Email"]] as const).map(([k, label], i, arr) => (
            <Row key={k} title={label} last={i === arr.length - 1}><Switch on={channels[k]} onChange={() => toggleCh(k)} /></Row>
          ))}
        </Section>
      </div>
    </div>
  );
}
