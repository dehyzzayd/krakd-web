"use client";

import { useState } from "react";

export function PaymentCalculator({ price, accent, title = "Estimate your payment" }: { price: number; accent: string; title?: string }) {
  const [amt, setAmt] = useState(price || 30000);
  const [down, setDown] = useState(Math.round((price || 30000) * 0.1));
  const [term, setTerm] = useState(72);
  const [apr, setApr] = useState(8.9);
  const financed = Math.max(0, amt - down);
  const r = apr / 100 / 12;
  const monthly = financed <= 0 ? 0 : Math.round(r === 0 ? financed / term : (financed * r) / (1 - Math.pow(1 + r, -term)));
  const row = "flex items-center justify-between gap-3";
  const inp = "h-9 w-32 rounded-lg border border-black/12 px-2 text-right text-[13px] tabular-nums outline-none focus:border-black/30";
  const selc = "h-9 rounded-lg border border-black/12 px-2 text-[13px] outline-none";

  return (
    <div className="rounded-xl border border-black/8 bg-white p-5">
      <p className="text-[14px] font-semibold text-[#0f172a]">{title}</p>
      <div className="mt-4 space-y-3">
        {!price && <div className={row}><label className="text-[13px] text-[#475569]">Vehicle price</label><input type="number" value={amt} onChange={(e) => setAmt(Math.max(0, +e.target.value))} className={inp} /></div>}
        <div className={row}><label className="text-[13px] text-[#475569]">Down payment</label><input type="number" value={down} onChange={(e) => setDown(Math.max(0, +e.target.value))} className={inp} /></div>
        <div className={row}><label className="text-[13px] text-[#475569]">Term</label><select value={term} onChange={(e) => setTerm(+e.target.value)} className={selc}>{[36, 48, 60, 72, 84].map((t) => <option key={t} value={t}>{t} mo</option>)}</select></div>
        <div className={row}><label className="text-[13px] text-[#475569]">APR</label><select value={apr} onChange={(e) => setApr(+e.target.value)} className={selc}>{[3.9, 5.9, 6.9, 8.9, 10.9, 12.9].map((a) => <option key={a} value={a}>{a}%</option>)}</select></div>
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-black/8 pt-4">
        <span className="text-[13px] text-[#64748b]">Est. monthly</span>
        <span className="text-[28px] font-bold" style={{ color: accent }}>${monthly.toLocaleString()}<span className="text-[14px] font-medium text-[#94a3b8]">/mo</span></span>
      </div>
      <p className="mt-2 text-[11px] text-[#94a3b8]">Estimate only. Taxes, fees and final terms depend on approval.</p>
    </div>
  );
}
