"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { apiFetch } from "@/lib/api";
import { AdPreview } from "@/components/app/AdPreview";
import { netByChannel, money } from "@/lib/networks";
import { Check, X, Loader2, WifiOff, ClipboardCheck } from "lucide-react";

type Review = {
  id: string; dealer: string; name: string; channel: string; format: string; objective: string;
  budgetCents: number; netSpendCents: number; primaryText: string | null; headline: string | null;
  description: string | null; cta: string | null; creativeImageUrl: string | null; creativeImages: string[]; connected: boolean;
};

export default function AdReviewPage() {
  const { data, loading, reload } = useApi<{ items: Review[]; count: number }>("/admin/campaigns");
  const [busy, setBusy] = useState<string | null>(null);
  const items = data?.items ?? [];

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id + action);
    try { await apiFetch(`/admin/campaigns/${id}`, { method: "POST", body: JSON.stringify({ action }) }); reload(); }
    catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><ClipboardCheck className="h-5 w-5" /></span>
        <div>
          <h1 className="text-[20px] font-bold text-n900">Ad review</h1>
          <p className="text-[13px] text-n500">Campaigns submitted by dealers, awaiting approval to publish.</p>
        </div>
        {items.length > 0 && <span className="ml-auto rounded-full bg-brand px-2.5 py-1 text-[12px] font-semibold text-white">{items.length} pending</span>}
      </div>

      {loading ? <p className="py-16 text-center text-[13px] text-n500">Loading…</p>
        : items.length === 0 ? (
          <div className="rounded-2xl border border-n200 bg-white py-20 text-center">
            <Check className="mx-auto h-8 w-8 text-ok" />
            <p className="mt-2 text-[15px] font-semibold text-n900">Queue is clear</p>
            <p className="mt-1 text-[13px] text-n500">No campaigns waiting for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((c) => {
              const n = netByChannel(c.channel);
              return (
                <div key={c.id} className="grid gap-4 rounded-2xl border border-n200 bg-white p-5 sm:grid-cols-[minmax(0,300px)_1fr]">
                  <div className="rounded-xl bg-n100/70 p-3">
                    <AdPreview creative={{ network: c.channel as "FACEBOOK" | "INSTAGRAM" | "GOOGLE", business: c.dealer, image: c.creativeImageUrl, images: c.creativeImages, format: c.format, primaryText: c.primaryText ?? "", headline: c.headline ?? "", description: c.description ?? "", cta: c.cta ?? "LEARN_MORE" }} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {n && /* eslint-disable-next-line @next/next/no-img-element */ <img src={n.logo} alt="" className="h-4 w-4" />}
                      <span className="text-[12px] font-medium text-n500">{n?.name ?? c.channel} · {c.format.replace(/_/g, " ").toLowerCase()}</span>
                    </div>
                    <p className="mt-1 text-[16px] font-semibold text-n900">{c.name}</p>
                    <p className="text-[13px] text-n600">{c.dealer}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
                      <div><span className="text-n500">Budget </span><span className="tnum font-semibold text-n900">{money(c.budgetCents)}</span></div>
                      <div><span className="text-n500">Media spend </span><span className="tnum font-semibold text-n900">{money(c.netSpendCents)}</span></div>
                    </div>
                    {!c.connected && <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-warn-soft/60 px-2.5 py-1.5 text-[12px] font-medium text-warn"><WifiOff className="h-3.5 w-3.5" />Dealer hasn&apos;t connected {n?.name ?? c.channel} — can&apos;t publish yet</p>}
                    <div className="mt-auto flex gap-2 pt-4">
                      <button onClick={() => act(c.id, "approve")} disabled={!c.connected || !!busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-hover disabled:opacity-40">{busy === c.id + "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Approve & publish</button>
                      <button onClick={() => act(c.id, "reject")} disabled={!!busy} className="inline-flex h-9 items-center gap-2 rounded-lg border border-n200 bg-white px-4 text-[13px] font-semibold text-n700 hover:bg-n100 disabled:opacity-40">{busy === c.id + "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}Reject</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
