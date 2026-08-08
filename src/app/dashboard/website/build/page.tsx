"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";
import { Uploader } from "@/components/app/website/panels";
import { useSidebar } from "@/components/app/SidebarContext";
import { ArrowLeft, Loader2, Rocket, Monitor, Smartphone, Palette, X } from "lucide-react";

/* Real-site visual builder: opens the dealer's ACTUAL website in an iframe (builder mode).
 * Clicking any element on the page opens its editor here — single fields or whole regions
 * (navbar / hero / vehicle cards / footer). Saves stage into the draft; the iframe refreshes. */

type FieldType = "text" | "textarea" | "color" | "image";
const EDIT_FIELDS: Record<string, { label: string; type: FieldType }> = {
  headline: { label: "Headline", type: "text" }, intro: { label: "Intro paragraph", type: "textarea" },
  ctaLabel: { label: "Button label", type: "text" }, heroImageUrl: { label: "Hero image", type: "image" },
  logoUrl: { label: "Logo", type: "image" }, primaryColor: { label: "Brand color", type: "color" },
  aboutText: { label: "About text", type: "textarea" }, financingText: { label: "Financing text", type: "textarea" },
};

type WV = Record<string, unknown>;

export default function BuildPage() {
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();
  const didCollapse = useRef(false);
  const [values, setValues] = useState<WV>({});
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [publishing, setPublishing] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Immersive: collapse the app sidebar while in the builder, restore on exit.
  useEffect(() => { if (!collapsed && !didCollapse.current) { didCollapse.current = true; toggle(); } return () => { if (didCollapse.current) toggle(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => apiFetch<WV>("/website").then((w) => { setValues(w); setReady(true); }).catch(() => setReady(true)), []);
  useEffect(() => { if (!getToken()) { router.replace("/login"); return; } load(); }, [router, load]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "krakd:edit" && typeof e.data.key === "string") setSel(e.data.key); };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Patch one or more website fields → stage to draft → refresh the iframe.
  const patch = useCallback(async (obj: WV) => {
    await apiFetch("/website", { method: "PATCH", body: JSON.stringify(obj) });
    setValues((v) => ({ ...v, ...obj }));
    setNonce((n) => n + 1);
  }, []);

  const publish = async () => { setPublishing(true); try { await apiFetch("/website/publish", { method: "POST", body: JSON.stringify({ status: "PUBLISHED" }) }); } catch { /* */ } setPublishing(false); };

  if (!ready) return <div className="grid h-full place-items-center text-[13px] text-n400">Loading your site…</div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-n200 bg-white px-4 py-2.5">
        <Link href="/dashboard/website" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-n600 hover:text-n900"><ArrowLeft className="h-4 w-4" />Exit</Link>
        <span className="text-[13px] font-semibold text-n900">Visual builder</span>
        <span className="hidden text-[12px] text-n400 sm:inline">Click anything on your site to edit it</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setSel("primaryColor")} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-n200 px-3 text-[12.5px] font-medium text-n700 hover:bg-n50"><Palette className="h-3.5 w-3.5" />Brand</button>
          <button onClick={() => setSel("section:footer")} className="inline-flex h-8 items-center rounded-lg border border-n200 px-3 text-[12.5px] font-medium text-n700 hover:bg-n50">Footer</button>
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

        {sel && (
          <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-n200 bg-white p-4">
            <Panel sel={sel} values={values} onPatch={patch} onClose={() => setSel(null)} />
          </aside>
        )}
      </div>
    </div>
  );
}

function Panel({ sel, values, onPatch, onClose }: { sel: string; values: WV; onPatch: (o: WV) => Promise<void>; onClose: () => void }) {
  const title = sel.startsWith("section:")
    ? ({ "section:header": "Navbar", "section:hero": "Hero section", "section:search": "Search bar", "section:inventory": "Vehicle cards", "section:footer": "Footer" } as Record<string, string>)[sel] ?? "Section"
    : EDIT_FIELDS[sel]?.label ?? sel;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-n900">Edit {title}</p>
        <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded text-n500 hover:bg-n100"><X className="h-4 w-4" /></button>
      </div>
      {sel === "section:hero" ? <HeroPanel values={values} onPatch={onPatch} />
        : sel === "section:header" ? <HeaderPanel values={values} onPatch={onPatch} />
        : sel === "section:search" ? <SearchPanel values={values} onPatch={onPatch} />
        : sel === "section:footer" ? <FooterPanel values={values} onPatch={onPatch} />
        : sel === "section:inventory" ? <InventoryPanel values={values} onPatch={onPatch} />
        : <ScalarPanel field={sel} values={values} onPatch={onPatch} />}
    </div>
  );
}

