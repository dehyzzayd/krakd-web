"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/app/AppKit";
import { Check, Loader2, Globe, ExternalLink, Trash2, Monitor, Smartphone, Upload, RefreshCw, Plus } from "lucide-react";

export type Web = {
  id: string; slug: string; template: "MODERN" | "INVENTORY_FIRST" | "PREMIUM"; status: "DRAFT" | "PUBLISHED";
  logoUrl: string | null; heroImageUrl: string | null; primaryColor: string; headerStyle: string; headline: string; intro: string; ctaLabel: string;
  aboutText: string | null; financingText: string | null; tradeInText: string | null;
  whyUs: { title: string; body: string }[]; staff: { name: string; role: string; photoUrl?: string }[]; reviews: { name: string; rating: number; body: string }[];
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
  { v: "MODERN", n: "01", name: "Modern", desc: "Balanced homepage and inventory." },
  { v: "INVENTORY_FIRST", n: "02", name: "Inventory First", desc: "Vehicle search takes priority." },
  { v: "PREMIUM", n: "03", name: "Premium", desc: "Large visuals and stronger branding." },
] as const;

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
    ["Template chosen", w.setup.steps.template, "template", TEMPLATES.find((t) => t.v === w.template)!.name],
    ["Dealership details", w.setup.steps.details, "details", w.setup.steps.details ? "Complete" : "Add contact info"],
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
            {w.status === "PUBLISHED" ? "Your site is live. Inventory and leads sync automatically with Krakd." : "Finish setup, then publish to take your dealership site live in minutes."}
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
              {/* live scaled preview of this template's home */}
              <div className="relative h-[240px] overflow-hidden border-b border-n200 bg-n100">
                <iframe src={`/website-preview?template=${t.v}`} title={`${t.name} preview`} scrolling="no" tabIndex={-1}
                  className="pointer-events-none origin-top-left"
                  style={{ width: 1280, height: 860, transform: "scale(0.286)" }} />
                {on && <span className="absolute right-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white shadow">Live</span>}
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

