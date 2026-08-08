"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";
import { Uploader } from "@/components/app/website/panels";
import { ArrowLeft, Loader2, Rocket, Monitor, Smartphone, Layers, Palette, X } from "lucide-react";

/* Real-site visual builder: opens the dealer's ACTUAL website in an iframe (builder mode).
 * Clicking any tagged element on the page opens its editor here; saves stage into the
 * draft and the iframe refreshes. "Advanced" opens the element/section canvas. */

type FieldType = "text" | "textarea" | "color" | "image";
const EDIT_FIELDS: Record<string, { label: string; type: FieldType }> = {
  headline: { label: "Headline", type: "text" },
  intro: { label: "Intro paragraph", type: "textarea" },
  ctaLabel: { label: "Button label", type: "text" },
  heroImageUrl: { label: "Hero image", type: "image" },
  logoUrl: { label: "Logo", type: "image" },
  primaryColor: { label: "Brand color", type: "color" },
  aboutText: { label: "About text", type: "textarea" },
  financingText: { label: "Financing text", type: "textarea" },
};

type WebValues = Record<string, unknown>;

export default function BuildPage() {
  const router = useRouter();
  const [values, setValues] = useState<WebValues>({});
  const [ready, setReady] = useState(false);
  const [field, setField] = useState<string | null>(null);
  const [draftVal, setDraftVal] = useState<string>("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(() => apiFetch<WebValues>("/website").then((w) => { setValues(w); setReady(true); }).catch(() => setReady(true)), []);
  useEffect(() => { if (!getToken()) { router.replace("/login"); return; } load(); }, [router, load]);

  const openField = useCallback((key: string) => {
    if (!EDIT_FIELDS[key]) return;
    setField(key);
    setDraftVal(typeof values[key] === "string" ? (values[key] as string) : "");
  }, [values]);

  // Clicks inside the iframe post the field key here.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "krakd:edit" && typeof e.data.key === "string") openField(e.data.key); };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [openField]);

  const save = async () => {
    if (!field) return;
    setSaving(true);
    try {
      await apiFetch("/website", { method: "PATCH", body: JSON.stringify({ [field]: draftVal }) });
      setValues((v) => ({ ...v, [field]: draftVal }));
      setNonce((n) => n + 1); // refresh the iframe to show the staged change
    } catch { /* */ }
    setSaving(false);
  };

  const publish = async () => { setPublishing(true); try { await apiFetch("/website/publish", { method: "POST", body: JSON.stringify({ status: "PUBLISHED" }) }); } catch { /* */ } setPublishing(false); };

  if (!ready) return <div className="grid h-full place-items-center text-[13px] text-n400">Loading your site…</div>;

  const def = field ? EDIT_FIELDS[field] : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-n200 bg-white px-4 py-2.5">
        <Link href="/dashboard/website" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-n600 hover:text-n900"><ArrowLeft className="h-4 w-4" />Exit</Link>
        <span className="text-[13px] font-semibold text-n900">Visual builder</span>
        <span className="hidden text-[12px] text-n400 sm:inline">Click anything on your site to edit it</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => openField("primaryColor")} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-n200 px-3 text-[12.5px] font-medium text-n700 hover:bg-n50"><Palette className="h-3.5 w-3.5" />Brand</button>
          <button onClick={() => openField("logoUrl")} className="inline-flex h-8 items-center rounded-lg border border-n200 px-3 text-[12.5px] font-medium text-n700 hover:bg-n50">Logo</button>
          <Link href="/dashboard/website/build/advanced" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-n200 px-3 text-[12.5px] font-medium text-n700 hover:bg-n50"><Layers className="h-3.5 w-3.5" />Sections</Link>
          <div className="inline-flex rounded-lg border border-n200 p-0.5">
            <button onClick={() => setDevice("desktop")} className={`grid h-7 w-8 place-items-center rounded ${device === "desktop" ? "bg-n100 text-n900" : "text-n500"}`}><Monitor className="h-4 w-4" /></button>
            <button onClick={() => setDevice("mobile")} className={`grid h-7 w-8 place-items-center rounded ${device === "mobile" ? "bg-n100 text-n900" : "text-n500"}`}><Smartphone className="h-4 w-4" /></button>
          </div>
          <button onClick={publish} disabled={publishing} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}Publish</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <main className="min-h-0 flex-1 overflow-hidden bg-n100 p-4">
          <div className={`mx-auto h-full overflow-hidden rounded-xl border border-n300 bg-white shadow-sm ${device === "mobile" ? "w-[390px]" : "w-full"}`}>
            <iframe key={nonce} src="/website-preview?builder=1" title="Your website" className="h-full w-full border-0" />
          </div>
        </main>

        {def && (
          <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-n200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-n900">Edit {def.label}</p>
              <button onClick={() => setField(null)} className="grid h-7 w-7 place-items-center rounded text-n500 hover:bg-n100"><X className="h-4 w-4" /></button>
            </div>
            <FieldEditor type={def.type} value={draftVal} onChange={setDraftVal} />
            <div className="mt-4 flex items-center gap-2">
              <button onClick={save} disabled={saving} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-brand text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Save</button>
              <button onClick={() => setField(null)} className="h-9 rounded-lg border border-n200 px-3 text-[12.5px] font-semibold text-n700 hover:bg-n50">Cancel</button>
            </div>
            <p className="mt-3 text-[11px] text-n400">Saved changes stage to your draft. Hit Publish to make them live.</p>
          </aside>
        )}
      </div>
    </div>
  );
}

function FieldEditor({ type, value, onChange }: { type: FieldType; value: string; onChange: (v: string) => void }) {
  const input = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  if (type === "textarea") return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className={`${input} h-auto resize-none py-2`} />;
  if (type === "color") return <div className="flex items-center gap-2"><input type="color" value={value || "#2b6ba4"} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded border border-n200" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#2b6ba4" className={input} /></div>;
  if (type === "image") return <Uploader value={value} onChange={onChange} label="" aspect="wide" />;
  return <input value={value} onChange={(e) => onChange(e.target.value)} className={input} />;
}
