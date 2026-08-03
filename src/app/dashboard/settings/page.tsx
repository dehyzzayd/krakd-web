"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Building2, MapPin, Clock, Palette, Loader2, Check, Upload } from "lucide-react";
import { IntegrationsPanel } from "@/components/app/IntegrationsPanel";

const INDUSTRIES = [
  { id: "AUTOMOTIVE", label: "Automotive" }, { id: "REAL_ESTATE", label: "Real estate" },
  { id: "RESTAURANT", label: "Restaurant" }, { id: "SERVICES", label: "Services" },
  { id: "RETAIL", label: "Retail" }, { id: "MEDICAL", label: "Medical / dental" }, { id: "CONSTRUCTION", label: "Construction" }, { id: "GENERIC", label: "Something else" },
];
const US_STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Hour = { day: string; open: string; close: string };
type Settings = {
  name: string; vertical: string; phone: string | null; email: string | null;
  addressLine1: string | null; addressLine2: string | null; city: string | null; state: string | null; postalCode: string | null;
  hours: Hour[]; brandColor: string | null; logoUrl: string | null;
};

const input = "h-9 w-full rounded-lg border border-n200 bg-white px-2.5 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-n400";
const fileToDataUrl = (file: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(new Error("read failed")); r.readAsDataURL(file); });

