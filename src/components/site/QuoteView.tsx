"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

type Item = { description: string; quantity: number; unit: number; amount: number };
type Quote = {
  number: string; status: string; clientName: string; projectTitle: string; notes: string; taxRate: number;
  subtotal: number; tax: number; total: number; validUntil: string | null; items: Item[];
  business: { name: string; brandColor: string | null; logoUrl: string | null; phone: string | null };
};
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function QuoteView({ token }: { token: string }) {
  const [q, setQ] = useState<Quote | null | "missing">(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    fetch(`/api/v1/public/quote/${token}`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d: Quote) => { setQ(d); setStatus(d.status); }).catch(() => setQ("missing"));
  }, [token]);

  const respond = async (action: "accept" | "decline") => {
    if (action === "decline" && !confirm("Decline this quote?")) return;
    setBusy(true);
    try { const r = await fetch(`/api/v1/public/quote/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) }); const j = await r.json(); if (r.ok) setStatus(j.status); } finally { setBusy(false); }
  };

  if (q === null) return <div className="grid min-h-screen place-items-center bg-[#f4f5f7] text-[13px] text-[#94a3b8]"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>;
  if (q === "missing") return <div className="grid min-h-screen place-items-center bg-[#f4f5f7] text-[14px] text-[#475569]">This quote isn&apos;t available.</div>;

  const accent = q.business.brandColor && /^#[0-9a-fA-F]{6}$/.test(q.business.brandColor) ? q.business.brandColor : "#0f1b2d";
  const responded = status === "ACCEPTED" || status === "DECLINED";

  return (
    <div className="min-h-screen bg-[#eef1f5] px-4 py-10 text-[#0f1b2d]" style={{ fontFamily: "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" }}>
      <div className="mx-auto max-w-[760px]">
        {/* response banner */}
        {status === "ACCEPTED" && <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[14px] font-semibold text-white"><Check className="h-5 w-5" />Quote accepted — thank you! {q.business.name} will be in touch.</div>}
        {status === "DECLINED" && <div className="mb-4 rounded-xl bg-[#64748b] px-5 py-3 text-[14px] font-semibold text-white">Quote declined. Thanks for letting us know.</div>}

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(15,27,45,.25)]">
          {/* header */}
          <div className="flex items-start justify-between gap-4 px-8 pt-8">
            <div>
              {q.business.logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={q.business.logoUrl} alt={q.business.name} className="h-9 w-auto" />
                : <span className="text-[20px] font-bold tracking-tight">{q.business.name}</span>}
              {q.business.phone && <p className="mt-2 text-[12.5px] text-[#64748b]">{q.business.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#94a3b8]">Quote</p>
              <p className="text-[22px] font-bold" style={{ color: accent }}>{q.number}</p>
              {q.validUntil && <p className="mt-1 text-[12px] text-[#64748b]">Valid until {new Date(q.validUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
            </div>
          </div>

          <div className="px-8 pb-2 pt-6">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#94a3b8]">Prepared for</p>
            <p className="text-[16px] font-semibold">{q.clientName}</p>
            {q.projectTitle && <p className="text-[13.5px] text-[#64748b]">{q.projectTitle}</p>}
          </div>

          {/* line items */}
          <div className="px-8 py-6">
            <table className="w-full text-[13.5px]">
              <thead><tr className="border-b border-black/10 text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]"><th className="py-2 text-left">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Amount</th></tr></thead>
              <tbody>
                {q.items.map((it, i) => (
                  <tr key={i} className="border-b border-black/5"><td className="py-3 pr-3 font-medium">{it.description || "—"}</td><td className="py-3 text-right text-[#475569]">{it.quantity}</td><td className="py-3 text-right text-[#475569]">{money(it.unit)}</td><td className="py-3 text-right font-semibold">{money(it.amount)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto mt-5 w-full max-w-[280px] space-y-2 text-[13.5px]">
              <div className="flex justify-between text-[#64748b]"><span>Subtotal</span><span className="font-semibold text-[#0f1b2d]">{money(q.subtotal)}</span></div>
              {q.tax > 0 && <div className="flex justify-between text-[#64748b]"><span>Tax ({q.taxRate}%)</span><span className="font-semibold text-[#0f1b2d]">{money(q.tax)}</span></div>}
              <div className="flex items-center justify-between border-t border-black/10 pt-2.5"><span className="text-[15px] font-bold">Total</span><span className="text-[24px] font-bold" style={{ color: accent }}>{money(q.total)}</span></div>
            </div>
          </div>

          {q.notes && <div className="border-t border-black/8 px-8 py-5"><p className="text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">Notes</p><p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[#475569]">{q.notes}</p></div>}

          {/* actions */}
          {!responded && (
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/8 bg-[#fafbfc] px-8 py-5">
              <button onClick={() => respond("decline")} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-black/12 px-5 py-3 text-[13.5px] font-semibold text-[#64748b] hover:bg-black/[0.03] disabled:opacity-50"><X className="h-4 w-4" />Decline</button>
              <button onClick={() => respond("accept")} disabled={busy} className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[13.5px] font-semibold text-white disabled:opacity-50" style={{ background: accent }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Accept quote</button>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-[12px] text-[#94a3b8]">Powered by Krakd</p>
      </div>
    </div>
  );
}
