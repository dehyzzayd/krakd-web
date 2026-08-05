"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { apiFetch, ApiError } from "@/lib/api";
import { money, type Vehicle, type VStatus } from "@/lib/inventory";
import { uploadImage } from "@/lib/upload";
import { SpecFields } from "./SpecFields";
import { CATEGORIES, categoryById } from "@/lib/vehicleSpecs";
import { EQUIPMENT_GROUPS, CONDITION_REPORT_GROUPS, PRICE_CHANNELS, PRICE_TYPES, CONDITION_POINT_COUNT, crKey } from "@/lib/vehicleExtras";
import { Barcode, Sparkles, Camera, Upload, DollarSign, Car, Bike, Zap, Caravan, Truck, ListChecks, ImageIcon, FileText, PackageCheck, ClipboardCheck, Star, Wand2, Megaphone } from "lucide-react";

type Specs = Record<string, string | boolean>;
type ChannelPrice = { type: string; value: string };
const CAT_ICON: Record<string, React.ComponentType<{ className?: string }>> = { CAR: Car, MOTORCYCLE: Bike, POWERSPORT: Zap, RV: Caravan, TRAILER: Truck };
const STATUSES: { v: VStatus; label: string }[] = [
  { v: "available", label: "Available" }, { v: "recon", label: "In recon" }, { v: "reserved", label: "Reserved" }, { v: "wholesale", label: "Wholesale" }, { v: "sold", label: "Sold" },
];
const TABS = [
  { id: "general", label: "General", icon: FileText },
  { id: "specs", label: "Specs", icon: ListChecks },
  { id: "equipment", label: "Equipment", icon: PackageCheck },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "condition", label: "Condition report", icon: ClipboardCheck },
  { id: "photos", label: "Photos", icon: ImageIcon },
] as const;

type Form = {
  vin: string; year: string; make: string; model: string; trim: string;
  mileage: string; stock: string; status: VStatus;
  cost: string; recon: string; pack: string; price: string; photoUrls: string[];
  headline: string; description: string; msrp: string; special: string;
  channel: Record<string, ChannelPrice>;
  equipment: string[]; extraEquipment: string;
  featureHome: boolean; featureSpecial: boolean; showAutocheck: boolean; showCarfax: boolean;
};

const toCents = (s: string) => { const n = parseFloat(String(s).replace(/[^0-9.]/g, "")); return n > 0 ? Math.round(n * 100) : 0; };
const fromCents = (c: unknown) => (typeof c === "number" && c > 0 ? String(Math.round(c / 100)) : "");

function seed(v: Vehicle | undefined, initialPhotos: string[], attrs: Record<string, unknown>, initialTitle: string): Form {
  const chan: Record<string, ChannelPrice> = {};
  const savedChan = (attrs.channelPrices ?? {}) as Record<string, ChannelPrice>;
  for (const c of PRICE_CHANNELS) chan[c.key] = { type: savedChan[c.key]?.type ?? "Price", value: savedChan[c.key]?.value ?? "" };
  const base = {
    headline: initialTitle ?? "", description: String(attrs.description ?? ""),
    msrp: fromCents(attrs.msrpCents), special: fromCents(attrs.specialPriceCents),
    channel: chan,
    equipment: Array.isArray(attrs.equipment) ? (attrs.equipment as string[]) : [],
    extraEquipment: String(attrs.equipmentExtra ?? ""),
    featureHome: !!attrs.featureHome, featureSpecial: !!attrs.featureSpecial, showAutocheck: !!attrs.showAutocheck, showCarfax: !!attrs.showCarfax,
  };
  if (!v) return { vin: "", year: "", make: "", model: "", trim: "", mileage: "", stock: "", status: "recon", cost: "", recon: "1250", pack: "695", price: "", photoUrls: initialPhotos, ...base };
  return { vin: v.vin, year: String(v.year), make: v.make, model: v.model, trim: v.trim, mileage: String(v.mileage), stock: v.stock, status: v.status, cost: String(v.cost), recon: fromCents(attrs.reconCents) || "1250", pack: fromCents(attrs.packCents) || "695", price: String(v.price), photoUrls: initialPhotos, ...base };
}

