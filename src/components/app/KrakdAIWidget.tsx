"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { botReply, aiVehicle, money, WIDGET_SUGGESTIONS, AI_CONFIG, type Msg, type ToolKind } from "@/lib/krakdai";
import { miles } from "@/lib/inventory";
import { IconAI } from "./AppIcons";
import { X, Send, UserPlus, CalendarCheck, Car, Repeat, ClipboardList, Flag, Search } from "lucide-react";

const TOOL_ICON: Record<ToolKind, React.ComponentType<{ className?: string }>> = {
  lead: UserPlus, appointment: CalendarCheck, voi: Car, tradein: Repeat, task: ClipboardList, handoff: Flag, inventory: Search,
};

function ToolChip({ kind, label, detail }: { kind: ToolKind; label: string; detail: string }) {
  const Icon = TOOL_ICON[kind];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-soft/60 px-2.5 py-1.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand text-white"><Icon className="h-3 w-3" /></span>
      <span className="min-w-0 leading-tight"><span className="block text-[11px] font-semibold text-brand">{label}</span><span className="block truncate text-[10.5px] text-n500">{detail}</span></span>
    </div>
  );
}

function VehicleMini({ id }: { id: string }) {
  const v = aiVehicle(id);
  if (!v) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-n200 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={v.image} alt="" className="aspect-[16/9] w-full object-cover" />
      <div className="p-2.5">
        <div className="flex items-baseline justify-between"><span className="text-[12.5px] font-semibold text-n900">{v.year} {v.make} {v.model}</span><span className="tnum text-[13px] font-bold text-n900">{money(v.price)}</span></div>
        <p className="mt-0.5 text-[11px] text-n500">{v.trim} · {miles(v.mileage)}</p>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const ai = m.from === "ai";
  return (
    <div className={cn("flex flex-col gap-1.5", ai ? "items-start" : "items-end")}>
      <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed", ai ? "rounded-tl-sm bg-white text-n800 shadow-[0_1px_2px_rgba(16,24,40,0.06)]" : "rounded-tr-sm bg-brand text-white")}>{m.text}</div>
      {m.vehicleId && <div className="w-[85%]"><VehicleMini id={m.vehicleId} /></div>}
      {m.tools && m.tools.length > 0 && <div className="w-[85%] space-y-1.5">{m.tools.map((t, i) => <ToolChip key={i} {...t} />)}</div>}
    </div>
  );
}

export function KrakdAIWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "ai", text: AI_CONFIG.welcome }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, typing, open]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    setMsgs((m) => [...m, { from: "buyer", text: q }]);
    setInput("");
    setTyping(true);
    timer.current = setTimeout(() => {
      setMsgs((m) => [...m, botReply(q)]);
      setTyping(false);
    }, 750);
  };

  return (
    <div className="app-scope">
      {/* launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Krakd AI"
        className={cn(
          "fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_10px_30px_-8px_rgba(37,99,235,0.6)] transition-transform hover:scale-105",
          "bg-gradient-to-br from-brand to-[#1e40af]",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <IconAI className="h-7 w-7" />}
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-ok" />}
      </button>

      {/* panel */}
      {open && (
        <div className="drawer-in fixed bottom-24 right-5 z-40 flex h-[560px] max-h-[calc(100dvh-7rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-n200 bg-n50 shadow-[0_24px_60px_-12px_rgba(16,24,40,0.35)]">
          {/* header */}
          <div className="flex items-center gap-3 border-b border-n200 bg-white px-4 py-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-[#1e40af] text-white"><IconAI className="h-5 w-5" /><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-ok" /></span>
            <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold text-n900">Krakd AI</p><p className="text-[11px] text-ok">● Online · replies in seconds</p></div>
            <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-n400 hover:bg-n100 hover:text-n700"><X className="h-4 w-4" /></button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-n50 p-4">
            {msgs.map((m, i) => <Bubble key={i} m={m} />)}
            {typing && (
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.06)] w-fit">
                {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-n300" style={{ animationDelay: `${d * 0.15}s` }} />)}
              </div>
            )}
            {msgs.length <= 1 && !typing && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {WIDGET_SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-n200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-n700 transition hover:border-brand hover:text-brand">{s}</button>)}
              </div>
            )}
          </div>

          {/* input */}
          <div className="border-t border-n200 bg-white p-3">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 rounded-2xl border border-n200 bg-white pl-3 pr-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a vehicle…" className="h-9 flex-1 bg-transparent text-[13px] text-n900 outline-none placeholder:text-n400" />
              <button type="submit" disabled={!input.trim()} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-white transition hover:bg-brand-hover disabled:opacity-40"><Send className="h-3.5 w-3.5" /></button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-n400">Powered by Krakd AI · grounded in live inventory</p>
          </div>
        </div>
      )}
    </div>
  );
}
