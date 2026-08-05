"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";
import { apiFetch, ApiError } from "@/lib/api";
import { computeDeal, type Deal } from "@/lib/deal";

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;
const toCents = (s: string) => Math.round((parseFloat(s.replace(/[^0-9.]/g, "")) || 0) * 100);
const fromCents = (c?: number) => (c ? String(Math.round(c / 100)) : "");

const box = "h-10 w-full rounded-md border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
function Money({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">{label}</span>
      <div className="flex h-10 items-center rounded-md border border-n200 bg-white px-2.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <span className="text-[13px] font-semibold text-n400">$</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" className="tnum w-full bg-transparent px-1.5 text-[13px] font-semibold text-n900 outline-none" />
      </div>
    </label>
  );
}
function Num({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">{label}</span>
      <div className="flex h-10 items-center rounded-md border border-n200 bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" className="tnum w-full bg-transparent text-[13px] font-semibold text-n900 outline-none" />
        {suffix && <span className="text-[12px] text-n400">{suffix}</span>}
      </div>
    </label>
  );
}

export function DealSheet({ id, leadName, onClose, onSaved }: { id: string; leadName: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ price: "", tradeValue: "", payoff: "", down: "", tax: "", term: "72", apr: "", ty: "", tmk: "", tmd: "", tmi: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    apiFetch<{ deal: Deal }>(`/leads/${id}/deal`).then(({ deal: d }) => {
      setF({
        price: fromCents(d.sellPriceCents), tradeValue: fromCents(d.tradeValueCents), payoff: fromCents(d.tradePayoffCents),
        down: fromCents(d.downCents), tax: d.taxRatePct ? String(d.taxRatePct) : "", term: d.termMonths ? String(d.termMonths) : "72",
        apr: d.aprPct ? String(d.aprPct) : "", ty: d.trade?.year ?? "", tmk: d.trade?.make ?? "", tmd: d.trade?.model ?? "", tmi: d.trade?.mileage ?? "",
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const deal: Deal = {
    sellPriceCents: toCents(f.price), tradeValueCents: toCents(f.tradeValue), tradePayoffCents: toCents(f.payoff),
    downCents: toCents(f.down), taxRatePct: parseFloat(f.tax) || 0, termMonths: parseInt(f.term) || 0, aprPct: parseFloat(f.apr) || 0,
    trade: { year: f.ty, make: f.tmk, model: f.tmd, mileage: f.tmi },
  };
  const c = computeDeal(deal);

  const save = async () => {
    setBusy(true); setErr(null);
    try { await apiFetch(`/leads/${id}/deal`, { method: "PUT", body: JSON.stringify(deal) }); toast.success("Deal saved"); onSaved(); onClose(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save the deal."); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open onClose={onClose} width="max-w-[520px]" title="Work the deal" subtitle={leadName}
      footer={<><button onClick={onClose} className="h-9 rounded-md border border-n200 bg-white px-4 text-[13px] font-medium text-n700 transition hover:bg-n100">Cancel</button><button onClick={save} disabled={busy || loading} className="btn-brand h-9 rounded-md px-4 text-[13px] font-semibold disabled:opacity-60">{busy ? "Saving…" : "Save deal"}</button></>}>
      <div className="space-y-5">
        {/* live payment */}
        <div className="rounded-xl border border-brand/25 bg-brand-soft/40 p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Estimated monthly</p>
          <p className="tnum mt-1 text-[34px] font-bold leading-none text-n900">{money(c.monthlyCents)}<span className="text-[15px] font-semibold text-n500">/mo</span></p>
          <p className="mt-1.5 text-[12px] text-n600">{f.term || 0} mo · {f.apr || 0}% APR · {money(c.financedCents)} financed</p>
        </div>

        {/* vehicle numbers */}
        <div className="grid grid-cols-2 gap-3">
          <Money label="Sale price" value={f.price} onChange={(v) => set("price", v)} />
          <Money label="Cash down" value={f.down} onChange={(v) => set("down", v)} />
          <Num label="Tax rate" value={f.tax} onChange={(v) => set("tax", v)} suffix="%" />
          <div className="grid grid-cols-2 gap-3">
            <Num label="Term" value={f.term} onChange={(v) => set("term", v)} suffix="mo" />
            <Num label="APR" value={f.apr} onChange={(v) => set("apr", v)} suffix="%" />
          </div>
        </div>

        <div className="border-t border-n200" />

        {/* trade appraisal */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-n900">Trade-in appraisal</p>
          <div className="grid grid-cols-4 gap-2">
            <label className="col-span-1 block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Year</span><input value={f.ty} onChange={(e) => set("ty", e.target.value)} className={cn(box, "tnum px-2.5")} /></label>
            <label className="col-span-1 block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Make</span><input value={f.tmk} onChange={(e) => set("tmk", e.target.value)} className={box} /></label>
            <label className="col-span-1 block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Model</span><input value={f.tmd} onChange={(e) => set("tmd", e.target.value)} className={box} /></label>
            <label className="col-span-1 block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Miles</span><input value={f.tmi} onChange={(e) => set("tmi", e.target.value)} className={cn(box, "tnum px-2.5")} /></label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Money label="Trade allowance" value={f.tradeValue} onChange={(v) => set("tradeValue", v)} />
            <Money label="Payoff owed" value={f.payoff} onChange={(v) => set("payoff", v)} />
          </div>
          <p className={cn("mt-2 text-[12px] font-medium", c.tradeEquityCents >= 0 ? "text-ok" : "text-err")}>
            Trade equity: {money(c.tradeEquityCents)} {c.tradeEquityCents < 0 && "(upside-down — rolled into the loan)"}
          </p>
        </div>

        {/* breakdown */}
        <div className="rounded-lg bg-n50 p-3 text-[12.5px]">
          {[["Sale price", money(deal.sellPriceCents ?? 0)], ["Sales tax", money(c.taxCents)], ["Trade equity", money(c.tradeEquityCents)], ["Cash down", money(deal.downCents ?? 0)], ["Amount financed", money(c.financedCents)]].map(([l, v], i) => (
            <div key={l} className={cn("flex items-center justify-between py-1", i === 4 && "mt-1 border-t border-n200 pt-2 font-semibold text-n900")}><span className="text-n600">{l}</span><span className="tnum text-n900">{v}</span></div>
          ))}
        </div>

        {err && <p className="text-[12px] font-medium text-err">{err}</p>}
        <p className="text-[11px] text-n400">Estimate only — final terms depend on lender approval. Send the credit app from the lead to get {leadName.split(" ")[0]} financed.</p>
      </div>
    </Sheet>
  );
}
