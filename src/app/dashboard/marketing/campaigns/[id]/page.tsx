"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { useApi } from "@/lib/useApi";
import { apiFetch } from "@/lib/api";
import { AdPreview } from "@/components/app/AdPreview";
import { AreaChart, FunnelChart } from "@/components/app/Charts";
import { useToast } from "@/components/app/Toast";
import { TrendingUp, Lightbulb, Copy } from "lucide-react";

type Metrics = { cpmCents: number; ctr: number; cpcCents: number; cplCents: number; costPerSoldCents: number; roas: number; grossCents: number };
type Stage = { key: string; value: number; rate: number | null; costEachCents: number };
type Insight = { tone: "ok" | "warn" | "info" | "brand"; title: string; detail: string };
type Analytics = { series: { date: string; spendCents: number; impressions: number; clicks: number; leads: number }[]; metrics: Metrics; funnel: Stage[]; insights: Insight[]; sold: number; appts: number; leadCount: number };
const shortDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const INSIGHT_TONE: Record<string, string> = { ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", info: "bg-n100 text-n600", brand: "bg-brand-soft text-brand" };

type Campaign = {
  id: string; name: string; channel: string; objective: string; status: string;
  budgetCents: number; feeCents: number; netSpendCents: number; spentCents: number;
  impressions: number; clicks: number; leadCount: number;
  radiusMiles: number; ageMin: number; ageMax: number; gender: string; smartTargeting: boolean;
  frequency: string; promotedVehicleIds: string[];
  format: string | null; primaryText: string | null; headline: string | null; description: string | null; cta: string | null; creativeImageUrl: string | null; creativeImages: string[];
};

const CHANNEL_LABEL: Record<string, string> = { FACEBOOK: "Facebook", INSTAGRAM: "Instagram", GOOGLE: "Google" };
const OBJ_LABEL: Record<string, string> = { LEADS: "Leads", CALLS: "Calls", TRAFFIC: "Traffic", MESSAGES: "Messages" };
const FREQ_LABEL: Record<string, string> = { ONE_TIME: "One-time", WEEKLY: "Weekly", MONTHLY: "Monthly" };
const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-n100 text-n600" },
  PENDING_REVIEW: { label: "In review", cls: "bg-warn-soft text-warn" },
  ACTIVE: { label: "Active", cls: "bg-ok-soft text-ok" },
  PAUSED: { label: "Paused", cls: "bg-n100 text-n600" },
  ENDED: { label: "Ended", cls: "bg-n100 text-n500" },
  REJECTED: { label: "Rejected", cls: "bg-err-soft text-err" },
};
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useApi<Campaign>(`/campaigns/${id}`);
  const { data: an } = useApi<Analytics>(`/campaigns/${id}/analytics`);
  const { data: ov } = useApi<{ dealershipName?: string }>("/overview");
  const { data: site } = useApi<{ slug?: string; status?: string }>("/website");
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [spend, setSpend] = useState("");
  const [savingSpend, setSavingSpend] = useState(false);

  const patch = async (status: string) => {
    setBusy(true);
    try { await apiFetch(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); toast.success("Campaign updated"); reload(); }
    finally { setBusy(false); }
  };
  const saveSpend = async () => {
    const cents = Math.round((parseFloat(spend.replace(/[^0-9.]/g, "")) || 0) * 100);
    setSavingSpend(true);
    try { await apiFetch(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify({ spentCents: cents }) }); toast.success("Spend updated"); setSpend(""); reload(); }
    catch { toast.error("Could not save spend."); }
    finally { setSavingSpend(false); }
  };
  const trackUrl = site?.slug && typeof window !== "undefined" ? `${window.location.origin}/site/${site.slug}?kc=${id}` : null;

  if (error) return (
    <>
      <Topbar crumbs={[{ label: "Campaigns", href: "/dashboard/marketing/campaigns" }, { label: "Campaign" }]} />
      <AppMain>
        <div className="py-16 text-center">
          <p className="text-[14px] font-semibold text-n800">Campaign not found</p>
          <Link href="/dashboard/marketing/campaigns" className="mt-3 inline-block text-[13px] font-semibold text-brand">← All campaigns</Link>
        </div>
      </AppMain>
    </>
  );

  const c = data;
  const s = c ? STATUS[c.status] ?? STATUS.DRAFT : null;

  return (
    <>
      <Topbar crumbs={[{ label: "Campaigns", href: "/dashboard/marketing/campaigns" }, { label: c?.name ?? "Campaign" }]} />
      <AppMain>
        {loading && !c ? (
          <div className="py-16 text-center text-[13px] text-n500">Loading…</div>
        ) : c && s ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[20px] font-semibold text-n900">{c.name}</h1>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>
              <span className="text-[12.5px] text-n500">{CHANNEL_LABEL[c.channel] ?? c.channel} · {OBJ_LABEL[c.objective] ?? c.objective} · {FREQ_LABEL[c.frequency] ?? c.frequency}</span>
              <div className="ml-auto flex items-center gap-2">
                {c.status === "DRAFT" && <button disabled={busy} onClick={() => patch("PENDING_REVIEW")} className="h-9 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">Submit for review</button>}
                {c.status === "ACTIVE" && <button disabled={busy} onClick={() => patch("PAUSED")} className="h-9 rounded-lg border border-n200 bg-white px-4 text-[12.5px] font-semibold text-n700 hover:bg-n100 disabled:opacity-60">Pause</button>}
                {c.status === "PAUSED" && <button disabled={busy} onClick={() => patch("ACTIVE")} className="h-9 rounded-lg bg-brand px-4 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60">Resume</button>}
                {(c.status === "ACTIVE" || c.status === "PAUSED") && <button disabled={busy} onClick={() => patch("ENDED")} className="h-9 rounded-lg px-3 text-[12.5px] font-medium text-err hover:bg-err-soft disabled:opacity-60">End</button>}
              </div>
            </div>

            {/* what happens next — the publish pipeline */}
            {(c.status === "DRAFT" || c.status === "PENDING_REVIEW") && (
              <div className="rounded-xl border border-n200 bg-n50/70 p-4">
                <p className="text-[12.5px] font-semibold text-n900">{c.status === "DRAFT" ? "Ready to launch?" : "In review"}</p>
                <div className="mt-3 flex items-center gap-1 text-[11.5px]">
                  {[
                    { k: "Draft", done: true },
                    { k: "Krakd review", done: c.status !== "DRAFT" },
                    { k: `Publish to ${CHANNEL_LABEL[c.channel] ?? c.channel}`, done: false },
                    { k: "Live + reporting", done: false },
                  ].map((st, i, arr) => (
                    <span key={st.k} className="flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${st.done ? "bg-ok-soft text-ok" : "bg-n100 text-n500"}`}>{st.k}</span>
                      {i < arr.length - 1 && <span className="text-n300">→</span>}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-n600">{c.status === "DRAFT"
                  ? "Submitting sends the campaign to Krakd for a quick policy check. Once approved, it's published to your connected ad account automatically — spend, impressions and leads then sync back here."
                  : "Krakd is checking the creative against ad policies. When it's approved we publish it to your connected account and it goes live — no further action needed."}</p>
              </div>
            )}

            {/* ad creative */}
            <div className="grid gap-3 lg:grid-cols-[minmax(0,340px)_1fr]">
              <div>
                <p className="mb-2 text-[13px] font-semibold text-n900">Ad creative</p>
                <div className="rounded-xl bg-n100/70 p-4">
                  <AdPreview creative={{
                    network: (c.channel as "FACEBOOK" | "INSTAGRAM" | "GOOGLE"),
                    business: ov?.dealershipName ?? "Your dealership",
                    image: c.creativeImageUrl,
                    images: Array.isArray(c.creativeImages) ? c.creativeImages : [],
                    format: c.format ?? "SINGLE_IMAGE",
                    primaryText: c.primaryText ?? "",
                    headline: c.headline ?? "",
                    description: c.description ?? "",
                    cta: c.cta ?? "LEARN_MORE",
                  }} />
                </div>
              </div>
              <Card className="p-5">
                <p className="mb-3 text-[13px] font-semibold text-n900">Creative details</p>
                <div className="space-y-3 text-[13px]">
                  <div><p className="text-[11px] uppercase tracking-wide text-n500">Primary text</p><p className="mt-0.5 whitespace-pre-line text-n800">{c.primaryText || "—"}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-[11px] uppercase tracking-wide text-n500">Headline</p><p className="mt-0.5 font-medium text-n900">{c.headline || "—"}</p></div>
                    <div><p className="text-[11px] uppercase tracking-wide text-n500">Call to action</p><p className="mt-0.5 font-medium text-n900">{c.cta ? c.cta.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()) : "—"}</p></div>
                  </div>
                  <div><p className="text-[11px] uppercase tracking-wide text-n500">Description</p><p className="mt-0.5 text-n800">{c.description || "—"}</p></div>
                </div>
              </Card>
            </div>

            {/* budget breakdown */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {[["Budget", money(c.budgetCents)], ["Krakd fee (10%)", money(c.feeCents)], ["Real media spend (90%)", money(c.netSpendCents)]].map(([l, v]) => (
                <Card key={l} className="p-4"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[22px] font-semibold text-n900">{v}</p></Card>
              ))}
            </div>

            {/* attribution + real spend */}
            <Card className="p-5">
              <p className="mb-1 text-[13px] font-semibold text-n900">Attribution &amp; spend</p>
              <p className="mb-3 text-[12px] text-n500">Put this tracked link in your ad — every lead it drives is credited to this campaign automatically.</p>
              {trackUrl ? (
                <div className="flex items-center gap-2">
                  <input readOnly value={trackUrl} className="tnum h-9 flex-1 rounded-md border border-n200 bg-n50 px-3 text-[12.5px] text-n700 outline-none" />
                  <button onClick={() => { navigator.clipboard?.writeText(trackUrl); toast.success("Link copied"); }} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-n200 bg-white px-3 text-[12.5px] font-semibold text-n700 transition hover:bg-n100"><Copy className="h-3.5 w-3.5" />Copy</button>
                </div>
              ) : <p className="text-[12px] text-n400">Publish your website to get a tracked campaign link.</p>}
              <div className="mt-4 flex items-end gap-2">
                <label className="block flex-1">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-n500">Actual spend to date</span>
                  <div className="flex h-9 items-center rounded-md border border-n200 bg-white px-2.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"><span className="text-[13px] font-semibold text-n400">$</span><input value={spend} onChange={(e) => setSpend(e.target.value)} inputMode="numeric" placeholder={String(Math.round(c.spentCents / 100))} className="tnum w-full bg-transparent px-1.5 text-[13px] font-semibold text-n900 outline-none" /></div>
                </label>
                <button onClick={saveSpend} disabled={savingSpend} className="btn-brand h-9 rounded-md px-4 text-[12.5px] font-semibold disabled:opacity-60">{savingSpend ? "Saving…" : "Save spend"}</button>
              </div>
              <p className="mt-2 text-[11.5px] text-n400">Recording real spend turns on real cost-per-lead and ROAS below. Currently recorded: {money(c.spentCents)}.</p>
            </Card>

            {/* performance */}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-n900">Performance</p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[["Leads", `${an?.leadCount ?? c.leadCount}`], ["Sold", `${an?.sold ?? 0}`], ["Spent", money(c.spentCents)], ["Cost / lead", (an?.leadCount ?? 0) && c.spentCents ? money(an!.metrics.cplCents) : "—"]].map(([l, v]) => (
                  <Card key={l} className="p-4"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{v}</p></Card>
                ))}
              </div>
              {c.status === "DRAFT" && <p className="mt-2 text-[12px] text-n500">Performance starts reporting once the campaign is reviewed and goes live.</p>}
            </div>

            {/* analytics — real leads-over-time, efficiency metrics, matchback, insights */}
            {an && ((an.leadCount ?? 0) > 0 || c.spentCents > 0) && (
              <>
                <Card className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand" /><p className="text-[13px] font-semibold text-n900">Leads · last 30 days</p></div>
                    <div className="flex items-center gap-4 text-[11.5px] text-n500"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#ff5a16" }} />Leads</span></div>
                  </div>
                  <AreaChart data={an.series.map((d) => ({ label: shortDate(d.date), a: d.leads, b: 0 }))} aName="Leads" bName="" fmtA={(n) => `${n}`} fmtB={(n) => `${n}`} />
                </Card>

                <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
                  {[["CPM", c.impressions ? money(an.metrics.cpmCents) : "—"], ["CTR", c.impressions ? `${an.metrics.ctr.toFixed(2)}%` : "—"], ["CPC", c.clicks ? money(an.metrics.cpcCents) : "—"], ["Cost / lead", (an.leadCount ?? 0) && c.spentCents ? money(an.metrics.cplCents) : "—"], ["Cost / sold", an.metrics.costPerSoldCents ? money(an.metrics.costPerSoldCents) : "—"], ["ROAS", an.metrics.roas ? `${an.metrics.roas.toFixed(1)}×` : "—"]].map(([l, v]) => (
                    <Card key={l} className="p-3.5"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[17px] font-semibold text-n900">{v}</p></Card>
                  ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                  <Card className="p-5">
                    <p className="text-[13px] font-semibold text-n900">Sales matchback</p>
                    <p className="mb-4 mt-0.5 text-[12px] text-n500">Attributed lead → sold vehicle, with cost at each step.</p>
                    <FunnelChart stages={an.funnel.map((s) => ({ key: s.key, value: s.value, rate: s.rate, cost: s.value ? `${money(s.costEachCents)}/ea` : "—" }))} />
                  </Card>
                  <Card className="p-5">
                    <div className="mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-brand" /><p className="text-[13px] font-semibold text-n900">Insights</p></div>
                    <div className="space-y-2.5">
                      {an.insights.map((it, i) => (
                        <div key={i} className="flex gap-2.5">
                          <span className={`mt-0.5 inline-flex h-4 shrink-0 items-center rounded-full px-2 text-[10px] font-bold uppercase ${INSIGHT_TONE[it.tone]}`}>{it.tone}</span>
                          <div><p className="text-[12.5px] font-semibold text-n900">{it.title}</p><p className="text-[12px] leading-snug text-n500">{it.detail}</p></div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </>
            )}

            {/* targeting */}
            <Card className="p-5">
              <p className="mb-3 text-[13px] font-semibold text-n900">Targeting</p>
              <div className="grid grid-cols-2 gap-y-3 text-[13px] sm:grid-cols-4">
                <div><p className="text-[11px] uppercase tracking-wide text-n500">Radius</p><p className="mt-0.5 font-medium text-n900">{c.radiusMiles} mi</p></div>
                <div><p className="text-[11px] uppercase tracking-wide text-n500">Age</p><p className="mt-0.5 font-medium text-n900">{c.ageMin}–{c.ageMax}</p></div>
                <div><p className="text-[11px] uppercase tracking-wide text-n500">Gender</p><p className="mt-0.5 font-medium capitalize text-n900">{c.gender}</p></div>
                <div><p className="text-[11px] uppercase tracking-wide text-n500">Smart targeting</p><p className="mt-0.5 font-medium text-n900">{c.smartTargeting ? "On" : "Off"}</p></div>
              </div>
              <p className="mt-4 text-[12.5px] text-n500">{Array.isArray(c.promotedVehicleIds) && c.promotedVehicleIds.length > 0 ? `${c.promotedVehicleIds.length} vehicle${c.promotedVehicleIds.length > 1 ? "s" : ""} promoted from inventory.` : "No specific vehicles promoted — general awareness."}</p>
            </Card>

            <Link href="/dashboard/marketing/campaigns" className="inline-block text-[13px] font-semibold text-brand">← All campaigns</Link>
          </div>
        ) : null}
      </AppMain>
    </>
  );
}
