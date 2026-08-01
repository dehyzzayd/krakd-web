"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { apiFetch, ApiError } from "@/lib/api";
import { money, type Vehicle, type VStatus } from "@/lib/inventory";
import { uploadImage } from "@/lib/upload";
import { Barcode, Sparkles, Camera, Upload, DollarSign, Car, ImageIcon } from "lucide-react";

const BODIES = ["Sedan", "Coupe", "SUV", "Crew Cab", "Double Cab", "Wagon", "Hatchback", "Van", "Convertible"];
const STATUSES: { v: VStatus; label: string }[] = [
  { v: "available", label: "Available" }, { v: "recon", label: "In recon" }, { v: "reserved", label: "Reserved" }, { v: "wholesale", label: "Wholesale" },
];
const DECODE = { year: "2022", make: "Toyota", model: "Camry", trim: "XSE", body: "Sedan", color: "Celestial Silver" };

type Form = {
  vin: string; year: string; make: string; model: string; trim: string; body: string;
  mileage: string; color: string; stock: string; status: VStatus;
  cost: string; recon: string; pack: string; price: string; photoUrls: string[];
};

function seed(v: Vehicle | undefined, initialPhotos: string[]): Form {
  if (!v) return { vin: "", year: "", make: "", model: "", trim: "", body: "", mileage: "", color: "", stock: "", status: "recon", cost: "", recon: "1250", pack: "695", price: "", photoUrls: initialPhotos };
  return { vin: v.vin, year: String(v.year), make: v.make, model: v.model, trim: v.trim, body: v.body, mileage: String(v.mileage), color: v.color, stock: v.stock, status: v.status, cost: String(v.cost), recon: "1250", pack: "695", price: String(v.price), photoUrls: initialPhotos };
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

export function VehicleForm({ vehicle, initialPhotos = [] }: { vehicle?: Vehicle; initialPhotos?: string[] }) {
  const edit = !!vehicle;
  const router = useRouter();
  const [f, setF] = useState<Form>(() => seed(vehicle, initialPhotos));
  const set = (k: keyof Form, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setPhotoErr(null);
    const picks = Array.from(files).slice(0, 24);
    const urls: string[] = [];
    for (const file of picks) {
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
    if (!f.vin || !f.year || !f.make || !f.model || !f.stock) { setErr("Fill in VIN, year, make, model and stock #."); return; }
    setSaving(true);
    try {
      const priceCents = Math.round((+f.price || 0) * 100);
      const costCents = Math.round((+f.cost || 0) * 100);
      if (edit && vehicle) {
        await apiFetch(`/inventory/${vehicle.id}`, { method: "PATCH", body: JSON.stringify({ priceCents, costCents, mileage: +f.mileage || 0, status: f.status, exteriorColor: f.color || undefined, photoUrls: f.photoUrls }) });
        router.push(`/dashboard/inventory/${vehicle.id}`);
      } else {
        const res = await apiFetch<{ id: string }>("/inventory", { method: "POST", body: JSON.stringify({
          vin: f.vin, stockNumber: f.stock, year: +f.year, make: f.make, model: f.model,
          trim: f.trim || undefined, bodyType: f.body || undefined, mileage: +f.mileage || 0,
          priceCents, costCents, status: f.status, exteriorColor: f.color || undefined, photoUrls: f.photoUrls,
        }) });
        router.push(`/dashboard/inventory/${res.id}`);
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not save the vehicle.");
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
  const title = [f.year, f.make, f.model].filter(Boolean).join(" ") || "New vehicle";

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: "Inventory", href: "/dashboard/inventory" }, { label: edit ? `Edit ${vehicle!.stock}` : "Add vehicle" }]} />

      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* form */}
        <div className="space-y-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.02em] text-n900">{edit ? "Edit vehicle" : "Add a vehicle"}</h1>
            <p className="text-[13px] text-n500">{edit ? `Update the record for ${vehicle!.year} ${vehicle!.make} ${vehicle!.model}.` : "Enter the details to add a new unit to your lot."}</p>
          </div>

          <Section icon={Barcode} title="Vehicle identity" desc="Decode the VIN to auto-fill year, make, model and trim.">
            <div className="mb-3.5 flex gap-2">
              <input value={f.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} placeholder="Enter 17-digit VIN" maxLength={17} className={cn(inputCls, "tnum flex-1")} />
              <button type="button" onClick={() => setF((p) => ({ ...p, ...DECODE, stock: p.stock || "K-2299" }))} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-n900 px-3.5 text-[12.5px] font-semibold text-white transition hover:bg-n800"><Sparkles className="h-3.5 w-3.5" />Decode VIN</button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Year"><input value={f.year} onChange={(e) => set("year", e.target.value)} className={cn(inputCls, "tnum")} placeholder="2022" /></Field>
              <Field label="Make"><input value={f.make} onChange={(e) => set("make", e.target.value)} className={inputCls} placeholder="Toyota" /></Field>
              <Field label="Model"><input value={f.model} onChange={(e) => set("model", e.target.value)} className={inputCls} placeholder="Camry" /></Field>
              <Field label="Trim"><input value={f.trim} onChange={(e) => set("trim", e.target.value)} className={inputCls} placeholder="XSE" /></Field>
              <Field label="Body"><select value={f.body} onChange={(e) => set("body", e.target.value)} className={inputCls}><option value="">Select…</option>{BODIES.map((b) => <option key={b}>{b}</option>)}</select></Field>
              <Field label="Stock #"><input value={f.stock} onChange={(e) => set("stock", e.target.value)} className={cn(inputCls, "tnum")} placeholder="K-2299" /></Field>
              <Field label="Mileage"><input value={f.mileage} onChange={(e) => set("mileage", e.target.value)} className={cn(inputCls, "tnum")} placeholder="28,000" /></Field>
              <Field label="Exterior color" wide><input value={f.color} onChange={(e) => set("color", e.target.value)} className={inputCls} placeholder="Summit White" /></Field>
            </div>
          </Section>

          <Section icon={DollarSign} title="Pricing & profit" desc="Front-end gross and market position update live as you type.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Unit cost"><input value={f.cost} onChange={(e) => set("cost", e.target.value)} className={cn(inputCls, "tnum")} placeholder="24,000" /></Field>
              <Field label="Recon"><input value={f.recon} onChange={(e) => set("recon", e.target.value)} className={cn(inputCls, "tnum")} /></Field>
              <Field label="Pack"><input value={f.pack} onChange={(e) => set("pack", e.target.value)} className={cn(inputCls, "tnum")} /></Field>
              <Field label="Internet price"><input value={f.price} onChange={(e) => set("price", e.target.value)} className={cn(inputCls, "tnum font-semibold")} placeholder="28,900" /></Field>
            </div>
          </Section>

          <Section icon={Car} title="Lot status" desc="Where this unit sits in your workflow.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUSES.map((s) => <button key={s.v} type="button" onClick={() => set("status", s.v)} className={cn("h-9 rounded-lg border text-[12.5px] font-semibold transition", f.status === s.v ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n100")}>{s.label}</button>)}
            </div>
          </Section>

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
                <Camera className="h-6 w-6 text-n400" /><p className="text-[13px] font-semibold text-n700">Upload photos</p><p className="text-[11.5px] text-n500">Click to choose images (up to 24 · 1.5MB each)</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
              </label>
            )}
            {photoErr && <p className="mt-2 text-[12px] font-medium text-warn">{photoErr}</p>}
          </Section>
        </div>

        {/* summary rail */}
        <div>
          <div className="sticky top-4 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-n200 bg-white sh-card">
              {(f.photoUrls[0] || (edit && vehicle!.image)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.photoUrls[0] || vehicle!.image} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="grid aspect-[16/10] place-items-center bg-n100 text-n400"><Car className="h-8 w-8" /></div>
              )}
              <div className="p-4">
                <p className="text-[14px] font-semibold text-n900">{title}</p>
                <p className="text-[12px] text-n500">{[f.trim, f.body].filter(Boolean).join(" · ") || "—"}</p>
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
