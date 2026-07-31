"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Topbar } from "@/components/app/Topbar";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Plus, Trash2, Send, Copy, ExternalLink, Loader2, Check } from "lucide-react";

type Item = { description: string; quantity: number; unit: number };
type Quote = {
  id: string; number: string; status: string; clientName: string; clientEmail: string; clientPhone: string;
  projectTitle: string; notes: string; taxRate: number; validUntil: string; publicToken: string;
  subtotal: number; tax: number; total: number; items: { description: string; quantity: number; unit: number }[];
};

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS: Record<string, string> = { DRAFT: "bg-n100 text-n600", SENT: "bg-brand-soft text-brand", ACCEPTED: "bg-ok-soft text-ok", DECLINED: "bg-err-soft text-err", EXPIRED: "bg-warn-soft text-warn" };
const field = "h-10 w-full rounded-lg border border-n200 bg-white px-3 text-[13px] text-n900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-n400";

export function QuoteBuilder({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useApi<Quote>(`/quotes/${id}`);
  const [f, setF] = useState<Quote | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState<null | "save" | "send">(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (data) { setF(data); setItems(data.items.length ? data.items : [{ description: "", quantity: 1, unit: 0 }]); } }, [data]);
  const set = <K extends keyof Quote>(k: K, v: Quote[K]) => setF((p) => (p ? { ...p, [k]: v } : p));
  const setItem = (i: number, k: keyof Item, v: string) => setItems((p) => p.map((it, j) => (j === i ? { ...it, [k]: k === "description" ? v : Number(v) || 0 } : it)));
  const addRow = () => setItems((p) => [...p, { description: "", quantity: 1, unit: 0 }]);
  const rmRow = (i: number) => setItems((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p));

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unit, 0);
    const tax = subtotal * ((f?.taxRate ?? 0) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [items, f?.taxRate]);

  if (!f) return (<><Topbar crumbs={[{ label: "Quotes", href: "/dashboard/quotes" }, { label: "…" }]} /><div className="p-12 text-center text-[13px] text-n400">Loading…</div></>);

  const body = () => ({
    clientName: f.clientName, clientEmail: f.clientEmail, clientPhone: f.clientPhone, projectTitle: f.projectTitle,
    notes: f.notes, taxRate: f.taxRate, validUntil: f.validUntil,
    items: items.filter((it) => it.description.trim() || it.unit > 0).map((it) => ({ description: it.description, quantity: it.quantity, unit: it.unit })),
  });

  const save = async (send = false) => {
    setErr(null); setSaving(send ? "send" : "save");
    try {
      const payload = send ? { ...body(), status: "SENT" } : body();
      const r = await apiFetch<Quote>(`/quotes/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      setF(r); setItems(r.items.length ? r.items : items);
      setSaved(true); setTimeout(() => setSaved(false), 2200);
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Could not save."); }
    finally { setSaving(null); }
  };

  const link = typeof window !== "undefined" ? `${window.location.origin}/quote/${f.publicToken}` : "";
  const copy = () => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const del = async () => { if (!confirm("Delete this quote?")) return; await apiFetch(`/quotes/${id}`, { method: "DELETE" }); router.push("/dashboard/quotes"); };

  return (
    <div className="app-scope flex min-h-dvh flex-col bg-white">
      <Topbar crumbs={[{ label: "Quotes", href: "/dashboard/quotes" }, { label: f.number }]} />
      <div className="grid w-full grid-cols-1 gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h1 className="text-[22px] font-bold tracking-[-0.02em] text-n900">{f.number}</h1><p className="text-[13px] text-n500">Build a clean, itemized estimate to send your client.</p></div>
            <span className={cn("rounded-full px-3 py-1 text-[12px] font-semibold", STATUS[f.status])}>{f.status}</span>
          </div>

          <section className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h4 className="mb-4 text-[13px] font-semibold text-n900">Client & project</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Client name</span><input value={f.clientName} onChange={(e) => set("clientName", e.target.value)} className={field} /></label>
              <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Project</span><input value={f.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} placeholder="Kitchen remodel" className={field} /></label>
              <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Email</span><input value={f.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} placeholder="client@email.com" className={field} /></label>
              <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Phone</span><input value={f.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} className={field} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h4 className="mb-3 text-[13px] font-semibold text-n900">Line items</h4>
            <div className="overflow-hidden rounded-lg border border-n200">
              <table className="w-full text-[13px]">
                <thead className="bg-n50/70 text-[11px] font-bold uppercase tracking-wide text-n500">
                  <tr><th className="px-3 py-2 text-left">Description</th><th className="w-20 px-2 py-2 text-right">Qty</th><th className="w-28 px-2 py-2 text-right">Unit</th><th className="w-28 px-2 py-2 text-right">Amount</th><th className="w-9"></th></tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t border-n100">
                      <td className="p-1.5"><input value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} placeholder="e.g. Demolition & haul-off" className="h-9 w-full rounded-md px-2 text-[13px] outline-none focus:bg-n50" /></td>
                      <td className="p-1.5"><input value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} inputMode="decimal" className="tnum h-9 w-full rounded-md px-2 text-right text-[13px] outline-none focus:bg-n50" /></td>
                      <td className="p-1.5"><input value={it.unit} onChange={(e) => setItem(i, "unit", e.target.value)} inputMode="decimal" className="tnum h-9 w-full rounded-md px-2 text-right text-[13px] outline-none focus:bg-n50" /></td>
                      <td className="tnum px-2 text-right font-semibold text-n900">{money(it.quantity * it.unit)}</td>
                      <td className="px-1 text-center"><button onClick={() => rmRow(i)} className="grid h-7 w-7 place-items-center rounded-md text-n400 hover:bg-n100 hover:text-err"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addRow} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-n200 px-3 py-2 text-[12.5px] font-semibold text-n700 hover:bg-n50"><Plus className="h-3.5 w-3.5" />Add line</button>
          </section>

          <section className="rounded-2xl border border-n200 bg-white p-5 sh-card">
            <h4 className="mb-3 text-[13px] font-semibold text-n900">Notes / terms</h4>
            <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Payment terms, exclusions, timeline…" className={cn(field, "h-auto resize-y py-2 leading-relaxed")} />
          </section>
        </div>

        {/* rail */}
        <div>
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl border border-n200 bg-white p-5 sh-card">
              <div className="space-y-2 text-[13.5px]">
                <div className="flex justify-between"><span className="text-n500">Subtotal</span><span className="tnum font-semibold text-n900">{money(totals.subtotal)}</span></div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-n500">Tax
                    <input value={f.taxRate} onChange={(e) => set("taxRate", Number(e.target.value) || 0)} inputMode="decimal" className="tnum h-6 w-12 rounded border border-n200 px-1 text-center text-[12px] outline-none" />%
                  </span>
                  <span className="tnum font-semibold text-n900">{money(totals.tax)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-n200 pt-2.5"><span className="text-[15px] font-semibold text-n900">Total</span><span className="tnum text-[20px] font-bold text-n900">{money(totals.total)}</span></div>
              </div>
              <label className="mt-4 block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Valid until</span><input type="date" value={f.validUntil} onChange={(e) => set("validUntil", e.target.value)} className={field} /></label>
            </div>

            {err && <p className="text-[12.5px] font-medium text-err">{err}</p>}
            <div className="space-y-2">
              <button onClick={() => save(false)} disabled={!!saving} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-n200 bg-white text-[13px] font-semibold text-n800 transition hover:bg-n50 disabled:opacity-60">{saving === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" />Saved</> : "Save draft"}</button>
              <button onClick={() => save(true)} disabled={!!saving} className="btn-brand inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60">{saving === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" />{f.status === "DRAFT" ? "Send to client" : "Re-send"}</>}</button>
            </div>

            {f.status !== "DRAFT" && (
              <div className="rounded-2xl border border-n200 bg-white p-4 sh-card">
                <p className="mb-2 text-[12px] font-semibold text-n900">Client link</p>
                <div className="flex items-center gap-1.5">
                  <input readOnly value={link} className="h-9 flex-1 rounded-md border border-n200 bg-n50 px-2 text-[11.5px] text-n600 outline-none" />
                  <button onClick={copy} className="grid h-9 w-9 place-items-center rounded-md border border-n200 text-n600 hover:bg-n50" title="Copy">{copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}</button>
                  <a href={link} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-md border border-n200 text-n600 hover:bg-n50" title="Preview"><ExternalLink className="h-4 w-4" /></a>
                </div>
              </div>
            )}
            <button onClick={del} className="w-full text-center text-[12.5px] font-semibold text-err/80 hover:text-err">Delete quote</button>
          </div>
        </div>
      </div>
    </div>
  );
}
