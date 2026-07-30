"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/app/AppKit";
import { Check, Loader2, Globe, ExternalLink, Trash2, Monitor, Smartphone, Upload, RefreshCw, Plus } from "lucide-react";

export type Web = {
  id: string; slug: string; template: "MODERN" | "INVENTORY_FIRST" | "PREMIUM" | "CLASSIC" | "SPORT" | "MINIMAL" | "AURORA" | "QUIET"; status: "DRAFT" | "PUBLISHED";
  logoUrl: string | null; heroImageUrl: string | null; primaryColor: string; headerStyle: string; headline: string; intro: string; ctaLabel: string;
  aboutText: string | null; financingText: string | null; tradeInText: string | null;
  whyUs: { title: string; body: string }[]; staff: { name: string; role: string; photoUrl?: string }[]; reviews: { name: string; rating: number; body: string }[];
  pages: { id: string; slug: string; title: string; body: string; inNav?: boolean; showSidebar?: boolean }[];
  nav: { id: string; label: string; type: "home" | "inventory" | "financing" | "about" | "contact" | "page" | "link"; value?: string; visible?: boolean }[];
  sidebar: { id: string; type: "contactForm" | "address" | "hours" | "phone" | "pages" | "text"; title?: string; body?: string }[];
  vdpButtonLabel: string | null; vdpButtonUrl: string | null;
  phone: string | null; email: string | null; address: string | null; city: string | null; state: string | null; zip: string | null;
  hours: { day: string; open: string; close: string }[]; socials: Record<string, string>; sections: Record<string, boolean>;
  domain: string | null; domainProvider: string | null;
  domainStatus: "NOT_CONNECTED" | "PENDING_DNS" | "PROVISIONING" | "LIVE" | "ACTION_REQUIRED";
  domainPriceCents: number | null; domainRenewsAt: string | null;
  liveVehicles: number; publicUrl: string;
  setup: { steps: { template: boolean; details: boolean; domain: boolean; published: boolean }; done: number; total: number };
};

const field = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const textarea = "w-full rounded-md border border-n200 bg-white px-3 py-2 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none";
const money = (c: number) => `$${(c / 100).toFixed(2)}`;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not read the file"));
    r.readAsDataURL(file);
  });
}

/** Image asset uploader — reads a chosen file to a data URL (capped ~1MB). */
function Uploader({ value, onChange, label, aspect = "square" }: { value: string; onChange: (v: string) => void; label: string; aspect?: "square" | "wide" }) {
  const [err, setErr] = useState<string | null>(null);
  const pick = async (file?: File) => {
    setErr(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Choose an image file."); return; }
    if (file.size > 1_000_000) { setErr("Image must be under 1MB."); return; }
    try { onChange(await fileToDataUrl(file)); } catch { setErr("Could not read the file."); }
  };
  const box = aspect === "wide" ? "h-20 w-36" : "h-20 w-20";
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={cn("shrink-0 overflow-hidden rounded-lg border border-n200 bg-n50", box)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-[11px] text-n400">No image</div>}
        </div>
        <div className="space-y-1.5">
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-n200 bg-white px-3 text-[12.5px] font-semibold text-n700 hover:bg-n100">
            <Upload className="h-3.5 w-3.5" />Upload {label}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {value && <button onClick={() => onChange("")} className="ml-2 text-[12px] font-medium text-err">Remove</button>}
          <p className="text-[11px] text-n400">PNG, JPG or SVG · under 1MB</p>
        </div>
      </div>
      {err && <p className="mt-1 text-[12px] font-medium text-err">{err}</p>}
    </div>
  );
}

const TEMPLATES = [
  { v: "MODERN", n: "01", name: "Modern", desc: "Bright bento layout — rounded, friendly, colorful." },
  { v: "INVENTORY_FIRST", n: "02", name: "Inventory First", desc: "Black & industrial with a scrolling ticker; cars up front." },
  { v: "PREMIUM", n: "03", name: "Premium", desc: "Ivory + serif editorial — luxury gallery feel." },
  { v: "CLASSIC", n: "04", name: "Classic", desc: "Corporate franchise — utility bar, blue, boxy and trustworthy." },
  { v: "SPORT", n: "05", name: "Sport", desc: "Charcoal performance look — angular, bold, accent-lined." },
  { v: "MINIMAL", n: "06", name: "Minimal", desc: "Airy & Scandinavian — hairlines, whitespace, restrained." },
  { v: "AURORA", n: "07", name: "Aurora", desc: "Dark navy + vivid accent, heavy lowercase display, circular badge." },
  { v: "QUIET", n: "08", name: "Quiet", desc: "Warm off-white + teal, utility bar, calm and premium." },
] as const;

/** Fills its card width with a scaled, live preview of one template's home. */
function TemplateThumb({ template, height = 240 }: { template: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1280);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-n100" style={{ height }}>
      <iframe src={`/website-preview?template=${template}`} title={`${template} preview`} scrolling="no" tabIndex={-1}
        className="pointer-events-none origin-top-left"
        style={{ width: 1280, height: Math.ceil(height / scale), transform: `scale(${scale})` }} />
    </div>
  );
}

