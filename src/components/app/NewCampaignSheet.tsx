"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { Slider, RangeSlider } from "./Slider";
import { AdPreview, CTA_LABEL, type AdCreative } from "./AdPreview";
import { apiFetch, ApiError } from "@/lib/api";
import { vertical as verticalDef } from "@/components/site/verticals";
import { Check, Sparkles, ChevronLeft, ShieldCheck, Images, Square, Search, Car, Wifi, WifiOff } from "lucide-react";

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const areaCls = "w-full rounded-md border border-n200 bg-white px-3 py-2 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

type Net = "FACEBOOK" | "INSTAGRAM" | "GOOGLE";
const NETWORKS: { v: Net; label: string; sub: string; logo: string; connected: boolean }[] = [
  { v: "FACEBOOK", label: "Facebook", sub: "Page feed, Marketplace, Reels", logo: "/logos/facebook.svg", connected: true },
  { v: "INSTAGRAM", label: "Instagram", sub: "Feed & Stories", logo: "/logos/instagram.svg", connected: false },
  { v: "GOOGLE", label: "Google", sub: "Search, Vehicle Ads & PMax", logo: "/logos/google.svg", connected: true },
];
const FORMATS: Record<Net, { v: string; label: string; desc: string; Icon: typeof Square }[]> = {
  FACEBOOK: [{ v: "SINGLE_IMAGE", label: "Single image", desc: "One vehicle, one photo", Icon: Square }, { v: "CAROUSEL", label: "Carousel", desc: "Multiple vehicles, swipeable", Icon: Images }],
  INSTAGRAM: [{ v: "SINGLE_IMAGE", label: "Single image", desc: "One vehicle, one photo", Icon: Square }, { v: "CAROUSEL", label: "Carousel", desc: "Multiple vehicles, swipeable", Icon: Images }],
  GOOGLE: [{ v: "VEHICLE", label: "Vehicle ads", desc: "Inventory with photo + price", Icon: Car }, { v: "SEARCH", label: "Search ad", desc: "Text ad on Google Search", Icon: Search }],
};

const OBJECTIVES = [{ v: "LEADS", label: "Leads" }, { v: "CALLS", label: "Calls" }, { v: "TRAFFIC", label: "Traffic" }, { v: "MESSAGES", label: "Messages" }] as const;
const FREQS = [{ v: "MONTHLY", label: "Monthly" }, { v: "WEEKLY", label: "Weekly" }, { v: "ONE_TIME", label: "One-time" }] as const;
const CTA_BY_OBJECTIVE: Record<string, string> = { LEADS: "GET_OFFER", CALLS: "CALL_NOW", TRAFFIC: "SHOP_NOW", MESSAGES: "SEND_MESSAGE" };
const STEPS = ["Network", "Format", "Setup", "Audience", "Creative"] as const;

type Veh = { id: string; year: number; make: string; model: string; trim: string; price: number; image: string | null };

