"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { apiFetch } from "@/lib/api";
import { Globe, Loader2, Check } from "lucide-react";

type Item = {
  dealershipId: string; dealership: string; domain: string; status: string;
  priceCents: number; costCents: number; marginCents: number; requestedAt: string;
};

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export default function AdminDomainsPage() {
  const { data, loading, reload } = useApi<{ items: Item[]; registrarConfigured: boolean }>("/admin/domains");
  const [busy, setBusy] = useState<string | null>(null);
  const items = data?.items ?? [];

  const register = async (dealershipId: string, domain: string) => {
    if (!confirm(`Register ${domain} with the registrar now? This spends real money.`)) return;
    setBusy(dealershipId);
    try { await apiFetch("/admin/domains", { method: "POST", body: JSON.stringify({ dealershipId }) }); reload(); }
    catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Globe className="h-5 w-5" /></span>
        <div>
          <h1 className="text-[20px] font-bold text-n900">Domain fulfillment</h1>
          <p className="text-[13px] text-n500">Domains bought through Krakd, paid and awaiting registration.</p>
        </div>
        {items.length > 0 && <span className="ml-auto rounded-full bg-brand px-2.5 py-1 text-[12px] font-semibold text-white">{items.length} pending</span>}
      </div>

      {!data?.registrarConfigured && (
        <div className="mb-4 rounded-lg border border-warn/30 bg-warn-soft/40 px-3.5 py-2.5 text-[12.5px] text-warn">
          Registrar not configured — set VERCEL_TOKEN + VERCEL_PROJECT_ID to buy real domains. Registering now just marks them live.
        </div>
      )}

      {loading ? <p className="py-16 text-center text-[13px] text-n500">Loading…</p>
        : items.length === 0 ? <p className="rounded-xl border border-n200 py-16 text-center text-[13px] text-n500">Nothing awaiting fulfillment.</p>
        : (
          <div className="overflow-hidden rounded-xl border border-n200">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-n200 bg-n50 text-left text-[11px] uppercase tracking-wide text-n500">
                <th className="px-4 py-2.5">Dealer / Domain</th><th className="px-4 py-2.5">Paid</th><th className="px-4 py-2.5">Our cost</th><th className="px-4 py-2.5">Margin</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5" />
              </tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.dealershipId} className="border-b border-n100 last:border-0">
                    <td className="px-4 py-3"><p className="font-semibold text-n900">{i.domain}</p><p className="text-[11.5px] text-n400">{i.dealership}</p></td>
                    <td className="px-4 py-3 tnum">{money(i.priceCents)}</td>
                    <td className="px-4 py-3 tnum text-n500">{money(i.costCents)}</td>
                    <td className="px-4 py-3 tnum font-semibold text-ok">{money(i.marginCents)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-n100 px-2 py-0.5 text-[11px] font-semibold text-n600">{i.status.replace("_", " ").toLowerCase()}</span></td>
                    <td className="px-4 py-3 text-right">
                      {i.status === "PENDING_PURCHASE"
                        ? <button disabled={!!busy} onClick={() => register(i.dealershipId, i.domain)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{busy === i.dealershipId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Register</button>
                        : <span className="text-[11.5px] text-n400">In progress</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
