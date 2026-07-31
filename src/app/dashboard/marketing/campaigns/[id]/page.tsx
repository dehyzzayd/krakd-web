"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card } from "@/components/app/AppKit";
import { useApi } from "@/lib/useApi";
import { apiFetch } from "@/lib/api";
import { AdPreview } from "@/components/app/AdPreview";

type Campaign = {
  id: string; name: string; channel: string; objective: string; status: string;
  budgetCents: number; feeCents: number; netSpendCents: number; spentCents: number;
  impressions: number; clicks: number; leadCount: number;
  radiusMiles: number; ageMin: number; ageMax: number; gender: string; smartTargeting: boolean;
  frequency: string; promotedVehicleIds: string[];
  primaryText: string | null; headline: string | null; description: string | null; cta: string | null; creativeImageUrl: string | null;
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
  const { data: ov } = useApi<{ dealershipName?: string }>("/overview");
  const [busy, setBusy] = useState(false);

  const patch = async (status: string) => {
    setBusy(true);
    try { await apiFetch(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); reload(); }
    finally { setBusy(false); }
  };

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

            {/* ad creative */}
            <div className="grid gap-3 lg:grid-cols-[minmax(0,340px)_1fr]">
              <div>
                <p className="mb-2 text-[13px] font-semibold text-n900">Ad creative</p>
                <div className="rounded-xl bg-n100/70 p-4">
                  <AdPreview creative={{
                    network: (c.channel as "FACEBOOK" | "INSTAGRAM" | "GOOGLE"),
                    business: ov?.dealershipName ?? "Your dealership",
                    image: c.creativeImageUrl,
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

            {/* performance */}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-n900">Performance</p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[["Impressions", c.impressions.toLocaleString()], ["Clicks", c.clicks.toLocaleString()], ["Leads", `${c.leadCount}`], ["Spent", money(c.spentCents)]].map(([l, v]) => (
                  <Card key={l} className="p-4"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-n500">{l}</p><p className="tnum mt-1.5 text-[20px] font-semibold text-n900">{v}</p></Card>
                ))}
              </div>
              {c.status === "DRAFT" && <p className="mt-2 text-[12px] text-n500">Performance starts reporting once the campaign is reviewed and goes live.</p>}
            </div>

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