/* ─────────────────────────── Details ─────────────────────────── */
export function DetailsPanel({ w, reload }: { w: Web; reload: () => void }) {
  const [f, setF] = useState({
    headline: w.headline, intro: w.intro, ctaLabel: w.ctaLabel, primaryColor: w.primaryColor, headerStyle: w.headerStyle ?? "auto",
    logoUrl: w.logoUrl ?? "", heroImageUrl: w.heroImageUrl ?? "",
    aboutText: w.aboutText ?? "", financingText: w.financingText ?? "", tradeInText: w.tradeInText ?? "",
    phone: w.phone ?? "", email: w.email ?? "", address: w.address ?? "", city: w.city ?? "", state: w.state ?? "", zip: w.zip ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [hours, setHours] = useState<{ day: string; open: string; close: string }[]>(
    w.hours.length ? w.hours : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, open: "9:00 AM", close: "7:00 PM" }))
  );
  const setHour = (i: number, k: "open" | "close", v: string) => setHours((p) => p.map((h, j) => j === i ? { ...h, [k]: v } : h));

  // editable content lists (full add / edit / remove)
  const [whyUs, setWhyUs] = useState<{ title: string; body: string }[]>(w.whyUs?.length ? w.whyUs : []);
  const [staff, setStaff] = useState<{ name: string; role: string; photoUrl?: string }[]>(w.staff ?? []);
  const [reviews, setReviews] = useState<{ name: string; rating: number; body: string }[]>(w.reviews ?? []);
  const [sections, setSections] = useState<Record<string, boolean>>(w.sections ?? {});
  const [socials, setSocials] = useState<Record<string, string>>(w.socials ?? {});
  const toggleSection = (k: string) => setSections((p) => ({ ...p, [k]: p[k] === false }));
  const setSocial = (k: string, v: string) => setSocials((p) => ({ ...p, [k]: v }));

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null); setBusy(true);
    try {
      await apiFetch("/website", { method: "PATCH", body: JSON.stringify({
        ...f, logoUrl: f.logoUrl, heroImageUrl: f.heroImageUrl, hours,
        whyUs: whyUs.filter((x) => x.title.trim() || x.body.trim()),
        staff: staff.filter((x) => x.name.trim()),
        reviews: reviews.filter((x) => x.body.trim()),
        sections, socials,
      }) });
      setSaved(true); setTimeout(() => setSaved(false), 2200); reload();
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(false); }
  };

  const L = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}</label>{children}</div>;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-n900">Homepage</h3>
        <div className="space-y-4">
          <L label="Headline"><input value={f.headline} onChange={(e) => set("headline", e.target.value)} className={field} /></L>
          <L label="Short introduction"><textarea value={f.intro} onChange={(e) => set("intro", e.target.value)} rows={2} className={cn(field, "h-auto resize-none py-2")} /></L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Button label"><input value={f.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} className={field} /></L>
            <L label="Brand color"><div className="flex items-center gap-2"><input type="color" value={f.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-10 w-12 shrink-0 rounded-md border border-n200" /><input value={f.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className={cn(field, "tnum")} /></div></L>
          </div>
          <L label="Navbar style">
            <div className="grid grid-cols-4 gap-1.5">
              {([["auto", "Auto"], ["light", "Light"], ["dark", "Dark"], ["accent", "Brand"]] as const).map(([v, lbl]) => (
                <button key={v} type="button" onClick={() => set("headerStyle", v)} className={cn("h-9 rounded-md border text-[12.5px] font-medium transition", f.headerStyle === v ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n50")}>{lbl}</button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] text-n400"><span className="font-medium">Brand</span> paints the navbar in your brand color · <span className="font-medium">Auto</span> follows the template.</p>
          </L>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-n900">Branding assets</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <L label="Logo"><Uploader value={f.logoUrl} onChange={(v) => set("logoUrl", v)} label="logo" aspect="wide" /></L>
          <L label="Hero background (optional)"><Uploader value={f.heroImageUrl} onChange={(v) => set("heroImageUrl", v)} label="hero" aspect="wide" /></L>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-n900">Page content</h3>
        <div className="space-y-4">
          <L label="About your dealership"><textarea value={f.aboutText} onChange={(e) => set("aboutText", e.target.value)} rows={3} placeholder="Tell buyers who you are…" className={textarea} /></L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Financing blurb"><textarea value={f.financingText} onChange={(e) => set("financingText", e.target.value)} rows={2} placeholder="How financing works at your store…" className={textarea} /></L>
            <L label="Trade-in blurb"><textarea value={f.tradeInText} onChange={(e) => set("tradeInText", e.target.value)} rows={2} placeholder="Your sell-us-your-car pitch…" className={textarea} /></L>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-n900">Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Phone"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={cn(field, "tnum")} /></L>
          <L label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} className={field} /></L>
          <L label="Address"><input value={f.address} onChange={(e) => set("address", e.target.value)} className={field} /></L>
          <div className="grid grid-cols-3 gap-2">
            <L label="City"><input value={f.city} onChange={(e) => set("city", e.target.value)} className={field} /></L>
            <L label="State"><input value={f.state} onChange={(e) => set("state", e.target.value)} className={field} /></L>
            <L label="ZIP"><input value={f.zip} onChange={(e) => set("zip", e.target.value)} className={cn(field, "tnum")} /></L>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-n900">Business hours</h3>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={h.day} className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2">
              <span className="text-[13px] font-medium text-n700">{h.day}</span>
              <input value={h.open} onChange={(e) => setHour(i, "open", e.target.value)} className={field} />
              <input value={h.close} onChange={(e) => setHour(i, "close", e.target.value)} className={field} />
            </div>
          ))}
        </div>
      </Card>

      {/* Why choose us — add/edit/remove */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-n900">Why choose us</h3>
          {whyUs.length < 6 && <button type="button" onClick={() => setWhyUs((p) => [...p, { title: "", body: "" }])} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"><Plus className="h-3.5 w-3.5" />Add point</button>}
        </div>
        {whyUs.length === 0 && <p className="text-[12.5px] text-n400">Using default points. Add your own to override them.</p>}
        <div className="space-y-3">
          {whyUs.map((row, i) => (
            <div key={i} className="rounded-lg border border-n200 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input value={row.title} placeholder="Title (e.g. Hand-picked inventory)" onChange={(e) => setWhyUs((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className={cn(field, "flex-1")} />
                <button type="button" onClick={() => setWhyUs((p) => p.filter((_, j) => j !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-n400 hover:bg-err-soft hover:text-err"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea value={row.body} placeholder="One or two sentences…" rows={2} onChange={(e) => setWhyUs((p) => p.map((x, j) => j === i ? { ...x, body: e.target.value } : x))} className={textarea} />
            </div>
          ))}
        </div>
      </Card>

      {/* Team — add/edit/remove with photo upload */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-n900">Meet the team</h3>
          <button type="button" onClick={() => setStaff((p) => [...p, { name: "", role: "", photoUrl: "" }])} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"><Plus className="h-3.5 w-3.5" />Add person</button>
        </div>
        {staff.length === 0 && <p className="text-[12.5px] text-n400">No team members yet. Add people to show a “Meet the team” section on your About page.</p>}
        <div className="space-y-3">
          {staff.map((row, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-n200 p-3">
              <Uploader value={row.photoUrl ?? ""} onChange={(v) => setStaff((p) => p.map((x, j) => j === i ? { ...x, photoUrl: v } : x))} label="photo" />
              <div className="flex-1 space-y-2">
                <input value={row.name} placeholder="Name" onChange={(e) => setStaff((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={field} />
                <input value={row.role} placeholder="Role (e.g. Finance Manager)" onChange={(e) => setStaff((p) => p.map((x, j) => j === i ? { ...x, role: e.target.value } : x))} className={field} />
              </div>
              <button type="button" onClick={() => setStaff((p) => p.filter((_, j) => j !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-n400 hover:bg-err-soft hover:text-err"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </Card>

      {/* Reviews — add/edit/remove */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-n900">Customer reviews</h3>
          {reviews.length < 24 && <button type="button" onClick={() => setReviews((p) => [...p, { name: "", rating: 5, body: "" }])} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"><Plus className="h-3.5 w-3.5" />Add review</button>}
        </div>
        {reviews.length === 0 && <p className="text-[12.5px] text-n400">Showing sample reviews. Add real ones to replace them.</p>}
        <div className="space-y-3">
          {reviews.map((row, i) => (
            <div key={i} className="rounded-lg border border-n200 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input value={row.name} placeholder="Customer name" onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={cn(field, "flex-1")} />
                <select value={row.rating} onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, rating: +e.target.value } : x))} className={cn(field, "w-24")}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select>
                <button type="button" onClick={() => setReviews((p) => p.filter((_, j) => j !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-n400 hover:bg-err-soft hover:text-err"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea value={row.body} placeholder="What they said…" rows={2} onChange={(e) => setReviews((p) => p.map((x, j) => j === i ? { ...x, body: e.target.value } : x))} className={textarea} />
            </div>
          ))}
        </div>
      </Card>

      {/* Homepage sections — show/hide */}
      <Card className="p-5">
        <h3 className="mb-1 text-[14px] font-semibold text-n900">Homepage sections</h3>
        <p className="mb-3 text-[12px] text-n500">Turn sections on or off. Hero and featured inventory always show.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {([["trustBar", "Trust bar"], ["shopByType", "Shop by type"], ["financing", "Financing band"], ["reviews", "Customer reviews"], ["whyUs", "Why choose us"], ["about", "About / welcome"]] as const).map(([k, label]) => {
            const on = sections[k] !== false;
            return (
              <button key={k} type="button" onClick={() => toggleSection(k)} className="flex items-center justify-between rounded-lg border border-n200 px-3 py-2.5 text-left transition hover:bg-n50">
                <span className="text-[13px] font-medium text-n900">{label}</span>
                <span className={cn("relative h-5 w-9 rounded-full transition", on ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", on ? "left-4" : "left-0.5")} /></span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Social links */}
      <Card className="p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-n900">Social links <span className="font-normal text-n400">· shown in the footer</span></h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["facebook", "instagram", "youtube", "twitter", "linkedin"] as const).map((k) => (
            <L key={k} label={k[0].toUpperCase() + k.slice(1)}><input value={socials[k] ?? ""} onChange={(e) => setSocial(k, e.target.value)} placeholder="https://…" className={field} /></L>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {err && <span className="text-[12.5px] font-medium text-err">{err}</span>}
        {saved && <span className="text-[12.5px] font-medium text-ok">Saved</span>}
        <button onClick={save} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Save details</button>
      </div>
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