function useSaver(onPatch: (o: WV) => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const save = async (obj: WV) => { setSaving(true); try { await onPatch(obj); } finally { setSaving(false); } };
  return { saving, save };
}
function SaveRow({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return <button onClick={onSave} disabled={saving} className="mt-1 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Save</button>;
}

function ScalarPanel({ field, values, onPatch }: { field: string; values: WV; onPatch: (o: WV) => Promise<void> }) {
  const def = EDIT_FIELDS[field];
  const [val, setVal] = useState(typeof values[field] === "string" ? (values[field] as string) : "");
  const { saving, save } = useSaver(onPatch);
  if (!def) return <p className="text-[12.5px] text-n400">Not editable here yet.</p>;
  return <div className="space-y-3"><Field type={def.type} value={val} onChange={setVal} /><SaveRow saving={saving} onSave={() => save({ [field]: val })} /></div>;
}

function HeroPanel({ values, onPatch }: { values: WV; onPatch: (o: WV) => Promise<void> }) {
  const g = (k: string) => (typeof values[k] === "string" ? (values[k] as string) : "");
  const [headline, setHeadline] = useState(g("headline"));
  const [intro, setIntro] = useState(g("intro"));
  const [ctaLabel, setCta] = useState(g("ctaLabel"));
  const [heroImageUrl, setHero] = useState(g("heroImageUrl"));
  const { saving, save } = useSaver(onPatch);
  return (
    <div className="space-y-3">
      <L label="Headline"><Field type="text" value={headline} onChange={setHeadline} /></L>
      <L label="Intro"><Field type="textarea" value={intro} onChange={setIntro} /></L>
      <L label="Button label"><Field type="text" value={ctaLabel} onChange={setCta} /></L>
      <L label="Hero image"><Uploader value={heroImageUrl} onChange={setHero} label="" aspect="wide" /></L>
      <SaveRow saving={saving} onSave={() => save({ headline, intro, ctaLabel, heroImageUrl })} />
    </div>
  );
}

function HeaderPanel({ values, onPatch }: { values: WV; onPatch: (o: WV) => Promise<void> }) {
  const h = (values.header && typeof values.header === "object" ? values.header : {}) as Record<string, string>;
  const gs = (k: string, d = "") => (typeof values[k] === "string" ? (values[k] as string) : d);
  const [headerStyle, setHeaderStyle] = useState(gs("headerStyle", "auto"));
  const [logoUrl, setLogo] = useState(gs("logoUrl"));
  const [bg, setBg] = useState(h.bg ?? "");
  const [text, setText] = useState(h.text ?? "");
  const [ctaLabel, setCtaLabel] = useState(h.ctaLabel ?? "");
  const [ctaColor, setCtaColor] = useState(h.ctaColor ?? "");
  const [ctaTextColor, setCtaTextColor] = useState(h.ctaTextColor ?? "");
  const [ctaTargetType, setTt] = useState(h.ctaTargetType ?? "");
  const [ctaTargetValue, setTv] = useState(h.ctaTargetValue ?? "");
  const { saving, save } = useSaver(onPatch);
  return (
    <div className="space-y-3">
      <L label="Preset style"><select value={headerStyle} onChange={(e) => setHeaderStyle(e.target.value)} className={INPUT}>{["auto", "light", "dark", "accent"].map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}</select></L>
      <L label="Background color (overrides preset)"><Field type="color" value={bg} onChange={setBg} /></L>
      <L label="Text / links color"><Field type="color" value={text} onChange={setText} /></L>
      <L label="Logo"><Uploader value={logoUrl} onChange={setLogo} label="" aspect="wide" /></L>
      <div className="rounded-lg border border-n200 p-3">
        <p className="mb-2 text-[11.5px] font-semibold text-n700">Button</p>
        <div className="space-y-2.5">
          <L label="Label"><Field type="text" value={ctaLabel} onChange={setCtaLabel} /></L>
          <div className="grid grid-cols-2 gap-2">
            <L label="Button color"><Field type="color" value={ctaColor} onChange={setCtaColor} /></L>
            <L label="Text color"><Field type="color" value={ctaTextColor} onChange={setCtaTextColor} /></L>
          </div>
          <L label="Goes to"><select value={ctaTargetType} onChange={(e) => setTt(e.target.value)} className={INPUT}><option value="">Default</option><option value="inventory">Inventory page</option><option value="financing">Financing page</option><option value="about">About page</option><option value="contact">Contact page</option><option value="link">Custom link</option></select></L>
          {ctaTargetType === "link" && <L label="Link URL"><Field type="text" value={ctaTargetValue} onChange={setTv} /></L>}
        </div>
      </div>
      <p className="text-[11.5px] text-n400">Edit the menu links in Website → Navbar menu. Changes here apply to the navbar on every page.</p>
      <SaveRow saving={saving} onSave={() => save({ headerStyle, logoUrl, header: { bg, text, ctaLabel, ctaColor, ctaTextColor, ctaTargetType, ctaTargetValue } })} />
    </div>
  );
}

function SearchPanel({ values, onPatch }: { values: WV; onPatch: (o: WV) => Promise<void> }) {
  const so = (values.searchOptions && typeof values.searchOptions === "object" ? values.searchOptions : {}) as Record<string, string>;
  const [bg, setBg] = useState(so.bg ?? "");
  const [buttonColor, setBtn] = useState(so.buttonColor ?? "");
  const { saving, save } = useSaver(onPatch);
  return (
    <div className="space-y-3">
      <L label="Search bar background"><Field type="color" value={bg} onChange={setBg} /></L>
      <L label="Search button color"><Field type="color" value={buttonColor} onChange={setBtn} /></L>
      <SaveRow saving={saving} onSave={() => save({ searchOptions: { bg, buttonColor } })} />
    </div>
  );
}

function FooterPanel({ values, onPatch }: { values: WV; onPatch: (o: WV) => Promise<void> }) {
  const g = (k: string) => (typeof values[k] === "string" ? (values[k] as string) : "");
  const socials = (values.socials && typeof values.socials === "object" ? values.socials : {}) as Record<string, string>;
  const [phone, setPhone] = useState(g("phone"));
  const [email, setEmail] = useState(g("email"));
  const [address, setAddress] = useState(g("address"));
  const [facebook, setFb] = useState(socials.facebook ?? "");
  const [instagram, setIg] = useState(socials.instagram ?? "");
  const { saving, save } = useSaver(onPatch);
  return (
    <div className="space-y-3">
      <L label="Phone"><Field type="text" value={phone} onChange={setPhone} /></L>
      <L label="Email"><Field type="text" value={email} onChange={setEmail} /></L>
      <L label="Address"><Field type="text" value={address} onChange={setAddress} /></L>
      <L label="Facebook URL"><Field type="text" value={facebook} onChange={setFb} /></L>
      <L label="Instagram URL"><Field type="text" value={instagram} onChange={setIg} /></L>
      <SaveRow saving={saving} onSave={() => save({ phone, email, address, socials: { ...socials, facebook, instagram } })} />
    </div>
  );
}

function InventoryPanel({ values, onPatch }: { values: WV; onPatch: (o: WV) => Promise<void> }) {
  const co = (values.cardOptions && typeof values.cardOptions === "object" ? values.cardOptions : {}) as Record<string, boolean>;
  const [finance, setFinance] = useState(co.finance !== false);
  const [photoCount, setPhoto] = useState(co.photoCount !== false);
  const [specs, setSpecs] = useState(co.specs !== false);
  const { saving, save } = useSaver(onPatch);
  const Toggle = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => (
    <label className="flex items-center justify-between rounded-lg border border-n200 px-3 py-2.5 text-[12.5px] font-medium text-n700"><span>{label}</span><input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} /></label>
  );
  return (
    <div className="space-y-2.5">
      <p className="text-[12px] text-n500">What shows on each vehicle card on your homepage.</p>
      <Toggle on={finance} set={setFinance} label="Finance estimate (/mo)" />
      <Toggle on={photoCount} set={setPhoto} label="Photo count badge" />
      <Toggle on={specs} set={setSpecs} label="Spec row (miles, drivetrain…)" />
      <SaveRow saving={saving} onSave={() => save({ cardOptions: { finance, photoCount, specs } })} />
    </div>
  );
}

const INPUT = "h-9 w-full rounded-md border border-n200 bg-white px-2.5 text-[12.5px] text-n900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[11.5px] font-medium text-n600">{label}</label>{children}</div>;
}
function Field({ type, value, onChange }: { type: FieldType; value: string; onChange: (v: string) => void }) {
  if (type === "textarea") return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${INPUT} h-auto resize-none py-2`} />;
  if (type === "color") return <div className="flex items-center gap-2"><input type="color" value={value || "#2b6ba4"} onChange={(e) => onChange(e.target.value)} className="h-9 w-11 rounded border border-n200" /><input value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} /></div>;
  if (type === "image") return <Uploader value={value} onChange={onChange} label="" aspect="wide" />;
  return <input value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} />;
}