function Labeled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-[13px] font-medium text-n900">{label}{hint && <span className="ml-1.5 text-[11.5px] font-normal text-n400">{hint}</span>}</label>{children}</div>;
}
function Pills<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly { v: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value === o.v;
        return <button key={o.v} type="button" onClick={() => onChange(o.v)} className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition", on ? "border-brand bg-brand text-white" : "border-n200 bg-white text-n600 hover:bg-n50")}>{o.label}</button>;
      })}
    </div>
  );
}
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export function NewCampaignSheet({ open, onClose, onCreated, initialNetwork }: { open: boolean; onClose: () => void; onCreated: () => void; initialNetwork?: Net }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: "", channel: "FACEBOOK" as Net, format: "SINGLE_IMAGE", objective: "LEADS" as (typeof OBJECTIVES)[number]["v"],
    frequency: "MONTHLY" as (typeof FREQS)[number]["v"], budget: "500", radiusMiles: 25, ageMin: 25, ageMax: 60,
    gender: "all" as "all" | "male" | "female", smartTargeting: true,
    primaryText: "", headline: "", description: "", cta: "GET_OFFER",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const [vehicles, setVehicles] = useState<Veh[]>([]);
  const [vertical, setVertical] = useState<string>("AUTOMOTIVE");
  const [dealer, setDealer] = useState("Your dealership");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const def = verticalDef(vertical);

  useEffect(() => {
    if (!open) return;
    setStep(initialNetwork ? 1 : 0); setErr(null); setPicked(new Set());
    setF((p) => ({ ...p, channel: initialNetwork ?? "FACEBOOK", format: FORMATS[initialNetwork ?? "FACEBOOK"][0].v, primaryText: "", headline: "", description: "" }));
    apiFetch<{ items: Veh[]; vertical?: string }>("/inventory").then((r) => { setVehicles(r.items ?? []); if (r.vertical) setVertical(r.vertical); }).catch(() => setVehicles([]));
    apiFetch<{ dealershipName?: string }>("/overview").then((r) => { if (r.dealershipName) setDealer(r.dealershipName); }).catch(() => {});
  }, [open, initialNetwork]);

  const pickNetwork = (v: Net) => setF((p) => ({ ...p, channel: v, format: FORMATS[v][0].v }));
  const carousel = f.format === "CAROUSEL";
  const showInventory = f.format !== "SEARCH";
  const togglePick = (id: string) => setPicked((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id); else { if (!carousel) n.clear(); n.add(id); }
    return n;
  });
  const allPicked = vehicles.length > 0 && picked.size === vehicles.length;
  const toggleAll = () => setPicked(allPicked ? new Set() : new Set(vehicles.map((v) => v.id)));

  const budgetCents = Math.round((parseFloat(f.budget) || 0) * 100);
  const feeCents = Math.round(budgetCents * 0.1);
  const netCents = budgetCents - feeCents;

  const pickedVehicles = useMemo(() => vehicles.filter((v) => picked.has(v.id)), [vehicles, picked]);
  const pickedImages = useMemo(() => pickedVehicles.map((v) => v.image).filter(Boolean) as string[], [pickedVehicles]);
  const firstPicked = pickedVehicles[0] ?? null;

  const genCopy = () => {
    const v = firstPicked;
    const cta = CTA_BY_OBJECTIVE[f.objective] ?? "LEARN_MORE";
    if (v) {
      const name = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`.trim();
      setF((p) => ({ ...p, cta, headline: name,
        primaryText: `Now available at ${dealer} — this ${name} won't last long. Great financing options and easy trade-ins. Message us today to lock it in. 🚗`,
        description: v.price ? `$${v.price.toLocaleString()} · Financing available` : "Financing available" }));
    } else {
      setF((p) => ({ ...p, cta, headline: `Shop ${dealer}`,
        primaryText: `Looking for your next vehicle? ${dealer} has fresh inventory and easy financing. Browse our lineup and find your fit today.`,
        description: "Great deals · Easy financing" }));
    }
  };
  useEffect(() => {
    if (open && step === 4 && !f.headline && !f.primaryText) genCopy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const creative: AdCreative = {
    network: f.channel, business: dealer, image: firstPicked?.image ?? null, images: pickedImages, format: f.format,
    primaryText: f.primaryText, headline: f.headline, description: f.description, cta: f.cta, price: firstPicked?.price ?? null,
  };
  const canNext = step === 0 ? true : step === 2 ? f.name.trim().length > 0 && budgetCents >= 5000 : true;

  const save = async () => {
    setErr(null);
    if (!f.name.trim()) { setErr("Name your campaign."); setStep(2); return; }
    if (budgetCents < 5000) { setErr("Minimum budget is $50."); setStep(2); return; }
    setBusy(true);
    try {
      await apiFetch("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: f.name, channel: f.channel, format: f.format, objective: f.objective, frequency: f.frequency,
          budgetCents, radiusMiles: f.radiusMiles, ageMin: f.ageMin, ageMax: f.ageMax, gender: f.gender, smartTargeting: f.smartTargeting,
          promotedVehicleIds: [...picked],
          primaryText: f.primaryText, headline: f.headline, description: f.description, cta: f.cta,
          creativeImageUrl: firstPicked?.image ?? null, creativeImages: pickedImages,
        }),
      });
      onCreated();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not create the campaign.");
    } finally {
      setBusy(false);
    }
  };

  const net = NETWORKS.find((n) => n.v === f.channel)!;

  return (
    <Sheet open={open} onClose={onClose} width="max-w-xl" title="Launch a campaign" subtitle="Build it, submit it — Krakd publishes to your connected account."
      footer={<>
        {step > (initialNetwork ? 1 : 0) && <button onClick={() => setStep((s) => s - 1)} className="mr-auto inline-flex h-9 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-n600 transition hover:bg-n100"><ChevronLeft className="h-4 w-4" />Back</button>}
        <button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button>
        {step < 4
          ? <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-40">Continue</button>
          : <button onClick={save} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Creating…" : "Create draft"}</button>}
      </>}>
      {/* stepper */}
      <div className="mb-5 flex items-center gap-1">
        {STEPS.map((label, i) => (
          <button key={label} type="button" onClick={() => i < step && setStep(i)} className={cn("flex items-center gap-1.5", i < step ? "cursor-pointer" : "cursor-default")}>
            <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[10.5px] font-bold transition", i < step ? "bg-brand text-white" : i === step ? "bg-brand text-white ring-4 ring-brand/15" : "bg-n200 text-n500")}>{i < step ? <Check className="h-3 w-3" /> : i + 1}</span>
            <span className={cn("text-[12px] font-medium", i === step ? "text-n900" : "text-n400")}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-0.5 h-px w-3 bg-n200" />}
          </button>
        ))}
      </div>

      {/* STEP 0 — network */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-[13px] text-n600">Where do you want these ads to run? Each campaign publishes to one network — the account you&apos;ve connected.</p>
          {NETWORKS.map((n) => {
            const on = f.channel === n.v;
            return (
              <button key={n.v} type="button" onClick={() => pickNetwork(n.v)} className={cn("flex w-full items-center gap-3 rounded-xl border p-4 text-left transition", on ? "border-brand bg-brand-soft/30 ring-1 ring-brand/20" : "border-n200 bg-white hover:bg-n50")}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-n100">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={n.logo} alt={n.label} className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-n900">{n.label}</span><span className="text-[12px] text-n500">{n.sub}</span></span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", n.connected ? "bg-ok-soft text-ok" : "bg-n100 text-n500")}>{n.connected ? <><Wifi className="h-3 w-3" />Connected</> : <><WifiOff className="h-3 w-3" />Connect</>}</span>
              </button>
            );
          })}
          {!net.connected && <p className="rounded-lg bg-warn-soft/50 px-3 py-2.5 text-[12px] text-warn">You&apos;ll connect {net.label} before this can go live — you can still build the campaign now.</p>}
        </div>
      )}

      {/* STEP 1 — format / template */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-[13px] text-n600">Pick the ad format for <span className="font-semibold text-n900">{net.label}</span>.</p>
          <div className="grid grid-cols-2 gap-3">
            {FORMATS[f.channel].map((t) => {
              const on = f.format === t.v;
              return (
                <button key={t.v} type="button" onClick={() => set("format", t.v)} className={cn("rounded-xl border p-4 text-left transition", on ? "border-brand bg-brand-soft/30 ring-1 ring-brand/20" : "border-n200 bg-white hover:bg-n50")}>
                  <t.Icon className={cn("h-5 w-5", on ? "text-brand" : "text-n500")} />
                  <p className="mt-2 text-[13.5px] font-semibold text-n900">{t.label}</p>
                  <p className="text-[12px] text-n500">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2 — setup */}
      {step === 2 && (
        <div className="space-y-5">
          <Labeled label="Campaign name"><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Certified Trucks — spring" className={fieldCls} /></Labeled>
          <Labeled label="Objective"><Pills value={f.objective} onChange={(v) => { set("objective", v); set("cta", CTA_BY_OBJECTIVE[v] ?? "LEARN_MORE"); }} options={OBJECTIVES} /></Labeled>
          <Labeled label="Frequency"><Pills value={f.frequency} onChange={(v) => set("frequency", v)} options={FREQS} /></Labeled>
          <Labeled label="Budget" hint="per cycle">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-n400">$</span>
              <input value={f.budget} onChange={(e) => set("budget", e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className={cn(fieldCls, "tnum pl-7")} />
            </div>
          </Labeled>
          {budgetCents >= 5000 && (
            <div className="rounded-lg border border-brand/20 bg-brand-soft/30 p-3 text-[12.5px]">
              <div className="flex justify-between"><span className="text-n500">Krakd fee (10%)</span><span className="tnum font-semibold text-n900">{money(feeCents)}</span></div>
              <div className="mt-1 flex justify-between"><span className="text-n500">Real media spend (90%)</span><span className="tnum font-semibold text-n900">{money(netCents)}</span></div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — audience (sliders) */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-n200 p-4">
            <Slider label="Radius from your dealership" value={f.radiusMiles} onChange={(v) => set("radiusMiles", v)} min={1} max={100} format={(v) => `${v} mi`} />
          </div>
          <div className="rounded-xl border border-n200 p-4">
            <RangeSlider label="Age range" minValue={f.ageMin} maxValue={f.ageMax} onChange={(lo, hi) => setF((p) => ({ ...p, ageMin: lo, ageMax: hi }))} min={18} max={65} format={(v) => (v >= 65 ? "65+" : `${v}`)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-n900">Gender</span>
            <Pills value={f.gender} onChange={(v) => set("gender", v)} options={[{ v: "all", label: "All" }, { v: "male", label: "Men" }, { v: "female", label: "Women" }] as const} />
          </div>
          <label className="flex cursor-pointer items-center justify-between">
            <span><span className="block text-[13px] font-medium text-n900">Smart targeting</span><span className="text-[11.5px] text-n500">Let Krakd optimize the audience automatically.</span></span>
            <button type="button" onClick={() => set("smartTargeting", !f.smartTargeting)} className={cn("relative h-5 w-9 shrink-0 rounded-full transition", f.smartTargeting ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", f.smartTargeting ? "left-4" : "left-0.5")} /></button>
          </label>
        </div>
      )}

      {/* STEP 4 — creative (inventory + copy + preview) */}
      {step === 4 && (
        <div className="space-y-5">
          {showInventory && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-semibold capitalize text-n900">{carousel ? `Select ${def.plural}` : `Pick ${def.noun}`} <span className="font-normal normal-case text-n400">{picked.size > 0 && `· ${picked.size}`}</span></p>
                {carousel && vehicles.length > 0 && <button type="button" onClick={toggleAll} className="text-[12px] font-semibold text-brand hover:underline">{allPicked ? "Clear all" : "Select all"}</button>}
              </div>
              {vehicles.length === 0
                ? <p className="rounded-lg bg-n50 px-3 py-3 text-[12.5px] text-n500">No {def.plural} yet — add {def.noun}s first, or run a general awareness ad.</p>
                : <div className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
                    {vehicles.map((v) => {
                      const on = picked.has(v.id);
                      return (
                        <button key={v.id} type="button" onClick={() => togglePick(v.id)} className={cn("flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition", on ? "border-brand bg-brand-soft/40" : "border-n200 bg-white hover:bg-n50")}>
                          {v.image /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={v.image} alt="" className="h-11 w-14 shrink-0 rounded-md object-cover" /> : <span className="grid h-11 w-14 shrink-0 place-items-center rounded-md bg-n100 text-[9px] text-n400">no photo</span>}
                          <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-n900">{v.year} {v.make} {v.model} {v.trim}</span><span className="tnum text-[11.5px] text-n500">${v.price.toLocaleString()}</span></span>
                          <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full border", on ? "border-brand bg-brand text-white" : "border-n300")}>{on && <Check className="h-2.5 w-2.5" />}</span>
                        </button>
                      );
                    })}
                  </div>}
            </div>
          )}

          <div className="border-t border-n200 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-n900">Ad copy</p>
              <button type="button" onClick={genCopy} className="inline-flex items-center gap-1.5 rounded-md border border-n200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand-soft/40"><Sparkles className="h-3.5 w-3.5" />Draft copy</button>
            </div>
            <div className="space-y-3">
              <Labeled label="Primary text"><textarea value={f.primaryText} onChange={(e) => set("primaryText", e.target.value)} rows={3} className={areaCls} /></Labeled>
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Headline"><input value={f.headline} onChange={(e) => set("headline", e.target.value)} className={fieldCls} /></Labeled>
                <Labeled label="Call to action"><select value={f.cta} onChange={(e) => set("cta", e.target.value)} className={fieldCls}>{Object.entries(CTA_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select></Labeled>
              </div>
              <Labeled label="Description" hint="link ads"><input value={f.description} onChange={(e) => set("description", e.target.value)} className={fieldCls} /></Labeled>
            </div>
          </div>

          <div className="border-t border-n200 pt-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-n500">Live preview · {net.label}{carousel ? " carousel" : ""}</p>
            <div className="rounded-xl bg-n100/70 p-4"><AdPreview creative={creative} /></div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-n50 p-3 text-[12px] text-n600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>Saved as a <span className="font-semibold text-n800">draft</span>. Hit <span className="font-semibold text-n800">Submit for review</span> on the campaign to send it to Krakd — once approved it publishes to your connected {net.label} account and goes live automatically.</span>
          </div>
        </div>
      )}

      {err && <p className="mt-4 text-[12.5px] font-medium text-err">{err}</p>}
    </Sheet>
  );
}
