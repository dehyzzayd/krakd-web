"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { apiFetch } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { CATALOG, fieldConf, type CreditConfig } from "@/lib/creditApp";
import { CreditAppForm } from "@/components/site/CreditAppForm";
import { Copy, Check, ExternalLink, Loader2, FileText, Settings2, Code } from "lucide-react";

type AppRow = { id: string; status: string; name: string; email: string; phone: string; income: string; coApplicant: boolean; createdAt: string };
type ConfigData = { publicToken: string; config: CreditConfig; consentText: string; disclaimerText: string };
type Settings = { name?: string; brandColor?: string | null; logoUrl?: string | null; phone?: string | null };

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "New", cls: "bg-brand-soft text-brand" }, REVIEWING: { label: "Reviewing", cls: "bg-warn-soft text-warn" },
  APPROVED: { label: "Approved", cls: "bg-ok-soft text-ok" }, DECLINED: { label: "Declined", cls: "bg-err-soft text-err" },
};

function Toggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: () => void }) {
  return <button type="button" disabled={disabled} onClick={onChange} className={cn("relative h-5 w-9 shrink-0 rounded-full transition disabled:opacity-40", on ? "bg-brand" : "bg-n300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", on ? "left-4" : "left-0.5")} /></button>;
}

export default function CreditAppsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"apps" | "builder">("apps");
  const { data: appsData, loading } = useApi<{ items: AppRow[]; stats: { total: number; new: number; approved: number; declined: number } }>("/credit-app/applications");
  const { data: cfgData } = useApi<ConfigData>("/credit-app/config");
  const { data: settings } = useApi<Settings>("/settings");

  const [cfg, setCfg] = useState<CreditConfig | null>(null);
  const [consentText, setConsentText] = useState("");
  const [disclaimerText, setDisclaimerText] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => { if (cfgData) { setCfg(cfgData.config); setConsentText(cfgData.consentText); setDisclaimerText(cfgData.disclaimerText); setToken(cfgData.publicToken); } }, [cfgData]);

  const rows = appsData?.items ?? [];
  const st = appsData?.stats;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/apply/${token}`;
  const iframe = `<iframe src="${link}" width="100%" height="900" style="border:0;max-width:720px" title="Credit application"></iframe>`;
  const business = { name: settings?.name ?? "Your dealership", brandColor: settings?.brandColor ?? null, logoUrl: settings?.logoUrl ?? null, phone: settings?.phone ?? null };

  const setField = (key: string, patch: Partial<{ enabled: boolean; required: boolean }>) => setCfg((c) => c && ({ ...c, fields: { ...c.fields, [key]: { ...c.fields[key], ...patch } } }));
  const copy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 1500); };

  const save = async () => {
    if (!cfg) return;
    setSaving(true); setSaved(false);
    try { await apiFetch("/credit-app/config", { method: "PUT", body: JSON.stringify({ config: cfg, consentText, disclaimerText }) }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Topbar title="Credit applications" />
      <AppMain>
        <div className="mb-4 flex w-max items-center gap-1 rounded-lg border border-n200 bg-white p-0.5">
          {([["apps", "Applications", FileText], ["builder", "Build form", Settings2]] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("flex h-9 items-center gap-2 rounded-[7px] px-3.5 text-[12.5px] font-semibold transition", tab === k ? "bg-n100 text-n900" : "text-n600 hover:text-n900")}><Icon className="h-4 w-4" />{label}</button>
          ))}
        </div>

        {tab === "apps" ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[["Applications", `${st?.total ?? 0}`], ["New", `${st?.new ?? 0}`], ["Approved", `${st?.approved ?? 0}`], ["Declined", `${st?.declined ?? 0}`]].map(([l, v]) => (
                <Card key={l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{v}</p></Card>
              ))}
            </div>
            <Card>
              {loading ? <div className="p-12 text-center text-[13px] text-n400">Loading…</div>
                : rows.length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <FileText className="mx-auto h-7 w-7 text-n300" />
                    <p className="mt-2 text-[14px] font-semibold text-n800">No applications yet</p>
                    <p className="mx-auto mt-1 max-w-[44ch] text-[12.5px] text-n500">Share your application link or embed the form on your site — submissions land here with the applicant&apos;s details.</p>
                    <button onClick={() => setTab("builder")} className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover">Set up the form</button>
                  </div>
                ) : (
                  <table className="w-full text-[13px]">
                    <thead className="border-b border-n200 text-[11px] font-bold uppercase tracking-wide text-n500"><tr><th className="px-4 py-2.5 text-left">Applicant</th><th className="px-2 text-left">Contact</th><th className="px-2 text-right">Monthly income</th><th className="px-2 text-left">Status</th><th className="px-2 pr-4 text-right">Submitted</th></tr></thead>
                    <tbody>
                      {rows.map((r) => { const s = STATUS[r.status] ?? STATUS.NEW; return (
                        <tr key={r.id} onClick={() => router.push(`/dashboard/crm/credit/${r.id}`)} className="cursor-pointer border-b border-n100 transition last:border-0 hover:bg-n50">
                          <td className="px-4 py-3 font-semibold text-n900">{r.name}{r.coApplicant && <span className="ml-2 rounded bg-n100 px-1.5 py-0.5 text-[10px] font-semibold text-n500">+ co-app</span>}</td>
                          <td className="p-2 text-n600">{r.phone}{r.email && <span className="block text-[11.5px] text-n400">{r.email}</span>}</td>
                          <td className="tnum p-2 text-right text-n900">{r.income ? `$${Number(r.income).toLocaleString()}` : "—"}</td>
                          <td className="p-2"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", s.cls)}>{s.label}</span></td>
                          <td className="tnum p-2 pr-4 text-right text-[12px] text-n500">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        </tr>
                      ); })}
                    </tbody>
                  </table>
                )}
            </Card>
          </>
        ) : !cfg ? (
          <div className="py-16 text-center text-[13px] text-n400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
            {/* builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-n500">Toggle which fields appear and which are required. Previous address / employer auto-appear when the applicant reports under 2 years.</p>
                <button onClick={save} disabled={saving} className="btn-brand inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}{saved ? "Saved" : "Save form"}</button>
              </div>

              {CATALOG.map((section) => {
                const isCo = !!section.coapp;
                return (
                  <Card key={section.id} className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-n900">{section.title}</p>
                      {isCo && <label className="flex items-center gap-2 text-[12px] font-medium text-n600">Enable<Toggle on={cfg.coApplicant} onChange={() => setCfg((c) => c && ({ ...c, coApplicant: !c.coApplicant }))} /></label>}
                    </div>
                    {(!isCo || cfg.coApplicant) && (
                      <div className="divide-y divide-n100">
                        {section.fields.map((f) => { const fc = fieldConf(cfg, f); return (
                          <div key={f.key} className="flex items-center gap-3 py-2">
                            <span className="flex-1 text-[12.5px] text-n800">{f.label}{f.showIf && <span className="ml-1.5 rounded bg-n100 px-1.5 py-0.5 text-[10px] text-n500">conditional</span>}{f.locked && <span className="ml-1.5 rounded bg-n100 px-1.5 py-0.5 text-[10px] text-n500">required</span>}</span>
                            <label className="flex items-center gap-1.5 text-[11px] text-n500">Shown<Toggle on={fc.enabled} disabled={f.locked} onChange={() => setField(f.key, { enabled: !fc.enabled, required: !fc.enabled ? fc.required : false })} /></label>
                            <label className="flex items-center gap-1.5 text-[11px] text-n500">Required<Toggle on={fc.required} disabled={f.locked || !fc.enabled} onChange={() => setField(f.key, { required: !fc.required })} /></label>
                          </div>
                        ); })}
                      </div>
                    )}
                  </Card>
                );
              })}

              <Card className="p-5">
                <p className="mb-3 text-[13px] font-semibold text-n900">Consent & disclaimer</p>
                <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Authorization (consent checkbox text)</span><textarea value={consentText} onChange={(e) => setConsentText(e.target.value)} rows={4} className="w-full rounded-lg border border-n200 bg-white px-3 py-2 text-[12.5px] text-n900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" /></label>
                <label className="mt-3 block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Disclaimer (shown above consent)</span><textarea value={disclaimerText} onChange={(e) => setDisclaimerText(e.target.value)} rows={3} className="w-full rounded-lg border border-n200 bg-white px-3 py-2 text-[12.5px] text-n900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" /></label>
              </Card>

              <Card className="p-5">
                <p className="mb-3 text-[13px] font-semibold text-n900">Share & embed</p>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-n500"><ExternalLink className="h-3.5 w-3.5" />Standalone link</p>
                    <div className="flex gap-2"><input readOnly value={link} className="tnum h-9 flex-1 rounded-lg border border-n200 bg-n50 px-3 text-[12px] text-n700" /><button onClick={() => copy(link, "link")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12px] font-semibold text-n700 hover:bg-n100">{copied === "link" ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}Copy</button><a href={link} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-lg border border-n200 bg-white px-3 text-[12px] font-semibold text-n700 hover:bg-n100">Open</a></div>
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-n500"><Code className="h-3.5 w-3.5" />Embed on your website</p>
                    <div className="flex gap-2"><textarea readOnly value={iframe} rows={2} className="tnum flex-1 rounded-lg border border-n200 bg-n50 px-3 py-2 text-[11px] text-n700" /><button onClick={() => copy(iframe, "iframe")} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-n200 bg-white px-3 text-[12px] font-semibold text-n700 hover:bg-n100">{copied === "iframe" ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}Copy</button></div>
                  </div>
                </div>
              </Card>
            </div>

            {/* live preview */}
            <div>
              <div className="sticky top-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-n500">Live preview</p>
                <div className="max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl bg-n100/70 p-4">
                  <CreditAppForm config={cfg} consentText={consentText} disclaimerText={disclaimerText} business={business} preview />
                </div>
              </div>
            </div>
          </div>
        )}
      </AppMain>
    </>
  );
}
