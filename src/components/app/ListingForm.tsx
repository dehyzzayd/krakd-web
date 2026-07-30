"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { apiFetch, ApiError } from "@/lib/api";
import { vertical as verticalDef } from "@/components/site/verticals";
import { Tag, DollarSign, ListChecks, Camera, Upload, ImageIcon, Home } from "lucide-react";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export type EditListing = {
  id: string; title: string | null; subtitle: string | null; price: number; status: string;
  attributes: Record<string, unknown>; photos?: string[];
};

const fileToDataUrl = (file: File): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(new Error("read failed")); r.readAsDataURL(file);
});

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

export function ListingForm({ vertical, listing, initialPhotos = [] }: { vertical: string; listing?: EditListing; initialPhotos?: string[] }) {
  const def = verticalDef(vertical);
  const dash = def.dash;
  const edit = !!listing;
  const router = useRouter();

  const [title, setTitle] = useState(listing?.title ?? "");
  const [subtitle, setSubtitle] = useState(listing?.subtitle ?? "");
  const [description, setDescription] = useState(String(listing?.attributes?.description ?? ""));
  const [price, setPrice] = useState(listing ? String(listing.price) : "");
  const [status, setStatus] = useState<string>(listing?.status ?? dash.statuses[0]?.value ?? "AVAILABLE");
  const [attrs, setAttrs] = useState<Record<string, string>>(() => {
    const a: Record<string, string> = {};
    for (const f of dash.formFields) { const v = listing?.attributes?.[f.key]; if (v != null) a[f.key] = String(v); }
    return a;
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialPhotos);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  const setAttr = (k: string, v: string) => setAttrs((p) => ({ ...p, [k]: v }));

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setPhotoErr(null);
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 24)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 1_500_000) { setPhotoErr("Some images were over 1.5MB and skipped."); continue; }
      try { urls.push(await fileToDataUrl(file)); } catch { /* skip */ }
    }
    if (urls.length) setPhotoUrls((p) => [...p, ...urls].slice(0, 24));
  };
  const removePhoto = (i: number) => setPhotoUrls((p) => p.filter((_, j) => j !== i));
  const makeCover = (i: number) => setPhotoUrls((p) => { const a = [...p]; const [x] = a.splice(i, 1); return [x, ...a]; });

  const save = async () => {
    setErr(null);
    if (!title.trim()) { setErr(`Enter a ${dash.titleField.toLowerCase()}.`); return; }
    setSaving(true);
    try {
      // coerce number-typed attributes back to numbers; keep the rest as strings
      const attributes: Record<string, unknown> = {};
      for (const f of dash.formFields) {
        const raw = attrs[f.key]?.trim();
        if (!raw) continue;
        attributes[f.key] = f.type === "number" ? Number(raw) : raw;
      }
      if (description.trim()) attributes.description = description.trim();
      const body = {
        title: title.trim(), subtitle: subtitle.trim() || undefined,
        priceCents: Math.round((+price || 0) * 100), status, attributes, photoUrls,
      };
      if (edit && listing) {
        await apiFetch(`/inventory/${listing.id}`, { method: "PATCH", body: JSON.stringify(body) });
        router.push(`/dashboard/inventory/${listing.id}`);
      } else {
        const res = await apiFetch<{ id: string }>("/inventory", { method: "POST", body: JSON.stringify(body) });
        router.push(`/dashboard/inventory/${res.id}`);
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : `Could not save the ${def.noun}.`);
    } finally {
      setSaving(false);
    }
  };

  const priceNum = +price || 0;
  const cover = photoUrls[0] ?? null;

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: def.plural.charAt(0).toUpperCase() + def.plural.slice(1), href: "/dashboard/inventory" }, { label: edit ? `Edit ${def.noun}` : `Add ${def.noun}` }]} />

      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.02em] text-n900">{edit ? `Edit ${def.noun}` : `Add a ${def.noun}`}</h1>
            <p className="text-[13px] text-n500">{edit ? `Update this ${def.noun}.` : `Enter the details to add a new ${def.noun}.`}</p>
          </div>

          <Section icon={Tag} title="Details" desc={`The headline, location and description shown across your site and ${def.plural}.`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={dash.titleField} wide><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Modern Hillside Estate" /></Field>
              <Field label={dash.subtitleField} wide><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputCls} placeholder="West Lake Hills" /></Field>
              <Field label="Description" wide>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder={`Tell buyers what makes this ${def.noun} special — layout, upgrades, neighborhood, what's nearby…`} className={`${inputCls} h-auto resize-y py-2 leading-relaxed`} />
              </Field>
            </div>
          </Section>

          {dash.formFields.length > 0 && (
            <Section icon={ListChecks} title="Specifications" desc={`Everything a buyer filters and searches by.`}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {dash.formFields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    {f.type === "select" ? (
                      <select value={attrs[f.key] ?? ""} onChange={(e) => setAttr(f.key, e.target.value)} className={inputCls}>
                        <option value="">Select…</option>
                        {f.options?.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={attrs[f.key] ?? ""} onChange={(e) => setAttr(f.key, e.target.value)} inputMode={f.type === "number" ? "decimal" : undefined} className={cn(inputCls, f.type === "number" && "tnum")} placeholder={f.placeholder} />
                    )}
                  </Field>
                ))}
              </div>
            </Section>
          )}

          <Section icon={DollarSign} title="Price" desc="The asking price shown on your site.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Price"><input value={price} onChange={(e) => setPrice(e.target.value)} className={cn(inputCls, "tnum font-semibold")} placeholder="850000" /></Field>
            </div>
          </Section>

          <Section icon={Home} title="Status" desc={`Where this ${def.noun} sits in your workflow.`}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {dash.statuses.map((st) => <button key={st.value} type="button" onClick={() => setStatus(st.value)} className={cn("h-9 rounded-lg border text-[12.5px] font-semibold transition", status === st.value ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n100")}>{st.label}</button>)}
            </div>
          </Section>

          <Section icon={ImageIcon} title="Photos" desc="The first photo is the cover shown on your website. Hover a photo to set cover or remove.">
            {photoUrls.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {photoUrls.map((src, i) => (
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
                  {photoUrls.length < 24 && (
                    <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-n300 text-n400 transition hover:bg-n50">
                      <Upload className="h-4 w-4" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                    </label>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-n500"><b className="text-n800">{photoUrls.length}</b> photo{photoUrls.length === 1 ? "" : "s"} attached</p>
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
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="grid aspect-[16/10] place-items-center bg-n100 text-n400"><Home className="h-8 w-8" /></div>
              )}
              <div className="p-4">
                <p className="text-[14px] font-semibold text-n900">{title || `New ${def.noun}`}</p>
                <p className="text-[12px] text-n500">{subtitle || "—"}</p>
                <p className="tnum mt-2 text-[24px] font-bold text-n900">{priceNum ? money(priceNum) : "$—"}</p>
              </div>
            </div>

            {err && <p className="mb-2 text-[12.5px] font-medium text-err">{err}</p>}
            <div className="flex items-center gap-2">
              <Link href="/dashboard/inventory" className="h-10 flex-1 rounded-lg border border-n200 bg-white text-center text-[13px] font-semibold leading-10 text-n700 transition hover:bg-n50">Cancel</Link>
              <button onClick={save} disabled={saving} className="h-10 flex-1 rounded-lg bg-brand text-[13px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60">{saving ? "Saving…" : edit ? "Save changes" : `Add ${def.noun}`}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