function Section({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-n200 bg-white p-5 sh-card">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="h-4.5 w-4.5" /></span>
        <div><h4 className="text-[14px] font-semibold text-n900">{title}</h4><p className="text-[12px] text-n500">{desc}</p></div>
      </div>
      {children}
    </section>
  );
}
function L({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={cn("block", wide && "sm:col-span-2")}><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">{label}</span>{children}</label>;
}

export default function SettingsPage() {
  const { data, loading } = useApi<Settings>("/settings");
  const [f, setF] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setF({
      ...data,
      phone: data.phone ?? "", email: data.email ?? "",
      addressLine1: data.addressLine1 ?? "", addressLine2: data.addressLine2 ?? "", city: data.city ?? "", state: data.state ?? "", postalCode: data.postalCode ?? "",
      brandColor: data.brandColor ?? "#2b6ba4", logoUrl: data.logoUrl ?? "",
      hours: Array.isArray(data.hours) && data.hours.length ? data.hours : DAYS.map((day) => ({ day, open: day === "Sun" ? "Closed" : "9:00 AM", close: day === "Sun" ? "" : "6:00 PM" })),
    });
  }, [data]);

  if (loading || !f) return (<><Topbar title="Settings" /><div className="p-12 text-center text-[13px] text-n400">Loading…</div></>);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setF((p) => (p ? { ...p, [k]: v } : p));
  const setHour = (i: number, k: keyof Hour, v: string) => setF((p) => (p ? { ...p, hours: p.hours.map((h, j) => (j === i ? { ...h, [k]: v } : h)) } : p));

  const onLogo = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 1_200_000) { setErr("Logo must be under 1.2MB."); return; }
    setErr(null); set("logoUrl", await fileToDataUrl(file));
  };

  const save = async () => {
    setSaving(true); setSaved(false); setErr(null);
    const verticalChanged = data && data.vertical !== f.vertical;
    try {
      await apiFetch("/settings", { method: "PATCH", body: JSON.stringify({
        name: f.name, vertical: f.vertical, phone: f.phone || "", email: f.email || "",
        addressLine1: f.addressLine1 || "", addressLine2: f.addressLine2 || "", city: f.city || "", state: f.state || "", postalCode: f.postalCode || "",
        hours: f.hours, brandColor: f.brandColor || "", logoUrl: f.logoUrl || "",
      }) });
      // switching industry reskins the whole workspace (sidebar, terminology) — reload so it takes effect everywhere
      if (verticalChanged) { window.location.reload(); return; }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save settings."); }
    finally { setSaving(false); }
  };

  const industryChanged = data && data.vertical !== f.vertical;

  return (
    <>
      <Topbar title="Settings" />
      <div className="w-full px-6 py-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-[20px] font-bold text-n900">Settings</h1><p className="mt-0.5 text-[12px] text-n500">Your business profile — one global record, shared across every part of Krakd.</p></div>
          <button onClick={save} disabled={saving} className="btn-brand inline-flex h-9 items-center gap-2 rounded-md px-4 text-[13px] font-semibold text-white disabled:opacity-60">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{saved ? <><Check className="h-4 w-4" />Saved</> : "Save changes"}</button>
        </div>
        {err && <p className="mb-3 text-[12.5px] font-medium text-err">{err}</p>}

        <div className="grid max-w-[860px] gap-4">
          <Section icon={Building2} title="Business" desc="The name and industry that define your workspace.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <L label="Business name"><input value={f.name} onChange={(e) => set("name", e.target.value)} className={input} /></L>
              <L label="Industry">
                <select value={f.vertical} onChange={(e) => set("vertical", e.target.value)} className={input}>{INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select>
              </L>
              <L label="Phone"><input value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={cn(input, "tnum")} placeholder="(512) 555-0100" /></L>
              <L label="Email"><input value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} className={input} placeholder="hello@business.com" /></L>
            </div>
            {industryChanged && <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[12px] text-warn">Changing your industry reskins the whole workspace (listings, terminology, website). The page will refresh when you save.</p>}
          </Section>

          <Section icon={MapPin} title="Location" desc="Where your business is — shown on your website and to customers.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <L label="Street address" wide><input value={f.addressLine1 ?? ""} onChange={(e) => set("addressLine1", e.target.value)} className={input} placeholder="1100 W 6th St" /></L>
              <L label="Suite / unit"><input value={f.addressLine2 ?? ""} onChange={(e) => set("addressLine2", e.target.value)} className={input} placeholder="Suite 200" /></L>
              <L label="City"><input value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} className={input} placeholder="Austin" /></L>
              <L label="State"><select value={f.state ?? ""} onChange={(e) => set("state", e.target.value)} className={input}><option value="">—</option>{US_STATES.map((s) => <option key={s}>{s}</option>)}</select></L>
              <L label="ZIP"><input value={f.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))} className={cn(input, "tnum")} placeholder="78703" /></L>
            </div>
          </Section>

          <Section icon={Clock} title="Hours" desc="Your standard operating hours.">
            <div className="space-y-2">
              {f.hours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-[12.5px] font-semibold text-n700">{h.day}</span>
                  <input value={h.open} onChange={(e) => setHour(i, "open", e.target.value)} className={cn(input, "max-w-[130px]")} placeholder="9:00 AM" />
                  <span className="text-n400">–</span>
                  <input value={h.close} onChange={(e) => setHour(i, "close", e.target.value)} className={cn(input, "max-w-[130px]")} placeholder="6:00 PM" />
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Palette} title="Brand" desc="Your accent color and logo — used across your workspace and site.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <L label="Brand color">
                <div className="flex items-center gap-2">
                  <input type="color" value={f.brandColor ?? "#2b6ba4"} onChange={(e) => set("brandColor", e.target.value)} className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-n200 bg-white p-1" />
                  <input value={f.brandColor ?? ""} onChange={(e) => set("brandColor", e.target.value)} className={cn(input, "tnum")} placeholder="#2b6ba4" />
                </div>
              </L>
              <L label="Logo">
                <div className="flex items-center gap-3">
                  {f.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.logoUrl} alt="" className="h-9 max-w-[120px] rounded border border-n200 bg-white object-contain p-1" />
                  ) : <span className="grid h-9 w-9 place-items-center rounded border border-dashed border-n300 text-n400"><Building2 className="h-4 w-4" /></span>}
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12.5px] font-semibold text-n700 transition hover:bg-n50"><Upload className="h-3.5 w-3.5" />Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] ?? null)} /></label>
                  {f.logoUrl && <button type="button" onClick={() => set("logoUrl", "")} className="text-[12px] font-semibold text-err">Remove</button>}
                </div>
              </L>
            </div>
          </Section>

          <div className="pt-1"><IntegrationsPanel /></div>
        </div>
      </div>
    </>
  );
}
