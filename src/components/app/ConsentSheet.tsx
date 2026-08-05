"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";
import { apiFetch, ApiError } from "@/lib/api";
import { ATTESTATION_METHODS, type ConsentRecord } from "@/lib/consent";
import { ShieldCheck, ShieldAlert } from "lucide-react";

const fieldCls = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");

function StatusRow({ label, c }: { label: string; c?: ConsentRecord["sms"] }) {
  const ok = c?.status === "granted";
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-n200 p-3">
      {ok ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-n400" />}
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold text-n900">{label} — {ok ? "Consent on file" : c?.status === "revoked" ? "Revoked" : "No consent"}</p>
        {c && <p className="mt-0.5 text-[11.5px] text-n500">{c.source === "web_form" ? "Customer opted in online" : c.source === "dealer_attested" ? `Attested${c.method ? ` · ${c.method}` : ""}` : c.source} · {when(c.at)}{c.ip ? ` · ${c.ip}` : ""}</p>}
      </div>
    </div>
  );
}

export function ConsentSheet({ id, leadName, onClose, onSaved }: { id: string; leadName: string; onClose: () => void; onSaved: () => void }) {
  const [consent, setConsent] = useState<ConsentRecord>({});
  const [channel, setChannel] = useState<"both" | "sms" | "email">("both");
  const [method, setMethod] = useState(ATTESTATION_METHODS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => { apiFetch<{ consent: ConsentRecord }>(`/leads/${id}/consent`).then((r) => setConsent(r.consent ?? {})).catch(() => {}); }, [id]);

  const submit = async (status: "granted" | "revoked") => {
    setBusy(true); setErr(null);
    try {
      const r = await apiFetch<{ consent: ConsentRecord }>(`/leads/${id}/consent`, { method: "PUT", body: JSON.stringify({ channel, status, method: status === "granted" ? method : undefined, note: note || undefined }) });
      setConsent(r.consent ?? {}); toast.success(status === "granted" ? "Consent recorded" : "Consent revoked"); onSaved();
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open onClose={onClose} width="max-w-[460px]" title="Contact consent" subtitle={leadName}
      footer={<><button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Done</button><button onClick={() => submit("granted")} disabled={busy} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : "Record consent"}</button></>}>
      <div className="space-y-4">
        <div className="space-y-2">
          <StatusRow label="Text (SMS)" c={consent.sms} />
          <StatusRow label="Email" c={consent.email} />
        </div>

        <div className="rounded-lg bg-warn-soft/50 p-3 text-[11.5px] leading-relaxed text-n600">
          Only record consent you actually obtained. Krakd logs who recorded it, when, and how — this is your TCPA/CAN-SPAM audit trail, so the attestation is on your dealership.
        </div>

        <div className="space-y-3">
          <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Applies to</span>
            <div className="grid grid-cols-3 gap-2">
              {([["both", "Text + Email"], ["sms", "Text only"], ["email", "Email only"]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setChannel(v)} className={cn("h-9 rounded-lg border text-[12.5px] font-semibold transition", channel === v ? "border-brand bg-brand-soft text-brand" : "border-n200 text-n600 hover:bg-n100")}>{l}</button>
              ))}
            </div>
          </label>
          <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">How was consent obtained?</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={cn(fieldCls, "px-2.5")}>{ATTESTATION_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
          </label>
          <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Note (optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. signed buyer's order on file" className={fieldCls} />
          </label>
        </div>

        {err && <p className="text-[12px] font-medium text-err">{err}</p>}
        {(consent.sms?.status === "granted" || consent.email?.status === "granted") && (
          <button onClick={() => submit("revoked")} disabled={busy} className="text-[12px] font-semibold text-err hover:underline">Revoke consent (customer opted out)</button>
        )}
      </div>
    </Sheet>
  );
}