const DOMAIN_BADGE: Record<Web["domainStatus"], { label: string; cls: string }> = {
  NOT_CONNECTED: { label: "Not connected", cls: "bg-n100 text-n600" },
  PENDING_DNS: { label: "Pending DNS", cls: "bg-warn-soft text-warn" },
  PROVISIONING: { label: "Provisioning", cls: "bg-brand-soft text-brand" },
  LIVE: { label: "Live", cls: "bg-ok-soft text-ok" },
  ACTION_REQUIRED: { label: "Action required", cls: "bg-err-soft text-err" },
};

/* ─────────────────────────── Overview ─────────────────────────── */
export function OverviewPanel({ w, reload, go }: { w: Web; reload: () => void; go: (t: string) => void }) {
  const [busy, setBusy] = useState(false);
  const dstatus = DOMAIN_BADGE[w.domainStatus];
  const CHECKS: [string, boolean, string, string][] = [
    ["Template chosen", w.setup.steps.template, "design", TEMPLATES.find((t) => t.v === w.template)!.name],
    ["Dealership details", w.setup.steps.details, "contact", w.setup.steps.details ? "Complete" : "Add contact info"],
    ["Domain connected", w.setup.steps.domain, "domain", dstatus.label],
    ["Published", w.setup.steps.published, "publish", w.status === "PUBLISHED" ? "Live" : "Not yet"],
  ];

  const publish = async (status: "PUBLISHED" | "DRAFT") => {
    setBusy(true);
    try { await apiFetch("/website/publish", { method: "POST", body: JSON.stringify({ status }) }); reload(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Could not update the website."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Template", TEMPLATES.find((t) => t.v === w.template)!.name], ["Website status", w.status === "PUBLISHED" ? "Published" : "Draft"], ["Domain", dstatus.label], ["Live vehicles", `${w.liveVehicles}`]].map(([l, v]) => (
          <Card key={l} className="p-4"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="mt-1.5 text-[17px] font-semibold text-n900">{v}</p></Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <h3 className="text-[14px] font-semibold text-n900">Setup progress</h3>
          <p className="mt-0.5 text-[12.5px] text-n500">{w.setup.done} of {w.setup.total} steps complete</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-n100"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(w.setup.done / w.setup.total) * 100}%` }} /></div>
          <div className="mt-4 space-y-2">
            {CHECKS.map(([label, done, tab, hint]) => (
              <button key={label} onClick={() => go(tab)} className="flex w-full items-center gap-3 rounded-lg border border-n200 px-3 py-2.5 text-left transition hover:bg-n50">
                <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full", done ? "bg-ok text-white" : "border border-n300 text-transparent")}>{done && <Check className="h-3 w-3" />}</span>
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-n900">{label}</span></span>
                <span className="shrink-0 text-[12px] text-n500">{hint}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <h3 className="text-[14px] font-semibold text-n900">Your website</h3>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-n50 px-3 py-2.5">
            <Globe className="h-4 w-4 shrink-0 text-n500" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-n700">{w.publicUrl.replace(/^https?:\/\//, "")}</span>
            {w.status === "PUBLISHED" && <a href={w.publicUrl} target="_blank" rel="noreferrer" className="shrink-0 text-brand"><ExternalLink className="h-4 w-4" /></a>}
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-n500">
            {w.status === "PUBLISHED" ? "Your site is live. Your catalog and leads sync automatically with Krakd." : "Finish setup, then publish to take your site live in minutes."}
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {w.status === "PUBLISHED" ? (
              <>
                <a href={w.publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">View live site<ExternalLink className="h-3.5 w-3.5" /></a>
                <button disabled={busy} onClick={() => publish("DRAFT")} className="inline-flex h-9 items-center rounded-lg border border-n200 bg-white px-4 text-[12.5px] font-semibold text-n700 hover:bg-n100 disabled:opacity-60">Unpublish</button>
              </>
            ) : (
              <button disabled={busy} onClick={() => publish("PUBLISHED")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Publish website</button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────── Template ─────────────────────────── */
export function TemplatePanel({ w, reload }: { w: Web; reload: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const pick = async (template: string) => {
    setBusy(template);
    try { await apiFetch("/website", { method: "PATCH", body: JSON.stringify({ template }) }); reload(); }
    finally { setBusy(null); }
  };
  return (
    <div>
      <p className="mb-4 text-[13.5px] text-n600">Three pre-built designs, previewed with <span className="font-semibold text-n800">your</span> content and inventory. The data stays the same — only the look changes. Switch anytime.</p>
      <div className="grid gap-5 lg:grid-cols-3">
        {TEMPLATES.map((t) => {
          const on = w.template === t.v;
          return (
            <Card key={t.v} className={cn("overflow-hidden transition", on && "ring-2 ring-brand")}>
              {/* live scaled preview of this template's home — fills the card width */}
              <div className="relative border-b border-n200">
                <TemplateThumb template={t.v} />
                {on && <span className="absolute right-2 top-2 z-10 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white shadow">Selected</span>}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2"><span className="text-[11px] font-bold text-n400">{t.n}</span><span className="text-[14px] font-semibold text-n900">{t.name}</span></div>
                <p className="mt-1 text-[12px] text-n500">{t.desc}</p>
                <div className="mt-3 flex gap-2">
                  <a href={`/website-preview?template=${t.v}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-semibold text-n700 hover:bg-n50">Full preview</a>
                  <button disabled={busy === t.v || on} onClick={() => pick(t.v)} className={cn("inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-[12.5px] font-semibold transition", on ? "border border-brand bg-brand-soft text-brand" : "bg-brand text-white hover:bg-brand-hover")}>
                    {busy === t.v && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{on ? "Selected" : "Use this design"}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── shared editor bits ─────────────────────────── */
function L({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}{hint && <span className="ml-1.5 text-[11.5px] font-normal text-n400">{hint}</span>}</label>{children}</div>;
}
function useSave(reload: () => void) {
  const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false); const [err, setErr] = useState<string | null>(null);
  const save = async (payload: Record<string, unknown>) => {
    setErr(null); setBusy(true);
    try { await apiFetch("/website", { method: "PATCH", body: JSON.stringify(payload) }); setSaved(true); setTimeout(() => setSaved(false), 2000); reload(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(false); }
  };
  return { busy, saved, err, save };
}
function SaveBar({ busy, saved, err, onSave, label = "Save" }: { busy: boolean; saved: boolean; err: string | null; onSave: () => void; label?: string }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {err && <span className="text-[12.5px] font-medium text-err">{err}</span>}
      {saved && <span className="text-[12.5px] font-medium text-ok">Saved</span>}
      <button onClick={onSave} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{label}</button>
    </div>
  );
}

/* ─────────────────────────── Branding ─────────────────────────── */
export function BrandingPanel({ w, reload }: { w: Web; reload: () => void }) {
  const [primaryColor, setColor] = useState(w.primaryColor);
  const [headerStyle, setHeader] = useState(w.headerStyle ?? "auto");
  const [logoUrl, setLogo] = useState(w.logoUrl ?? "");
  const [heroImageUrl, setHero] = useState(w.heroImageUrl ?? "");
  const s = useSave(reload);
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-n900">Brand</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <L label="Brand color"><div className="flex items-center gap-2"><input type="color" value={primaryColor} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 shrink-0 rounded-md border border-n200" /><input value={primaryColor} onChange={(e) => setColor(e.target.value)} className={cn(field, "tnum")} /></div></L>
          <L label="Navbar style"><div className="grid grid-cols-4 gap-1.5">{(["auto", "light", "dark", "accent"] as const).map((v) => <button key={v} type="button" onClick={() => setHeader(v)} className={cn("h-9 rounded-md border text-[12.5px] font-medium capitalize transition", headerStyle === v ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n50")}>{v === "accent" ? "Brand" : v}</button>)}</div></L>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <L label="Logo"><Uploader value={logoUrl} onChange={setLogo} label="logo" aspect="wide" /></L>
          <L label="Hero background"><Uploader value={heroImageUrl} onChange={setHero} label="hero" aspect="wide" /></L>
        </div>
      </Card>
      <SaveBar {...s} onSave={() => s.save({ primaryColor, headerStyle, logoUrl, heroImageUrl })} label="Save branding" />
    </div>
  );
}

/* ─────────────────────────── Homepage ─────────────────────────── */
export function HomepagePanel({ w, reload }: { w: Web; reload: () => void }) {
  const [f, setF] = useState({ headline: w.headline, intro: w.intro, ctaLabel: w.ctaLabel, aboutText: w.aboutText ?? "", financingText: w.financingText ?? "", tradeInText: w.tradeInText ?? "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [whyUs, setWhyUs] = useState(w.whyUs ?? []);
  const [reviews, setReviews] = useState(w.reviews ?? []);
  const [sections, setSections] = useState<Record<string, boolean>>(w.sections ?? {});
  const toggle = (k: string) => setSections((p) => ({ ...p, [k]: p[k] === false }));
  const s = useSave(reload);
  return (
    <div className="space-y-5">
      <Card className="p-5"><h3 className="mb-4 text-[14px] font-semibold text-n900">Hero &amp; content</h3>
        <div className="space-y-4">
          <L label="Headline"><input value={f.headline} onChange={(e) => set("headline", e.target.value)} className={field} /></L>
          <L label="Intro"><textarea value={f.intro} onChange={(e) => set("intro", e.target.value)} rows={2} className={textarea} /></L>
          <L label="Button label"><input value={f.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} className={field} /></L>
          <L label="About"><textarea value={f.aboutText} onChange={(e) => set("aboutText", e.target.value)} rows={3} className={textarea} /></L>
          <div className="grid gap-4 sm:grid-cols-2"><L label="Financing blurb"><textarea value={f.financingText} onChange={(e) => set("financingText", e.target.value)} rows={2} className={textarea} /></L><L label="Trade-in blurb"><textarea value={f.tradeInText} onChange={(e) => set("tradeInText", e.target.value)} rows={2} className={textarea} /></L></div>
        </div>
      </Card>
      <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-[14px] font-semibold text-n900">Why choose us</h3>{whyUs.length < 6 && <button type="button" onClick={() => setWhyUs((p) => [...p, { title: "", body: "" }])} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"><Plus className="h-3.5 w-3.5" />Add</button>}</div>
        <div className="space-y-3">{whyUs.map((row, i) => (<div key={i} className="rounded-lg border border-n200 p-3"><div className="mb-2 flex gap-2"><input value={row.title} placeholder="Title" onChange={(e) => setWhyUs((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className={cn(field, "flex-1")} /><button type="button" onClick={() => setWhyUs((p) => p.filter((_, j) => j !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-n400 hover:bg-err-soft hover:text-err"><Trash2 className="h-4 w-4" /></button></div><textarea value={row.body} placeholder="Description" rows={2} onChange={(e) => setWhyUs((p) => p.map((x, j) => j === i ? { ...x, body: e.target.value } : x))} className={textarea} /></div>))}</div>
      </Card>
      <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-[14px] font-semibold text-n900">Reviews</h3><button type="button" onClick={() => setReviews((p) => [...p, { name: "", rating: 5, body: "" }])} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"><Plus className="h-3.5 w-3.5" />Add</button></div>
        <div className="space-y-3">{reviews.map((row, i) => (<div key={i} className="rounded-lg border border-n200 p-3"><div className="mb-2 flex gap-2"><input value={row.name} placeholder="Customer" onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={cn(field, "flex-1")} /><select value={row.rating} onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, rating: +e.target.value } : x))} className={cn(field, "w-20")}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}★</option>)}</select><button type="button" onClick={() => setReviews((p) => p.filter((_, j) => j !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-n400 hover:bg-err-soft hover:text-err"><Trash2 className="h-4 w-4" /></button></div><textarea value={row.body} placeholder="What they said" rows={2} onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, body: e.target.value } : x))} className={textarea} /></div>))}</div>
      </Card>
      <Card className="p-5"><h3 className="mb-3 text-[14px] font-semibold text-n900">Homepage sections</h3><div className="grid gap-2 sm:grid-cols-2">{([["trustBar", "Trust bar"], ["shopByType", "Shop by type"], ["financing", "Financing band"], ["reviews", "Reviews"], ["whyUs", "Why choose us"], ["about", "About"]] as const).map(([k, label]) => { const on = sections[k] !== false; return <button key={k} type="button" onClick={() => toggle(k)} className="flex items-center justify-between rounded-lg border border-n200 px-3 py-2.5 text-left hover:bg-n50"><span className="text-[13px] font-medium text-n900">{label}</span><span className={cn("relative h-5 w-9 rounded-full transition", on ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", on ? "left-4" : "left-0.5")} /></span></button>; })}</div></Card>
      <SaveBar {...s} onSave={() => s.save({ ...f, whyUs: whyUs.filter((x) => x.title.trim() || x.body.trim()), reviews: reviews.filter((x) => x.body.trim()), sections })} label="Save homepage" />
    </div>
  );
}

/* ─────────────────────────── Contact & team ─────────────────────────── */
export function ContactPanel({ w, reload }: { w: Web; reload: () => void }) {
  const [f, setF] = useState({ phone: w.phone ?? "", email: w.email ?? "", address: w.address ?? "", city: w.city ?? "", state: w.state ?? "", zip: w.zip ?? "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [hours, setHours] = useState(w.hours.length ? w.hours : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({ day, open: "9:00 AM", close: "7:00 PM" })));
  const setHour = (i: number, k: "open" | "close", v: string) => setHours((p) => p.map((h, j) => j === i ? { ...h, [k]: v } : h));
  const [staff, setStaff] = useState(w.staff ?? []);
  const [socials, setSocials] = useState<Record<string, string>>(w.socials ?? {});
  const s = useSave(reload);
  return (
    <div className="space-y-5">
      <Card className="p-5"><h3 className="mb-4 text-[14px] font-semibold text-n900">Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Phone"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={cn(field, "tnum")} /></L>
          <L label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} className={field} /></L>
          <L label="Address"><input value={f.address} onChange={(e) => set("address", e.target.value)} className={field} /></L>
          <div className="grid grid-cols-3 gap-2"><L label="City"><input value={f.city} onChange={(e) => set("city", e.target.value)} className={field} /></L><L label="State"><input value={f.state} onChange={(e) => set("state", e.target.value)} className={field} /></L><L label="ZIP"><input value={f.zip} onChange={(e) => set("zip", e.target.value)} className={cn(field, "tnum")} /></L></div>
        </div>
      </Card>
      <Card className="p-5"><h3 className="mb-4 text-[14px] font-semibold text-n900">Business hours</h3><div className="space-y-2">{hours.map((h, i) => (<div key={h.day} className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2"><span className="text-[13px] font-medium text-n700">{h.day}</span><input value={h.open} onChange={(e) => setHour(i, "open", e.target.value)} className={field} /><input value={h.close} onChange={(e) => setHour(i, "close", e.target.value)} className={field} /></div>))}</div></Card>
      <Card className="p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-[14px] font-semibold text-n900">Team</h3><button type="button" onClick={() => setStaff((p) => [...p, { name: "", role: "", photoUrl: "" }])} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"><Plus className="h-3.5 w-3.5" />Add</button></div>
        <div className="space-y-3">{staff.map((row, i) => (<div key={i} className="flex items-start gap-3 rounded-lg border border-n200 p-3"><Uploader value={row.photoUrl ?? ""} onChange={(v) => setStaff((p) => p.map((x, j) => j === i ? { ...x, photoUrl: v } : x))} label="photo" /><div className="flex-1 space-y-2"><input value={row.name} placeholder="Name" onChange={(e) => setStaff((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={field} /><input value={row.role} placeholder="Role" onChange={(e) => setStaff((p) => p.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} className={field} /></div><button type="button" onClick={() => setStaff((p) => p.filter((_, j) => j !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-n400 hover:bg-err-soft hover:text-err"><Trash2 className="h-4 w-4" /></button></div>))}</div>
      </Card>
      <Card className="p-5"><h3 className="mb-4 text-[14px] font-semibold text-n900">Social links</h3><div className="grid gap-4 sm:grid-cols-2">{(["facebook", "instagram", "youtube", "twitter", "linkedin"] as const).map((k) => (<L key={k} label={k[0].toUpperCase() + k.slice(1)}><input value={socials[k] ?? ""} onChange={(e) => setSocials((p) => ({ ...p, [k]: e.target.value }))} placeholder="https://…" className={field} /></L>))}</div></Card>
      <SaveBar {...s} onSave={() => s.save({ ...f, hours, staff: staff.filter((x) => x.name.trim()), socials })} label="Save contact" />
    </div>
  );
}

/* ─────────────────────────── Pages (custom) ─────────────────────────── */
const slugify = (x: string) => x.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
export function PagesPanel({ w, reload }: { w: Web; reload: () => void }) {
  const [pages, setPages] = useState(w.pages ?? []);
  const upd = (i: number, patch: Partial<(typeof pages)[number]>) => setPages((p) => p.map((x, j) => j === i ? { ...x, ...patch } : x));
  const add = () => setPages((p) => [...p, { id: `p${p.length}-${Math.max(1, p.length + 1)}`, slug: "", title: "", body: "", inNav: true, showSidebar: true }]);
  const s = useSave(reload);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h3 className="text-[15px] font-semibold text-n900">Custom pages</h3><p className="text-[12.5px] text-n500">Create pages (Service, Careers, Locations…), write in plain text, add to the nav.</p></div><button onClick={add} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-[12.5px] font-semibold text-white hover:bg-brand-hover"><Plus className="h-3.5 w-3.5" />New page</button></div>
      {pages.length === 0 && <Card className="p-8 text-center text-[13px] text-n500">No custom pages yet. Create one — it gets its own URL and can appear in your navbar.</Card>}
      {pages.map((pg, i) => (
        <Card key={pg.id} className="p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <L label="Title"><input value={pg.title} onChange={(e) => { const t = e.target.value; upd(i, { title: t, slug: pg.slug || slugify(t) }); }} placeholder="Service & Parts" className={field} /></L>
            <L label="URL slug" hint={`/${pg.slug || "…"}`}><input value={pg.slug} onChange={(e) => upd(i, { slug: slugify(e.target.value) })} placeholder="service" className={cn(field, "tnum")} /></L>
          </div>
          <div className="mt-3"><L label="Content"><textarea value={pg.body} onChange={(e) => upd(i, { body: e.target.value })} rows={7} placeholder={"Write in plain English.\n\nBlank line = new paragraph.\n## Heading\n- bullet point"} className={cn(textarea, "font-mono text-[12.5px]")} /></L></div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-[13px] text-n700"><input type="checkbox" checked={pg.inNav ?? false} onChange={(e) => upd(i, { inNav: e.target.checked })} />Show in navbar</label>
            <label className="flex items-center gap-2 text-[13px] text-n700"><input type="checkbox" checked={pg.showSidebar ?? false} onChange={(e) => upd(i, { showSidebar: e.target.checked })} />Page sidebar</label>
            <a href={`/site/${w.slug}/${pg.slug}`} target="_blank" rel="noreferrer" className="text-[12.5px] font-semibold text-brand">Preview ↗</a>
            <button onClick={() => setPages((p) => p.filter((_, j) => j !== i))} className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-err"><Trash2 className="h-3.5 w-3.5" />Delete</button>
          </div>
        </Card>
      ))}
      <SaveBar {...s} onSave={() => s.save({ pages: pages.filter((p) => p.slug.trim() && p.title.trim()) })} label="Save pages" />
    </div>
  );
}

/* ─────────────────────────── Vehicle page (VDP) ─────────────────────────── */
export function VehiclePanel({ w, reload }: { w: Web; reload: () => void }) {
  const [label, setLabel] = useState(w.vdpButtonLabel ?? "");
  const [url, setUrl] = useState(w.vdpButtonUrl ?? "");
  const s = useSave(reload);
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="mb-1 text-[14px] font-semibold text-n900">Vehicle detail page</h3>
        <p className="mb-4 text-[12.5px] text-n500">Add a custom call-to-action button shown on every vehicle&apos;s page — link it anywhere (a form, a value-your-trade tool, a video).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Button label"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Learn more" className={field} /></L>
          <L label="Button link (URL)"><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={field} /></L>
        </div>
      </Card>
      <SaveBar {...s} onSave={() => s.save({ vdpButtonLabel: label, vdpButtonUrl: url })} label="Save vehicle page" />
    </div>
  );
}

/* ─────────────────────────── Navbar / menu ─────────────────────────── */
type NavRow = Web["nav"][number];
function seedNav(w: Web): NavRow[] {
  if (w.nav?.length) return w.nav;
  const base: NavRow[] = [
    { id: "home", label: "Home", type: "home", visible: true },
    { id: "inventory", label: "Inventory", type: "inventory", visible: true },
    { id: "financing", label: "Financing", type: "financing", visible: true },
    { id: "about", label: "About", type: "about", visible: true },
    { id: "contact", label: "Contact", type: "contact", visible: true },
  ];
  for (const p of w.pages ?? []) if (p.inNav) base.push({ id: `page-${p.slug}`, label: p.title, type: "page", value: p.slug, visible: true });
  return base;
}
export function NavbarPanel({ w, reload }: { w: Web; reload: () => void }) {
  const [nav, setNav] = useState<NavRow[]>(() => seedNav(w));
  const s = useSave(reload);
  const move = (i: number, dir: number) => setNav((p) => { const a = [...p]; const j = i + dir; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const upd = (i: number, patch: Partial<NavRow>) => setNav((p) => p.map((x, j) => j === i ? { ...x, ...patch } : x));
  const del = (i: number) => setNav((p) => p.filter((_, j) => j !== i));
  const used = new Set(nav.filter((n) => n.type === "page").map((n) => n.value));
  const addable = (w.pages ?? []).filter((p) => !used.has(p.slug));
  const addPage = (slug: string) => { const pg = w.pages.find((p) => p.slug === slug); if (pg) setNav((p) => [...p, { id: `page-${slug}`, label: pg.title, type: "page", value: slug, visible: true }]); };
  const addLink = () => setNav((p) => [...p, { id: `link-${p.length}-${p.length + 1}`, label: "New link", type: "link", value: "", visible: true }]);
  return (
    <div className="space-y-5">
      <div><h3 className="text-[15px] font-semibold text-n900">Navbar menu</h3><p className="text-[12.5px] text-n500">Reorder, rename, hide items, or add custom pages and external links. This is exactly what shows in your site header.</p></div>
      <Card className="p-3">
        <div className="space-y-2">
          {nav.map((it, i) => {
            const on = it.visible !== false;
            return (
              <div key={it.id} className="flex items-center gap-2 rounded-lg border border-n200 bg-white p-2">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="grid h-4 w-5 place-items-center text-[11px] text-n400 hover:text-n900 disabled:opacity-30">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === nav.length - 1} className="grid h-4 w-5 place-items-center text-[11px] text-n400 hover:text-n900 disabled:opacity-30">▼</button>
                </div>
                <input value={it.label} onChange={(e) => upd(i, { label: e.target.value })} className={cn(field, "flex-1")} />
                {it.type === "link" ? <input value={it.value ?? ""} onChange={(e) => upd(i, { value: e.target.value })} placeholder="https://…" className={cn(field, "flex-1")} /> : <span className="shrink-0 rounded bg-n100 px-2 py-1 text-[10.5px] font-medium uppercase tracking-wide text-n500">{it.type === "page" ? `/${it.value}` : it.type}</span>}
                <button onClick={() => upd(i, { visible: !on })} title={on ? "Visible" : "Hidden"} className={cn("relative h-5 w-9 shrink-0 rounded-full transition", on ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", on ? "left-4" : "left-0.5")} /></button>
                <button onClick={() => del(i)} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-n400 hover:bg-err-soft hover:text-err"><Trash2 className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-n200 pt-3">
          <button onClick={addLink} className="inline-flex items-center gap-1 rounded-lg border border-n200 px-3 py-1.5 text-[12.5px] font-semibold text-n700 hover:bg-n50"><Plus className="h-3.5 w-3.5" />External link</button>
          {addable.map((p) => <button key={p.slug} onClick={() => addPage(p.slug)} className="inline-flex items-center gap-1 rounded-lg border border-n200 px-3 py-1.5 text-[12.5px] font-semibold text-n700 hover:bg-n50"><Plus className="h-3.5 w-3.5" />{p.title}</button>)}
        </div>
      </Card>
      <SaveBar {...s} onSave={() => s.save({ nav })} label="Save menu" />
    </div>
  );
}

/* ─────────────────────────── Page sidebar ─────────────────────────── */
type SbRow = Web["sidebar"][number];
const SB_META: Record<SbRow["type"], string> = { contactForm: "Contact form", address: "Address & map", hours: "Business hours", phone: "Call button", pages: "Page links", text: "Custom text" };
const SB_DEFAULT: SbRow[] = [{ id: "d1", type: "contactForm" }, { id: "d2", type: "address" }, { id: "d3", type: "hours" }, { id: "d4", type: "pages" }];
export function SidebarPanel({ w, reload }: { w: Web; reload: () => void }) {
  const [blocks, setBlocks] = useState<SbRow[]>(() => (w.sidebar?.length ? w.sidebar : SB_DEFAULT));
  const s = useSave(reload);
  const move = (i: number, d: number) => setBlocks((p) => { const a = [...p]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const upd = (i: number, patch: Partial<SbRow>) => setBlocks((p) => p.map((x, j) => j === i ? { ...x, ...patch } : x));
  const del = (i: number) => setBlocks((p) => p.filter((_, j) => j !== i));
  const add = (type: SbRow["type"]) => setBlocks((p) => [...p, { id: `${type}-${p.length}-${p.length + 1}`, type }]);
  const present = new Set(blocks.map((b) => b.type));
  return (
    <div className="space-y-5">
      <div><h3 className="text-[15px] font-semibold text-n900">Page sidebar</h3><p className="text-[12.5px] text-n500">One sidebar shared across every page that has &quot;page sidebar&quot; on. Add, remove and reorder blocks.</p></div>
      <Card className="p-3">
        <div className="space-y-2">
          {blocks.map((b, i) => (
            <div key={b.id} className="rounded-lg border border-n200 bg-white p-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col"><button onClick={() => move(i, -1)} disabled={i === 0} className="grid h-4 w-5 place-items-center text-[11px] text-n400 hover:text-n900 disabled:opacity-30">▲</button><button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="grid h-4 w-5 place-items-center text-[11px] text-n400 hover:text-n900 disabled:opacity-30">▼</button></div>
                <span className="flex-1 text-[13px] font-semibold text-n900">{SB_META[b.type]}</span>
                <button onClick={() => del(i)} className="grid h-8 w-8 place-items-center rounded-md text-n400 hover:bg-err-soft hover:text-err"><Trash2 className="h-4 w-4" /></button>
              </div>
              {b.type === "text" ? (
                <div className="mt-2 space-y-2"><input value={b.title ?? ""} onChange={(e) => upd(i, { title: e.target.value })} placeholder="Heading" className={field} /><textarea value={b.body ?? ""} onChange={(e) => upd(i, { body: e.target.value })} rows={3} placeholder="Text…" className={textarea} /></div>
              ) : b.type !== "phone" ? (
                <input value={b.title ?? ""} onChange={(e) => upd(i, { title: e.target.value })} placeholder="Custom heading (optional)" className={cn(field, "mt-2")} />
              ) : null}
            </div>
          ))}
          {blocks.length === 0 && <p className="py-4 text-center text-[12.5px] text-n500">No blocks. Add one below.</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-n200 pt-3">
          {(Object.keys(SB_META) as SbRow["type"][]).map((t) => (
            <button key={t} onClick={() => add(t)} disabled={t !== "text" && present.has(t)} className="inline-flex items-center gap-1 rounded-lg border border-n200 px-3 py-1.5 text-[12.5px] font-semibold text-n700 hover:bg-n50 disabled:opacity-40"><Plus className="h-3.5 w-3.5" />{SB_META[t]}</button>
          ))}
        </div>
      </Card>
      <SaveBar {...s} onSave={() => s.save({ sidebar: blocks })} label="Save sidebar" />
    </div>
  );
}

/* ─────────────────────────── Domain ─────────────────────────── */
export function DomainPanel({ w, reload }: { w: Web; reload: () => void }) {
  const [mode, setMode] = useState<"existing" | "buy">(w.domainProvider === "krakd" ? "buy" : "existing");
  const [domain, setDomain] = useState("");
  const [records, setRecords] = useState<{ type: string; host: string; value: string; note: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ domain: string; available: boolean; priceCents: number }[] | null>(null);
  const badge = DOMAIN_BADGE[w.domainStatus];

  const connect = async () => {
    setErr(null); setBusy(true);
    try { const r = await apiFetch<{ dnsRecords: typeof records }>("/website/domain", { method: "POST", body: JSON.stringify({ domain }) }); setRecords(r.dnsRecords); reload(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not connect the domain."); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true);
    try { const r = await apiFetch<{ dnsRecords: typeof records }>("/website/domain/verify", { method: "POST", body: "{}" }); setRecords(r.dnsRecords); reload(); }
    finally { setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true);
    try { await apiFetch("/website/domain", { method: "DELETE" }); setRecords(null); reload(); }
    finally { setBusy(false); }
  };
  const runSearch = async () => {
    setErr(null); setBusy(true); setResults(null);
    try { const r = await apiFetch<{ results: typeof results }>(`/website/domain/search?q=${encodeURIComponent(search)}`); setResults(r.results); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Search failed."); }
    finally { setBusy(false); }
  };
  const buy = async (d: string, priceCents: number) => {
    if (!confirm(`Register ${d} for ${money(priceCents)}/yr? This is billed separately from your $149/mo subscription.`)) return;
    setBusy(true);
    try { await apiFetch("/website/domain/purchase", { method: "POST", body: JSON.stringify({ domain: d, confirmPriceCents: priceCents }) }); setResults(null); reload(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Purchase failed."); }
    finally { setBusy(false); }
  };

  // currently-connected domain view
  if (w.domain) {
    return (
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Globe className="h-5 w-5 text-n500" />
            <div><p className="text-[15px] font-semibold text-n900">{w.domain}</p><p className="text-[12px] text-n500">{w.domainProvider === "krakd" ? "Purchased through Krakd" : "Connected (you own it)"}{w.domainRenewsAt ? ` · renews ${new Date(w.domainRenewsAt).toLocaleDateString()}` : ""}</p></div>
            <span className={cn("ml-auto inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold", badge.cls)}>{badge.label}</span>
          </div>

          {(w.domainStatus === "PENDING_DNS" || w.domainStatus === "ACTION_REQUIRED") && (
            <div className="mt-4 rounded-xl border border-n200 bg-n50 p-4">
              <p className="text-[13px] font-semibold text-n900">Add these DNS records at your registrar</p>
              <p className="mt-0.5 text-[12px] text-n500">Then verify — SSL is provisioned automatically once records resolve.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead><tr className="text-left text-[11px] uppercase tracking-wide text-n500"><th className="py-1.5 pr-3">Type</th><th className="py-1.5 pr-3">Host</th><th className="py-1.5 pr-3">Value</th></tr></thead>
                  <tbody className="tnum">{(records ?? []).map((r, i) => <tr key={i} className="border-t border-n200"><td className="py-2 pr-3 font-semibold">{r.type}</td><td className="py-2 pr-3">{r.host}</td><td className="py-2 pr-3 text-n700">{r.value}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          {w.domainStatus === "PROVISIONING" && <div className="mt-4 rounded-lg bg-brand-soft/40 px-3 py-2.5 text-[12.5px] text-n700">DNS verified. Provisioning your SSL certificate — this usually completes in a moment.</div>}
          {w.domainStatus === "LIVE" && <div className="mt-4 rounded-lg bg-ok-soft px-3 py-2.5 text-[12.5px] text-ok">Your domain is live and served securely over HTTPS.</div>}

          <div className="mt-4 flex flex-wrap gap-2">
            {w.domainStatus !== "LIVE" && <button disabled={busy} onClick={verify} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{w.domainStatus === "PROVISIONING" ? "Check SSL status" : "Verify DNS"}</button>}
            <button disabled={busy} onClick={disconnect} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-n200 bg-white px-4 text-[12.5px] font-semibold text-err hover:bg-err-soft disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" />Disconnect</button>
          </div>
        </Card>
      </div>
    );
  }

  // no domain yet — choose connect vs buy
  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-lg border border-n200 bg-white p-0.5">
        {(["existing", "buy"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={cn("h-8 rounded-[7px] px-4 text-[12.5px] font-medium transition", mode === m ? "bg-n100 text-n900" : "text-n600 hover:text-n900")}>{m === "existing" ? "I own a domain" : "Buy through Krakd"}</button>)}
      </div>

      {mode === "existing" ? (
        <Card className="max-w-[560px] p-5">
          <h3 className="text-[14px] font-semibold text-n900">Connect a domain you own</h3>
          <p className="mt-1 text-[12.5px] text-n500">Enter it, then add the DNS records we show you. SSL is automatic.</p>
          <div className="mt-3 flex gap-2"><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="downtownauto.com" className={field} /><button disabled={busy || !domain} onClick={connect} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Connect</button></div>
          {err && <p className="mt-2 text-[12.5px] font-medium text-err">{err}</p>}
        </Card>
      ) : (
        <Card className="max-w-[620px] p-5">
          <h3 className="text-[14px] font-semibold text-n900">Buy a domain through Krakd</h3>
          <p className="mt-1 text-[12.5px] text-n500">Registration is billed separately from your subscription. The price is always shown before you confirm.</p>
          <div className="mt-3 flex gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="downtownauto" className={field} /><button disabled={busy || !search} onClick={runSearch} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Search</button></div>
          {err && <p className="mt-2 text-[12.5px] font-medium text-err">{err}</p>}
          {results && (
            <div className="mt-4 space-y-1.5">
              {results.map((r) => (
                <div key={r.domain} className="flex items-center gap-3 rounded-lg border border-n200 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-n900">{r.domain}</span>
                  {r.available ? <><span className="tnum text-[12.5px] font-semibold text-n700">{money(r.priceCents)}/yr</span><button disabled={busy} onClick={() => buy(r.domain, r.priceCents)} className="rounded-md bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">Buy</button></> : <span className="text-[12px] font-medium text-n400">Taken</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────── Publish (with live preview) ─────────────────────────── */
export function PublishPanel({ w, reload }: { w: Web; reload: () => void }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const publish = async () => {
    setErr(null); setBusy(true);
    try { await apiFetch("/website/publish", { method: "POST", body: JSON.stringify({ status: "PUBLISHED" }) }); reload(); setNonce((n) => n + 1); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not publish."); }
    finally { setBusy(false); }
  };
  const tab = (v: "desktop" | "mobile", Icon: typeof Monitor, label: string) => (
    <button onClick={() => setDevice(v)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[12.5px] font-medium", device === v ? "bg-n100 text-n900" : "text-n600")}><Icon className="h-4 w-4" />{label}</button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-n200 bg-white p-0.5">{tab("desktop", Monitor, "Desktop")}{tab("mobile", Smartphone, "Mobile")}</div>
        <button onClick={() => setNonce((n) => n + 1)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-medium text-n600 hover:bg-n100"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
        <div className="ml-auto flex items-center gap-3">
          {err && <span className="text-[12.5px] font-medium text-err">{err}</span>}
          {w.status === "PUBLISHED"
            ? <a href={w.publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">View live site<ExternalLink className="h-3.5 w-3.5" /></a>
            : <button onClick={publish} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-5 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Publish website</button>}
        </div>
      </div>

      <div className="rounded-2xl border border-n200 bg-n100 p-3 sm:p-5">
        <div className={cn("mx-auto overflow-hidden rounded-xl border border-n300 bg-white shadow-sm transition-all", device === "mobile" ? "w-[390px] max-w-full" : "w-full")}>
          <iframe key={nonce} src="/website-preview" title="Website preview" className="h-[74vh] w-full border-0" />
        </div>
      </div>
      <p className="text-center text-[12px] text-n400">True-to-device preview of your saved settings and inventory. Toggle Desktop / Mobile — the mobile view is exactly what phones see.{w.status !== "PUBLISHED" && " Publishing makes it public at your URL."}</p>
    </div>
  );
}
