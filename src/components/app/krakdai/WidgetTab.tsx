"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconAI } from "@/components/app/AppIcons";
import { WIDGET_DEFAULTS } from "@/lib/krakdai";
import { Section, Field, inputCls, Seg } from "./controls";
import { Palette, MessageSquare, Code2, Check, Copy, Send } from "lucide-react";

const SWATCHES = ["#2563eb", "#0ea5e9", "#6d28d9", "#059669", "#e11d48", "#ea580c", "#0f172a", "#db2777"];

function Preview({ s, open }: { s: typeof WIDGET_DEFAULTS; open: boolean }) {
  const dark = s.theme === "dark";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-n200 bg-n100">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-n200 bg-white px-3 py-2">
        <span className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></span>
        <span className="ml-2 flex-1 truncate rounded-md bg-n100 px-2.5 py-1 text-[11px] text-n500">downtownauto.com</span>
      </div>
      {/* faux dealer site */}
      <div className="relative h-[360px] overflow-hidden bg-gradient-to-b from-n50 to-n100">
        <div className="p-4">
          <div className="h-4 w-28 rounded bg-n300/70" />
          <div className="mt-4 h-20 rounded-lg bg-gradient-to-r from-n300/50 to-n200/50" />
          <div className="mt-3 grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-white/70" />)}</div>
        </div>

        {/* launcher */}
        <div className={cn("absolute bottom-4", s.position === "right" ? "right-4" : "left-4")}>
          {open ? (
            <div className={cn("w-[280px] overflow-hidden rounded-2xl border shadow-[0_16px_40px_-12px_rgba(16,24,40,0.4)]", dark ? "border-white/10 bg-[#0d1117]" : "border-n200 bg-white")}>
              <div className="flex items-center gap-2.5 p-3" style={{ background: s.accent }}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white"><IconAI className="h-4.5 w-4.5" /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-semibold text-white">{s.title || "Chat with us"}</p><p className="truncate text-[10.5px] text-white/80">{s.subtitle}</p></div>
              </div>
              <div className={cn("space-y-2 p-3", dark ? "bg-[#0d1117]" : "bg-n50")}>
                <div className={cn("max-w-[85%] rounded-2xl rounded-tl-sm px-2.5 py-1.5 text-[11.5px] leading-snug", dark ? "bg-white/10 text-n100" : "bg-white text-n700 shadow-sm")}>{s.greeting}</div>
              </div>
              <div className={cn("flex items-center gap-2 border-t p-2", dark ? "border-white/10 bg-[#0d1117]" : "border-n200 bg-white")}>
                <div className={cn("h-8 flex-1 rounded-lg px-2.5 text-[11px] leading-8", dark ? "bg-white/5 text-n400" : "bg-n100 text-n400")}>Type a message…</div>
                <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: s.accent }}><Send className="h-3.5 w-3.5" /></span>
              </div>
            </div>
          ) : null}
          <div className={cn(s.position === "right" ? "flex justify-end" : "flex justify-start", open && "mt-2")}>
            <span className="grid h-12 w-12 place-items-center rounded-full text-white shadow-lg" style={{ background: s.accent }}><IconAI className="h-6 w-6" /></span>
          </div>
        </div>
      </div>
    </div>
  );
}

const EMBED = `<script>
  (function () {
    var s = document.createElement('script');
    s.src = 'https://cdn.krakd.ai/widget.js';
    s.async = true;
    s.dataset.dealer = 'downtown-auto';
    document.head.appendChild(s);
  })();
</script>`;

export function WidgetTab() {
  const [s, setS] = useState({ ...WIDGET_DEFAULTS });
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((p) => ({ ...p, [k]: v }));
  const copy = () => { navigator.clipboard?.writeText(EMBED); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* controls */}
      <div className="space-y-5">
        <Section icon={Palette} title="Appearance" desc="Match the widget to your dealership brand.">
          <Field label="Accent color">
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => <button key={c} onClick={() => set("accent", c)} className={cn("h-7 w-7 rounded-full ring-offset-2 transition", s.accent === c && "ring-2 ring-n900")} style={{ background: c }} />)}
              <label className="flex items-center gap-1.5 rounded-lg border border-n200 px-2 py-1 text-[12px] text-n600"><span className="h-4 w-4 rounded" style={{ background: s.accent }} /><input value={s.accent} onChange={(e) => set("accent", e.target.value)} className="tnum w-16 bg-transparent outline-none" /></label>
            </div>
          </Field>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-n500">Theme</span><Seg value={s.theme} onChange={(v) => set("theme", v)} options={[{ v: "light", label: "Light" }, { v: "dark", label: "Dark" }]} /></div>
            <div><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-n500">Position</span><Seg value={s.position} onChange={(v) => set("position", v)} options={[{ v: "left", label: "Left" }, { v: "right", label: "Right" }]} /></div>
          </div>
        </Section>

        <Section icon={MessageSquare} title="Messaging" desc="What buyers read before they type.">
          <div className="space-y-4">
            <Field label="Header title"><input value={s.title} onChange={(e) => set("title", e.target.value)} className={inputCls} /></Field>
            <Field label="Header subtitle"><input value={s.subtitle} onChange={(e) => set("subtitle", e.target.value)} className={inputCls} /></Field>
            <Field label="Greeting bubble" hint="Shown when the widget opens."><input value={s.greeting} onChange={(e) => set("greeting", e.target.value)} className={inputCls} /></Field>
          </div>
        </Section>

        <Section icon={Code2} title="Install on your site" desc="Paste this once before the closing </body> tag.">
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-n200 bg-n900 p-3 text-[11.5px] leading-relaxed text-n100"><code className="tnum">{EMBED}</code></pre>
            <button onClick={copy} className={cn("absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition", copied ? "bg-ok text-white" : "bg-white/10 text-white hover:bg-white/20")}>{copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy code</>}</button>
          </div>
          <p className="mt-2 text-[11.5px] text-n500">Works on any website — WordPress, Wix, Shopify or custom. No developer needed.</p>
        </Section>
      </div>

      {/* live preview */}
      <div>
        <div className="sticky top-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-n500">Live preview</span>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-n400"><span className="h-1.5 w-1.5 rounded-full bg-ok" />updates as you edit</span>
          </div>
          <Preview s={s} open />
        </div>
      </div>
    </div>
  );
}
