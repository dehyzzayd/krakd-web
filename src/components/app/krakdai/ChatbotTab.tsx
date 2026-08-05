"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { AI_CONFIG } from "@/lib/krakdai";
import { authApi, apiFetch } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { vertical as verticalDef } from "@/components/site/verticals";
import { Section, Field, Row, Switch, LinkField, inputCls } from "./controls";
import { MessageCircle, Link2, Phone, ScrollText, Check, Loader2, Code2 } from "lucide-react";
import { useToast } from "@/components/app/Toast";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const TONES = ["Friendly & casual", "Warm & professional", "Concise & direct", "Enthusiastic"];
const LANGS = ["English", "Spanish", "French", "Portuguese", "Arabic", "Vietnamese"];

type Settings = {
  persona: string; houseRules: string; languages: string[] | null; forwardPhone: string | null;
  inventoryUrl: string | null; appointmentUrl: string | null; testDriveUrl: string | null;
  creditAppUrl: string | null; financeEnabled: boolean;
};

export function ChatbotTab() {
  const { data } = useApi<Settings>("/ai/settings");
  const { data: me } = useApi<{ vertical?: string }>("/auth/me");
  const { data: site } = useApi<{ slug?: string; status?: string }>("/website");
  const toast = useToast();
  const def = verticalDef(me?.vertical);
  const auto = (me?.vertical ?? "AUTOMOTIVE") === "AUTOMOTIVE";
  const bookLabel = def.bookingLabel;                        // "Test drive" | "Viewing"
  const showCredit = auto;                                   // credit app / pre-approval is automotive-only
  const [tone, setTone] = useState(AI_CONFIG.persona);
  const [langs, setLangs] = useState<string[]>(["English", "Spanish"]);
  const [links, setLinks] = useState({ ...AI_CONFIG.links });
  const [testDrive, setTestDrive] = useState(AI_CONFIG.testDrive);
  const [creditApp, setCreditApp] = useState(AI_CONFIG.finance);
  const [forward, setForward] = useState("(512) 555-0100");
  const [rules, setRules] = useState(AI_CONFIG.custom);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [widgetOn, setWidgetOn] = useState(true);
  const toggleLang = (l: string) => setLangs((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l]);
  const setLink = (k: keyof typeof links, v: string) => setLinks((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!data) return;
    if (data.persona) setTone(data.persona);
    if (Array.isArray(data.languages) && data.languages.length) setLangs(data.languages);
    if (data.forwardPhone) setForward(data.forwardPhone);
    if (typeof data.houseRules === "string") setRules(data.houseRules);
    setCreditApp(data.financeEnabled);
    setLinks((p) => ({
      ...p,
      inventory: data.inventoryUrl ?? p.inventory,
      appointment: data.appointmentUrl ?? p.appointment,
      testDrive: data.testDriveUrl ?? p.testDrive,
      creditApp: data.creditAppUrl ?? p.creditApp,
    }));
    const chw = (data as unknown as { channels?: { website?: boolean } }).channels;
    if (chw) setWidgetOn(chw.website !== false);
  }, [data]);

  const toggleWidget = async (v: boolean) => {
    const cur = ((data as unknown as { channels?: Record<string, boolean> })?.channels) ?? {};
    setWidgetOn(v);
    try { await apiFetch("/ai/settings", { method: "PATCH", body: JSON.stringify({ channels: { ...cur, website: v } }) }); toast.success(v ? "Chat widget turned on" : "Chat widget turned off"); }
    catch { setWidgetOn(!v); toast.error("Could not update."); }
  };

  async function save() {
    setSaving(true); setSaved(false);
    try {
      await authApi.updateAiSettings({
        persona: tone, languages: langs, houseRules: rules, forwardPhone: forward,
        inventoryUrl: links.inventory, appointmentUrl: links.appointment,
        testDriveUrl: testDrive ? links.testDrive : "", creditAppUrl: creditApp ? links.creditApp : "",
        financeEnabled: creditApp,
      });
      setSaved(true); setTimeout(() => setSaved(false), 2200);
    } finally { setSaving(false); }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {/* voice */}
        <Section icon={MessageCircle} title="Voice & tone" desc="How the agent introduces itself and sounds to buyers.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Agent name"><input value="Krakd AI" readOnly title="Your AI assistant's name" className={cn(inputCls, "cursor-default bg-n50 text-n500")} /></Field>
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
            <LinkField label={`${cap(def.plural)} page`} value={links.inventory} onChange={(v) => setLink("inventory", v)} />
            <LinkField label="Book appointment" value={links.appointment} onChange={(v) => setLink("appointment", v)} />
            <div>
              <div className="mb-1 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-n500">{bookLabel}</span><Switch on={testDrive} onChange={setTestDrive} /></div>
              <input disabled={!testDrive} value={links.testDrive} onChange={(e) => setLink("testDrive", e.target.value)} className={cn(inputCls, !testDrive && "opacity-50")} />
            </div>
            {showCredit && (
              <div>
                <div className="mb-1 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-n500">Credit application</span><Switch on={creditApp} onChange={setCreditApp} /></div>
                <input disabled={!creditApp} value={links.creditApp} onChange={(e) => setLink("creditApp", e.target.value)} className={cn(inputCls, !creditApp && "opacity-50")} />
              </div>
            )}
          </div>
        </Section>

        {/* phone */}
        <Section icon={Phone} title="AI phone line" desc="The number Krakd provides for your agent to text and call leads.">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/25 bg-brand-soft/40 p-4">
            <div>
              <div className="flex items-center gap-2"><span className="tnum text-[18px] font-bold text-n900">{AI_CONFIG.phone}</span><span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Provided by Krakd</span></div>
              <p className="mt-0.5 text-[12px] text-n600">Local Austin number · SMS &amp; voice · included in your plan</p>
            </div>
          </div>
          <div className="mt-4"><Field label="Forward live calls to" hint="When a buyer asks for a person, Krakd rings this line.">
            <input value={forward} onChange={(e) => setForward(e.target.value)} className={cn(inputCls, "tnum")} /></Field></div>
        </Section>

        {/* rules */}
        <Section icon={ScrollText} title="House rules" desc="Guardrails injected on every conversation.">
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} className={cn(inputCls, "resize-none")} placeholder="e.g. Always mention our 7-day exchange policy…" />
          <p className="mt-1.5 text-[11.5px] text-n400">Treated as data — the agent still won&apos;t state a spec, price, or link that isn&apos;t real.</p>
        </Section>

        {/* website chat widget */}
        <Section icon={Code2} title="Chat widget" desc="A chat bubble that captures leads into your CRM — on your Krakd site and anywhere else.">
          <div className="flex items-center justify-between rounded-lg border border-n200 p-3">
            <div><p className="text-[12.5px] font-semibold text-n900">Show on my Krakd website</p><p className="text-[11.5px] text-n500">{site?.status === "PUBLISHED" ? "Live on your published site." : "Turns on automatically once your site is published."}</p></div>
            <Switch on={widgetOn} onChange={toggleWidget} />
          </div>
          {site?.slug && site?.status === "PUBLISHED" ? (() => {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const snippet = `<script src="${origin}/widget.js" data-slug="${site.slug}" async></script>`;
            return (
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-n500">Add to another site</p>
                <div className="rounded-lg border border-n200 bg-n900 p-3"><code className="block whitespace-pre-wrap break-all text-[11.5px] leading-relaxed text-n100">{snippet}</code></div>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(snippet); toast.success("Embed code copied"); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3.5 text-[12.5px] font-semibold text-n700 transition hover:bg-n100"><Code2 className="h-3.5 w-3.5" />Copy embed code</button>
                <p className="text-[11.5px] leading-relaxed text-n400">Paste before <code className="text-n500">&lt;/body&gt;</code> on WordPress, Wix, or any custom site — captures name + contact (with consent) and Krakd AI follows up instantly.</p>
              </div>
            );
          })() : (
            <p className="mt-3 rounded-lg bg-n50 px-3 py-2.5 text-[12.5px] text-n500">Publish your Krakd website to get the embed code for other sites.</p>
          )}
        </Section>
      </div>

      {/* rail summary */}
      <div>
        <div className="sticky top-5 space-y-4">
          <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
            <p className="text-[13px] font-semibold text-n900">Agent summary</p>
            <div className="mt-3 space-y-2 text-[12.5px]">
              {([["Tone", tone], ["Languages", `${langs.length}`], [bookLabel, testDrive ? "On" : "Off"], ...(showCredit ? [["Credit app", creditApp ? "On" : "Off"]] : []), ["Phone line", "Active"]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-n500">{k}</span><span className="font-semibold text-n900">{v}</span></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-brand/20 bg-brand-soft/30 p-4">
            <p className="text-[12px] font-semibold text-brand">What the agent does</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-n600">{auto
              ? "Responds in seconds, confirms the vehicle is still available, qualifies on financing & trade-in, books the visit, and hands off to your team when it's time."
              : `Responds in seconds, confirms the ${def.noun} is still available, answers questions, books a ${bookLabel.toLowerCase()}, and hands off to your team when it's time.`}</p>
          </div>
          <button type="button" onClick={save} disabled={saving} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-[13px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Save chatbot
          </button>
          {saved && <p className="text-center text-[12.5px] font-medium text-ok">Saved</p>}
        </div>
      </div>
    </div>
  );
}
