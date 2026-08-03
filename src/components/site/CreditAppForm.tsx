"use client";

import { useMemo, useState } from "react";
import { CATALOG, fieldConf, type CField, type CreditConfig } from "@/lib/creditApp";
import { ShieldCheck, Loader2, Check, Lock } from "lucide-react";

type Business = { name: string; brandColor: string | null; logoUrl: string | null; phone: string | null };
const input = "h-11 w-full rounded-xl border border-[#e2e6ec] bg-[#f9fafb] px-3.5 text-[14px] text-[#0f1b2d] outline-none transition focus:border-[var(--acc)] focus:bg-white focus:ring-4 focus:ring-[var(--acc)]/12";

function FieldInput({ f, value, onChange, disabled, req }: { f: CField; value: string; onChange: (v: string) => void; disabled?: boolean; req: boolean }) {
  const common = { value, disabled, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(e.target.value), className: input };
  return (
    <label className={f.half ? "" : "sm:col-span-2"}>
      <span className="mb-1 block text-[12px] font-medium text-[#475569]">{f.label}{req && <span className="text-[var(--acc)]"> *</span>}</span>
      {f.type === "select"
        ? <select {...common}><option value="">Select…</option>{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : f.type === "money"
          ? <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#94a3b8]">$</span><input {...common} inputMode="decimal" onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))} className={`${input} pl-6`} placeholder="0" /></div>
          : <input {...common} type={f.type === "date" ? "date" : f.type === "number" ? "text" : f.type === "email" ? "email" : f.type === "tel" ? "tel" : "text"} inputMode={f.type === "number" ? "numeric" : undefined} placeholder={f.type === "ssn" ? "•••-••-••••" : ""} />}
    </label>
  );
}

export function CreditAppForm({ token, config, consentText, disclaimerText, business, preview }: {
  token?: string; config: CreditConfig; consentText: string; disclaimerText: string; business: Business; preview?: boolean;
}) {
  const [v, setV] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));
  const accent = business.brandColor && /^#[0-9a-fA-F]{6}$/.test(business.brandColor) ? business.brandColor : "#0f1b2d";

  const sections = useMemo(() => CATALOG.filter((s) => !s.coapp || config.coApplicant), [config.coApplicant]);
  const visible = (f: CField) => fieldConf(config, f).enabled && (!f.showIf || Number(v[f.showIf.key] || 0) < f.showIf.lt);

  const submit = async () => {
    if (preview) return;
    setErr(null);
    for (const s of sections) for (const f of s.fields) {
      if (!visible(f)) continue;
      const val = String(v[f.key] ?? "").trim();
      if (fieldConf(config, f).required && !val) { setErr(`Please fill in “${f.label}”.`); return; }
      if (val && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setErr(`“${f.label}” doesn't look like a valid email.`); return; }
      if (val && f.type === "tel" && val.replace(/\D/g, "").length < 10) { setErr(`“${f.label}” needs at least 10 digits.`); return; }
      if (val && f.type === "ssn" && val.replace(/\D/g, "").length !== 9) { setErr(`“${f.label}” must be 9 digits.`); return; }
    }
    if (!consent) { setErr("Please review and accept the authorization to continue."); return; }
    const coKeys = new Set(CATALOG.find((s) => s.coapp)!.fields.map((f) => f.key));
    const applicant: Record<string, string> = {}; const coApplicant: Record<string, string> = {};
    for (const [k, val] of Object.entries(v)) (coKeys.has(k) ? coApplicant : applicant)[k] = val;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/public/credit-app/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicant, coApplicant: config.coApplicant ? coApplicant : null, consent: true }) });
      if (!res.ok) { setErr((await res.json().catch(() => ({}))).message || "Could not submit. Please try again."); return; }
      setDone(true);
    } finally { setBusy(false); }
  };

  if (done) return (
    <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ background: accent }}><Check className="h-7 w-7" /></span>
      <h2 className="mt-4 text-[20px] font-bold text-[#0f1b2d]">Application received</h2>
      <p className="mx-auto mt-2 max-w-[42ch] text-[14px] leading-relaxed text-[#475569]">Thanks — {business.name} has your application and will reach out shortly{business.phone ? ` (${business.phone})` : ""}.</p>
    </div>
  );

  let idx = 0;
  return (
    <div className="mx-auto max-w-[760px]" style={{ ["--acc" as string]: accent }}>
      {/* branded header */}
      <div className="overflow-hidden rounded-2xl border border-[#e6e9ee] bg-white shadow-[0_12px_44px_-28px_rgba(15,27,45,.35)]">
        <div className="h-1.5 w-full" style={{ background: accent }} />
        <div className="flex flex-wrap items-center gap-4 px-6 py-5 sm:px-8">
          {business.logoUrl
            /* eslint-disable-next-line @next/next/no-img-element */
            ? <img src={business.logoUrl} alt={business.name} className="h-11 w-auto max-w-[220px] object-contain" />
            : <span className="text-[22px] font-bold tracking-tight text-[#0f1b2d]">{business.name}</span>}
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-3 py-1.5 text-[12px] font-semibold text-[#475569]"><Lock className="h-3.5 w-3.5" style={{ color: accent }} />Secure application</div>
        </div>
        <div className="border-t border-[#eef1f5] px-6 py-3 sm:px-8">
          <p className="text-[15px] font-semibold text-[#0f1b2d]">Apply for financing</p>
          <p className="text-[12.5px] text-[#64748b]">Takes about 5 minutes · Submitting won&apos;t affect your credit score.</p>
        </div>
      </div>

      {/* form */}
      <div className="mt-4 space-y-7 rounded-2xl border border-[#e6e9ee] bg-white p-6 shadow-[0_12px_44px_-28px_rgba(15,27,45,.35)] sm:p-8">
        {sections.map((s) => {
          const shown = s.fields.filter(visible);
          if (shown.length === 0) return null;
          idx += 1;
          return (
            <div key={s.id}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: accent }}>{idx}</span>
                <p className="text-[15px] font-semibold text-[#0f1b2d]">{s.title}</p>
                <span className="h-px flex-1 bg-[#eef1f5]" />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                {shown.map((f) => <FieldInput key={f.key} f={f} value={v[f.key] ?? ""} onChange={(val) => set(f.key, val)} disabled={preview} req={fieldConf(config, f).required} />)}
              </div>
            </div>
          );
        })}

        <div className="space-y-3 border-t border-[#eef1f5] pt-6">
          {disclaimerText && <p className="rounded-xl bg-[#f8fafc] p-3.5 text-[11.5px] leading-relaxed text-[#64748b]">{disclaimerText}</p>}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e2e6ec] bg-[#f9fafb] p-4 transition hover:border-[var(--acc)]/40">
            <input type="checkbox" checked={consent} disabled={preview} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-[var(--acc)]" />
            <span className="text-[12.5px] leading-relaxed text-[#475569]">{consentText}</span>
          </label>
          {err && <p className="text-[12.5px] font-medium text-[#dc2626]">{err}</p>}
          <button onClick={submit} disabled={busy || preview} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60" style={{ background: accent }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4.5 w-4.5" />}{preview ? "Preview — submit disabled" : "Submit application"}
          </button>
        </div>
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-[#94a3b8]"><Lock className="h-3 w-3" />Secured by Krakd · encrypted in transit</p>
    </div>
  );
}
