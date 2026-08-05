"use client";

import { useState } from "react";
import type { SiteVehicle } from "@/lib/server/site";

const field = "w-full rounded-lg border border-black/12 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-black/30";

export function LeadForm({ slug, accent, vehicle, financing, preview, compact }: {
  slug: string; accent: string; vehicle?: SiteVehicle | null; financing?: boolean; preview?: boolean; compact?: boolean;
}) {
  const [f, setF] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    message: vehicle ? `I'm interested in ${vehicle.title || [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")}.` : financing ? "I'd like to get pre-qualified." : "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr(null);
    if (!f.firstName.trim()) { setErr("Enter your name."); return; }
    if (!f.phone.trim() && !f.email.trim()) { setErr("Add a phone or email so we can reach you."); return; }
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { setErr("That email doesn't look right — please check it."); return; }
    if (f.phone.trim() && f.phone.replace(/\D/g, "").length < 10) { setErr("Enter a valid phone number (at least 10 digits)."); return; }
    if (preview) { setDone(true); return; }
    setBusy(true);
    try {
      const campaignId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("kc") || undefined : undefined;
      const res = await fetch(`/api/v1/public/site/${slug}/lead`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, vehicleId: vehicle?.id, consent, campaignId, hp }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message ?? "Something went wrong."); }
      setDone(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  if (done) return (
    <div className="py-6 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: accent }}>✓</div>
      <p className="mt-3 text-[16px] font-semibold">Thanks — we got your message.</p>
      <p className="mt-1 text-[13.5px] text-[#64748b]">The team will reach out shortly.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className={compact ? "space-y-3" : "grid grid-cols-2 gap-3"}>
        <input placeholder="First name" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} className={field} />
        <input placeholder="Last name" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} className={field} />
      </div>
      <input placeholder="Phone" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
      <input placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} />
      <textarea placeholder="Message" value={f.message} onChange={(e) => set("message", e.target.value)} rows={3} className={`${field} resize-none`} />
      <input type="text" name="company" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
      <label className="flex items-start gap-2 text-[11.5px] leading-relaxed text-[#64748b]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20" style={{ accentColor: accent }} />
        <span>I agree to be contacted by phone, text and email about my enquiry, including by automated means. Consent is not a condition of purchase; message/data rates may apply; reply STOP to opt out. See the privacy policy.</span>
      </label>
      {err && <p className="text-[12.5px] font-medium text-[#dc2626]">{err}</p>}
      <button onClick={submit} disabled={busy} className="w-full rounded-lg py-3 text-[14px] font-semibold text-white disabled:opacity-60" style={{ background: accent }}>{busy ? "Sending…" : financing ? "Request financing" : "Send message"}</button>
    </div>
  );
}

export function LeadModalButton({ slug, accent, vehicle, preview, className, children }: {
  slug: string; accent: string; vehicle?: SiteVehicle | null; preview?: boolean; className?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className} style={{ background: accent }}>{children}</button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[16px] font-semibold">Get in touch</p>
                {vehicle && <p className="mt-0.5 text-[13px] text-[#64748b]">About the {vehicle.year} {vehicle.make} {vehicle.model}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="text-[18px] text-[#94a3b8] hover:text-[#475569]">✕</button>
            </div>
            <LeadForm slug={slug} accent={accent} vehicle={vehicle} preview={preview} compact />
          </div>
        </div>
      )}
    </>
  );
}