function Section({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: ReactNode }) {
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
function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={cn("block", wide && "sm:col-span-2")}><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">{label}</span>{children}</label>;
}
const inputCls = "h-9 w-full rounded-lg border border-n200 bg-white px-2.5 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-n400";

function Toggle({ label, desc, on, onClick }: { label: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition", on ? "border-brand bg-brand-soft/40" : "border-n200 hover:bg-n50")}>
      <span><span className="block text-[13px] font-semibold text-n800">{label}</span><span className="block text-[11.5px] text-n500">{desc}</span></span>
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition", on ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition", on ? "left-4.5" : "left-0.5")} /></span>
    </button>
  );
}

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(value === n ? 0 : n)} aria-label={`${n} star`} className="p-0.5">
          <Star className={cn("h-4 w-4 transition", n <= value ? "fill-amber-400 text-amber-400" : "text-n300 hover:text-amber-200")} />
        </button>
      ))}
      <span className="ml-1 w-8 text-[10px] text-n400">{value ? `${value}/5` : "N/A"}</span>
    </div>
  );
}

export function VehicleForm({ vehicle, initialPhotos = [], initialCategory = "CAR", initialSpecs = {}, initialTitle = "" }: { vehicle?: Vehicle; initialPhotos?: string[]; initialCategory?: string; initialSpecs?: Specs; initialTitle?: string }) {
  const edit = !!vehicle;
  const router = useRouter();
  const attrs = initialSpecs as Record<string, unknown>;
  const [f, setF] = useState<Form>(() => seed(vehicle, initialPhotos, attrs, initialTitle));
  const [category, setCategory] = useState(initialCategory);
  const [specs, setSpecs] = useState<Specs>(initialSpecs);
  const [condition, setCondition] = useState<Record<string, number>>(() => (attrs.conditionReport && typeof attrs.conditionReport === "object" ? (attrs.conditionReport as Record<string, number>) : {}));
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general");
  const set = (k: keyof Form, v: string | number | boolean | string[]) => setF((p) => ({ ...p, [k]: v }));
  const setChannel = (key: string, patch: Partial<ChannelPrice>) => setF((p) => ({ ...p, channel: { ...p.channel, [key]: { ...p.channel[key], ...patch } } }));
  const toggleEquip = (item: string) => setF((p) => ({ ...p, equipment: p.equipment.includes(item) ? p.equipment.filter((x) => x !== item) : [...p.equipment, item] }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [decodeErr, setDecodeErr] = useState<string | null>(null);
  const def = categoryById(category);

  type Decoded = { year: string; make: string; model: string; trim: string; bodyStyle: string; fuelType: string; drivetrain: string; transmission: string };
  const decodeVin = async () => {
    const vin = f.vin.trim();
    if (vin.length < 11) { setDecodeErr("Enter the full VIN first."); return; }
    setDecoding(true); setDecodeErr(null);
    try {
      const d = await apiFetch<Decoded>(`/inventory/decode-vin?vin=${encodeURIComponent(vin)}`);
      setF((p) => ({ ...p, year: d.year || p.year, make: d.make || p.make, model: d.model || p.model, trim: d.trim || p.trim }));
      setSpecs((s) => ({ ...s,
        ...(d.bodyStyle ? { bodyStyle: s.bodyStyle || d.bodyStyle } : {}),
        ...(d.fuelType ? { fuelType: s.fuelType || d.fuelType } : {}),
        ...(d.drivetrain ? { drivetrain: s.drivetrain || d.drivetrain } : {}),
        ...(d.transmission ? { transmission: s.transmission || d.transmission } : {}),
      }));
    } catch (e) { setDecodeErr(e instanceof ApiError ? e.message : "Couldn't decode that VIN."); }
    finally { setDecoding(false); }
  };

  const genStock = () => set("stock", `K-${Date.now().toString(36).slice(-5).toUpperCase()}`);

  // Deterministic, honest description draft built from the fields already entered (no external call).
  const composeDescription = () => {
    const t = [f.year, f.make, f.model, f.trim].filter(Boolean).join(" ");
    const bits: string[] = [];
    if (t) bits.push(`This ${t} is ready for its next owner.`);
    const ms = +f.mileage;
    const cond = String(specs.condition ?? "").toLowerCase();
    if (ms) bits.push(`With ${ms.toLocaleString()} miles on the odometer${cond ? ` and in ${cond} condition` : ""}, it's been well looked after.`);
    const hi = f.equipment.slice(0, 6);
    if (hi.length) bits.push(`Standout features include ${hi.join(", ")}.`);
    if (specs.mpgHwy) bits.push(`Up to ${specs.mpgHwy} MPG on the highway keeps running costs down.`);
    bits.push(`Come take it for a test drive or reach out with any questions — we'd love to get you behind the wheel.`);
    set("description", bits.join(" "));
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setPhotoErr(null);
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 24)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 25_000_000) { setPhotoErr("Some images were over 25MB and skipped."); continue; }
      try { urls.push(await uploadImage(file)); } catch { /* skip */ }
    }
    if (urls.length) setF((p) => ({ ...p, photoUrls: [...p.photoUrls, ...urls].slice(0, 24) }));
  };
  const removePhoto = (i: number) => setF((p) => ({ ...p, photoUrls: p.photoUrls.filter((_, j) => j !== i) }));
  const makeCover = (i: number) => setF((p) => { const a = [...p.photoUrls]; const [x] = a.splice(i, 1); return { ...p, photoUrls: [x, ...a] }; });

  const save = async () => {
    setErr(null);
    if (!f.make || !f.model || !f.stock) { setErr("Fill in at least make, model and stock #."); setTab("general"); return; }
    setSaving(true);
    try {
      const priceCents = Math.round((+f.price || 0) * 100);
      const costCents = Math.round((+f.cost || 0) * 100);
      const bodyType = String(specs.bodyStyle ?? specs.trailerType ?? specs.rvClass ?? specs.motoType ?? specs.subType ?? "") || undefined;
      const exteriorColor = String(specs.exteriorColor ?? specs.color ?? "") || undefined;
      const interiorColor = String(specs.interiorColor ?? "") || undefined;
      const drivetrain = String(specs.drivetrain ?? specs.driveAtv ?? "") || undefined;
      const fuel = String(specs.fuelType ?? specs.rvFuel ?? "") || undefined;
      const transmission = String(specs.transmission ?? specs.transmissionSpeeds ?? "") || undefined;
      const engine = [specs.displacementL && `${specs.displacementL}L`, specs.cylinders && specs.cylinders !== "Electric" ? `${specs.cylinders}-cyl` : "", specs.aspiration && specs.aspiration !== "Naturally Aspirated" ? specs.aspiration : ""].filter(Boolean).join(" ") || undefined;

      const attributes = {
        ...specs,
        description: f.description || undefined,
        msrpCents: toCents(f.msrp) || undefined,
        specialPriceCents: toCents(f.special) || undefined,
        channelPrices: f.channel,
        equipment: f.equipment,
        equipmentExtra: f.extraEquipment || undefined,
        conditionReport: condition,
        featureHome: f.featureHome, featureSpecial: f.featureSpecial, showAutocheck: f.showAutocheck, showCarfax: f.showCarfax,
      };
      const common = {
        mileage: +f.mileage || 0, status: f.status.toUpperCase(), category,
        title: f.headline || undefined, bodyType, exteriorColor, interiorColor, drivetrain, fuel, transmission, engine,
        reconCents: Math.round((+f.recon || 0) * 100), packCents: Math.round((+f.pack || 0) * 100),
        attributes, photoUrls: f.photoUrls,
      };
      if (edit && vehicle) {
        await apiFetch(`/inventory/${vehicle.id}`, { method: "PATCH", body: JSON.stringify({ priceCents, costCents, ...common }) });
        router.push(`/dashboard/inventory/${vehicle.id}`);
      } else {
        const res = await apiFetch<{ id: string }>("/inventory", { method: "POST", body: JSON.stringify({
          vin: f.vin || undefined, stockNumber: f.stock, year: +f.year || undefined, make: f.make, model: f.model, trim: f.trim || undefined,
          priceCents, costCents, ...common,
        }) });
        router.push(`/dashboard/inventory/${res.id}`);
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : `Could not save the ${def.noun}.`);
    } finally {
      setSaving(false);
    }
  };

  const cost = +f.cost || 0, recon = +f.recon || 0, pack = +f.pack || 0, price = +f.price || 0;
  const gross = price - cost - recon - pack;
  const low = edit ? vehicle!.marketLow : Math.round(cost * 1.06) || 0;
  const avg = edit ? vehicle!.marketAvg : Math.round(cost * 1.19) || 0;
  const high = edit ? vehicle!.marketHigh : Math.round(cost * 1.32) || 0;
  const pos = high > low ? Math.max(0, Math.min(1, (price - low) / (high - low))) : 0.5;
  const avgPos = high > low ? Math.max(0, Math.min(1, (avg - low) / (high - low))) : 0.5;
  const suggested = avg ? Math.round((avg - 300) / 10) * 10 : 0;
  const delta = price && avg ? price - avg : 0;
  const title = f.headline || [f.year, f.make, f.model].filter(Boolean).join(" ") || `New ${def.noun}`;
  const specSummary = [specs.condition, specs.bodyStyle || specs.rvClass || specs.trailerType || specs.motoType || specs.subType].filter(Boolean).join(" · ");
  const condDone = Object.values(condition).filter((n) => n > 0).length;

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: "Inventory", href: "/dashboard/inventory" }, { label: edit ? `Edit ${vehicle!.stock}` : `Add a ${def.noun}` }]} />

      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.02em] text-n900">{edit ? "Edit unit" : "Add a unit"}</h1>
            <p className="text-[13px] text-n500">{edit ? "Update this record." : "Pick a category — the spec sheet adapts to it."}</p>
          </div>

          {/* category selector */}
          <section className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-n500">Category</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CATEGORIES.map((c) => {
                const Icon = CAT_ICON[c.id] ?? Car; const on = category === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={cn("flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition", on ? "border-brand bg-brand-soft/40 ring-1 ring-brand/20" : "border-n200 hover:bg-n50")}>
                    <Icon className={cn("h-5 w-5", on ? "text-brand" : "text-n500")} />
                    <span className={cn("text-[12px] font-semibold", on ? "text-brand" : "text-n700")}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* always-visible identity: VIN (decode) + Stock (generate) + core fields */}
          <Section icon={Barcode} title="Identity" desc="VIN, stock number and the basics. Decode the VIN to auto-fill.">
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <div className="flex gap-2">
                <input value={f.vin} onChange={(e) => { set("vin", e.target.value.toUpperCase()); setDecodeErr(null); }} placeholder="17-digit VIN" maxLength={17} className={cn(inputCls, "tnum flex-1")} />
                <button type="button" onClick={decodeVin} disabled={decoding} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-n900 px-3 text-[12px] font-semibold text-white transition hover:bg-n800 disabled:opacity-60"><Sparkles className="h-3.5 w-3.5" />{decoding ? "…" : "Decode"}</button>
              </div>
              <div className="flex gap-2">
                <input value={f.stock} onChange={(e) => set("stock", e.target.value)} placeholder="Stock #" className={cn(inputCls, "tnum flex-1")} />
                <button type="button" onClick={genStock} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-n200 px-3 text-[12px] font-semibold text-n700 transition hover:bg-n50">Generate</button>
              </div>
            </div>
            {decodeErr && <p className="mb-3 -mt-1 text-[12px] font-medium text-err">{decodeErr}</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Year"><input value={f.year} onChange={(e) => set("year", e.target.value.replace(/[^0-9]/g, ""))} className={cn(inputCls, "tnum")} placeholder="2022" /></Field>
              <Field label="Make"><input value={f.make} onChange={(e) => set("make", e.target.value)} className={inputCls} placeholder={def.id === "TRAILER" ? "Big Tex" : def.id === "MOTORCYCLE" ? "Harley-Davidson" : "Toyota"} /></Field>
              <Field label="Model"><input value={f.model} onChange={(e) => set("model", e.target.value)} className={inputCls} placeholder={def.id === "TRAILER" ? "22GN" : "Camry"} /></Field>
              <Field label="Trim / series"><input value={f.trim} onChange={(e) => set("trim", e.target.value)} className={inputCls} placeholder="XSE" /></Field>
              {def.usageLabel && <Field label={def.usageLabel}><div className="relative"><input value={f.mileage} onChange={(e) => set("mileage", e.target.value.replace(/[^0-9]/g, ""))} className={cn(inputCls, "tnum", def.usageUnit && "pr-9")} placeholder="28,000" />{def.usageUnit && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-n400">{def.usageUnit}</span>}</div></Field>}
            </div>
          </Section>

          {/* tab bar */}
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-n200 bg-n50 p-1.5">
            {TABS.map((t) => {
              const on = tab === t.id; const Icon = t.icon;
              const badge = t.id === "condition" && condDone ? `${condDone}/${CONDITION_POINT_COUNT}` : t.id === "equipment" && f.equipment.length ? String(f.equipment.length) : t.id === "photos" && f.photoUrls.length ? String(f.photoUrls.length) : "";
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition", on ? "bg-white text-n900 sh-card" : "text-n600 hover:text-n900")}>
                  <Icon className={cn("h-3.5 w-3.5", on ? "text-brand" : "text-n400")} />{t.label}
                  {badge && <span className={cn("rounded-full px-1.5 text-[10px] font-bold", on ? "bg-brand-soft text-brand" : "bg-n200 text-n600")}>{badge}</span>}
                </button>
              );
            })}
          </div>

          {tab === "general" && (
            <div className="space-y-4">
              <Section icon={FileText} title="Listing content" desc="The headline and description buyers read on your website and marketplaces.">
                <div className="space-y-3">
                  <Field label="Vehicle title / headline"><input value={f.headline} onChange={(e) => set("headline", e.target.value)} className={inputCls} placeholder={`${[f.year, f.make, f.model, f.trim].filter(Boolean).join(" ") || "2022 Toyota Camry XSE"}`} /></Field>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-n500">Description</span>
                      <button type="button" onClick={composeDescription} className="inline-flex items-center gap-1.5 rounded-lg border border-n200 px-2.5 py-1 text-[11.5px] font-semibold text-n700 transition hover:bg-n50"><Wand2 className="h-3.5 w-3.5 text-brand" />Write a draft</button>
                    </div>
                    <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={5} className={cn(inputCls, "h-auto py-2 leading-relaxed")} placeholder="Describe the vehicle, its condition and what makes it a great buy…" />
                    <p className="mt-1 text-[11px] text-n400">“Write a draft” builds a starting description from the details you’ve entered — edit it to sound like you.</p>
                  </div>
                </div>
              </Section>

              <Section icon={Car} title="Lot status" desc="Where this unit sits in your workflow.">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {STATUSES.map((s) => <button key={s.v} type="button" onClick={() => set("status", s.v)} className={cn("h-9 rounded-lg border text-[12.5px] font-semibold transition", f.status === s.v ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n100")}>{s.label}</button>)}
                </div>
              </Section>

              <Section icon={Megaphone} title="Merchandising" desc="How and where this unit is promoted.">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Toggle label="Feature on homepage" desc="Show in the featured row on your site" on={f.featureHome} onClick={() => set("featureHome", !f.featureHome)} />
                  <Toggle label="Feature as special" desc="Flag as a special / hot deal" on={f.featureSpecial} onClick={() => set("featureSpecial", !f.featureSpecial)} />
                  <Toggle label="Show AutoCheck" desc="Display an AutoCheck badge on the listing" on={f.showAutocheck} onClick={() => set("showAutocheck", !f.showAutocheck)} />
                  <Toggle label="Show Carfax" desc="Display a Carfax badge on the listing" on={f.showCarfax} onClick={() => set("showCarfax", !f.showCarfax)} />
                </div>
              </Section>
            </div>
          )}

          {tab === "specs" && (
            <Section icon={ListChecks} title={`${def.label} specifications`} desc="The fields adapt to the category — fill what applies.">
              <SpecFields category={category} values={specs} onChange={setSpecs} />
            </Section>
          )}

          {tab === "equipment" && (
            <Section icon={PackageCheck} title="Standard equipment" desc="Tick everything this unit is equipped with — it powers the features list on the listing.">
              <div className="space-y-4">
                {EQUIPMENT_GROUPS.filter((g) => g.items.length).map((g) => (
                  <div key={g.key}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-n500">{g.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((item) => {
                        const on = f.equipment.includes(item);
                        return <button key={item} type="button" onClick={() => toggleEquip(item)} className={cn("rounded-full border px-3 py-1.5 text-[12px] font-medium transition", on ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n50")}>{on ? "✓ " : ""}{item}</button>;
                      })}
                    </div>
                  </div>
                ))}
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-n500">Additional / optional equipment</p>
                  <textarea value={f.extraEquipment} onChange={(e) => set("extraEquipment", e.target.value)} rows={3} className={cn(inputCls, "h-auto py-2")} placeholder="One per line — e.g. Tonneau cover, Upgraded stereo, Ceramic tint…" />
                </div>
              </div>
            </Section>
          )}

          {tab === "pricing" && (
            <div className="space-y-4">
              <Section icon={DollarSign} title="Cost & front-end gross" desc="Your numbers — gross and market position update live in the preview.">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Unit cost"><input value={f.cost} onChange={(e) => set("cost", e.target.value)} className={cn(inputCls, "tnum")} placeholder="24,000" /></Field>
                  <Field label="Recon"><input value={f.recon} onChange={(e) => set("recon", e.target.value)} className={cn(inputCls, "tnum")} /></Field>
                  <Field label="Pack"><input value={f.pack} onChange={(e) => set("pack", e.target.value)} className={cn(inputCls, "tnum")} /></Field>
                  <Field label="Internet price"><input value={f.price} onChange={(e) => set("price", e.target.value)} className={cn(inputCls, "tnum font-semibold")} placeholder="28,900" /></Field>
                </div>
              </Section>

              <Section icon={DollarSign} title="Retail pricing" desc="MSRP and an optional special price shown on the listing.">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="MSRP"><input value={f.msrp} onChange={(e) => set("msrp", e.target.value)} className={cn(inputCls, "tnum")} placeholder="32,500" /></Field>
                  <Field label="Special price"><input value={f.special} onChange={(e) => set("special", e.target.value)} className={cn(inputCls, "tnum")} placeholder="27,900" /></Field>
                </div>
              </Section>

              <Section icon={Megaphone} title="Marketplace pricing" desc="Advertise a different price per channel (e.g. a payment on Facebook).">
                <div className="space-y-2">
                  {PRICE_CHANNELS.map((c) => (
                    <div key={c.key} className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[160px_140px_1fr]">
                      <span className="text-[12.5px] font-medium text-n700">{c.label}</span>
                      <select value={f.channel[c.key]?.type} onChange={(e) => setChannel(c.key, { type: e.target.value })} className={cn(inputCls, "cursor-pointer")}>
                        {PRICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input value={f.channel[c.key]?.value} onChange={(e) => setChannel(c.key, { value: e.target.value })} className={cn(inputCls, "tnum")} placeholder={f.channel[c.key]?.type === "Custom Text" ? "e.g. Call for our best price" : "Leave blank to use the internet price"} />
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {tab === "condition" && (
            <Section icon={ClipboardCheck} title="Condition report" desc={`Rate each point 1–5 stars (leave blank for N/A). ${condDone}/${CONDITION_POINT_COUNT} rated — buyers see this on the listing.`}>
              <div className="space-y-5">
                {CONDITION_REPORT_GROUPS.map((g) => (
                  <div key={g.key}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-n500">{g.label}</p>
                    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {g.items.map((item) => {
                        const key = crKey(g.key, item);
                        return (
                          <div key={key} className="flex items-center justify-between gap-2 border-b border-n100 py-1">
                            <span className="text-[12.5px] text-n700">{item}</span>
                            <Stars value={condition[key] ?? 0} onChange={(n) => setCondition((p) => ({ ...p, [key]: n }))} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {tab === "photos" && (
            <Section icon={ImageIcon} title="Photos" desc="The first photo is the cover shown on your website. Hover a photo to set cover or remove.">
              {f.photoUrls.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {f.photoUrls.map((src, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-n100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">Cover</span>}
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 opacity-0 transition group-hover:opacity-100">
                          {i !== 0 && <button type="button" onClick={() => makeCover(i)} className="rounded bg-white/90 px-2 py-1 text-[10px] font-semibold text-n900">Cover</button>}
                          <button type="button" onClick={() => removePhoto(i)} className="rounded bg-white/90 px-2 py-1 text-[10px] font-semibold text-err">Remove</button>
                        </div>
                      </div>
                    ))}
                    {f.photoUrls.length < 24 && (
                      <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-n300 text-n400 transition hover:bg-n50">
                        <Upload className="h-4 w-4" />
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                      </label>
                    )}
                  </div>
                  <p className="mt-2 text-[12px] text-n500"><b className="text-n800">{f.photoUrls.length}</b> photo{f.photoUrls.length === 1 ? "" : "s"} attached</p>
                </>
              ) : (
                <label className="grid w-full cursor-pointer place-items-center gap-1 rounded-xl border-2 border-dashed border-n300 bg-n50/50 py-8 text-center transition hover:bg-n50">
                  <Camera className="h-6 w-6 text-n400" /><p className="text-[13px] font-semibold text-n700">Upload photos</p><p className="text-[11.5px] text-n500">Click to choose images (up to 24)</p>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                </label>
              )}
              {photoErr && <p className="mt-2 text-[12px] font-medium text-warn">{photoErr}</p>}
            </Section>
          )}
        </div>

        {/* summary rail */}
        <div>
          <div className="sticky top-4 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-n200 bg-white sh-card">
              {(f.photoUrls[0] || (edit && vehicle!.image)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.photoUrls[0] || vehicle!.image} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="grid aspect-[16/10] place-items-center bg-n100 text-n400">{(() => { const I = CAT_ICON[category] ?? Car; return <I className="h-8 w-8" />; })()}</div>
              )}
              <div className="p-4">
                <p className="text-[14px] font-semibold text-n900">{title}</p>
                <p className="text-[12px] text-n500">{[f.trim, specSummary].filter(Boolean).join(" · ") || def.label}</p>
                <p className="tnum mt-2 text-[24px] font-bold text-n900">{price ? money(price) : "$—"}</p>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-n50 px-3 py-2">
                  <span className="text-[12px] font-medium text-n600">Front-end gross</span>
                  <span className={cn("tnum text-[14px] font-bold", price <= 0 ? "text-n400" : gross > 0 ? "text-ok" : "text-err")}>{price > 0 ? money(gross) : "—"}</span>
                </div>
              </div>
            </div>

            {price > 0 && high > low && (
              <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-n900"><Sparkles className="h-3.5 w-3.5 text-brand" />Market position</p>
                <div className="mt-3 relative h-2 rounded-full" style={{ background: "linear-gradient(90deg,#16a34a33,#c0853233,#dc262633)" }}>
                  <span className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 bg-n400" style={{ left: `${avgPos * 100}%` }} />
                  <span className={cn("absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white", delta <= -300 ? "bg-ok" : delta >= 500 ? "bg-err" : "bg-n700")} style={{ left: `${pos * 100}%` }} />
                </div>
                <div className="tnum mt-1.5 flex justify-between text-[11px] text-n400"><span>{money(low)}</span><span>mkt {money(avg)}</span><span>{money(high)}</span></div>
                {suggested > 0 && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-soft px-3 py-2">
                    <div><p className="text-[10.5px] font-semibold uppercase tracking-wide text-brand">AI suggested</p><p className="tnum text-[14px] font-bold text-n900">{money(suggested)}</p></div>
                    <button type="button" onClick={() => set("price", String(suggested))} className="h-7 rounded-lg bg-brand px-3 text-[12px] font-semibold text-white hover:bg-brand-hover">Apply</button>
                  </div>
                )}
              </div>
            )}

            {err && <p className="mb-2 text-[12.5px] font-medium text-err">{err}</p>}
            <div className="flex items-center gap-2">
              <Link href="/dashboard/inventory" className="h-10 flex-1 rounded-lg border border-n200 bg-white text-center text-[13px] font-semibold leading-10 text-n700 transition hover:bg-n50">Cancel</Link>
              <button onClick={save} disabled={saving} className="h-10 flex-1 rounded-lg bg-brand text-[13px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60">{saving ? "Saving…" : edit ? "Save changes" : "Add to inventory"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
