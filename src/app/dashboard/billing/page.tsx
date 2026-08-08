"use client";

import Link from "next/link";
import { useState } from "react";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, ErrorBanner } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/useApi";
import { apiFetch } from "@/lib/api";
import { CreditCard, Check, Clock } from "lucide-react";

type PlanDef = { id: string; name: string; priceCents: number; tagline: string; features: string[] };
type Addon = { id: string; name: string; priceCents: number; status: string; periodEnd: string; beta: boolean };
type Billing = {
  stripeConfigured: boolean;
  plan: { name: string; currentPlan: string | null; priceCents: number; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean };
  plans: PlanDef[];
  addons: Addon[];
};

const money = (c: number) => `$${Math.round(c / 100).toLocaleString()}`;
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null);

export default function BillingPage() {
  const { data, loading, error, reload } = useApi<Billing>("/billing");
  const plan = data?.plan;
  const plans = data?.plans ?? [];
  const addons = data?.addons ?? [];
  const addonTotal = addons.reduce((s, a) => s + a.priceCents, 0);

  const currentPlan = plan?.currentPlan ?? null; // set only once they hold a Stripe subscription
  const hasLiveSub = !!currentPlan;

  const [busy, setBusy] = useState<string | null>(null);

  // Subscribe to / switch to a plan. Checkout returns { url } for new subs (redirect)
  // or { updated } when switching an existing sub in place (just refresh).
  const choosePlan = async (planId: string) => {
    setBusy(planId);
    try {
      const res = await apiFetch<{ url?: string; updated?: boolean }>("/billing/checkout", { method: "POST", body: JSON.stringify({ plan: planId }) });
      if (res.url) { window.location.href = res.url; return; }
      reload();
    } catch { /* leave UI as-is */ }
    setBusy(null);
  };

  const openPortal = async () => {
    setBusy("portal");
    try {
      const { url } = await apiFetch<{ url: string }>("/billing/portal", { method: "POST" });
      if (url) { window.location.href = url; return; }
    } catch { /* noop */ }
    setBusy(null);
  };

  const statusLabel = plan ? plan.status.replace("_", " ").toLowerCase() : "inactive";

  return (
    <>
      <Topbar title="Billing" />
      <AppMain>
        {error && <ErrorBanner onRetry={reload} />}
        <div className="mb-5"><h1 className="text-[20px] font-bold text-n900">Billing</h1><p className="mt-0.5 text-[12px] text-n500">Your Krakd plan and add-ons.</p></div>

        {!data?.stripeConfigured && (
          <div className="mb-4 rounded-lg border border-brand/20 bg-brand-soft/30 px-3.5 py-2.5 text-[12px] leading-relaxed text-n600">
            <b className="text-n800">Beta access — no card charged.</b> Everything below is active free during beta. Card billing begins at launch; you&apos;ll be notified first and can cancel anytime.
          </div>
        )}

        {/* platform plan */}
        {!data?.stripeConfigured ? (
          /* Beta: single-plan summary, no card actions */
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><CreditCard className="h-5 w-5" /></span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-semibold text-n900">{plan?.name ?? "Krakd Platform + AI"}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand">Beta</span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-n500">AI lead handling, CRM, inventory, website, marketing & reporting.</p>
              </div>
              <div className="text-right"><p className="tnum text-[20px] font-bold text-n900">{money(plan?.priceCents ?? 14900)}</p><p className="text-[11px] text-n500">/month</p></div>
            </div>
          </Card>
        ) : (
          /* Live: plan picker */
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-n900">{hasLiveSub ? "Your plan" : "Choose a plan"}</h2>
              {hasLiveSub && <button onClick={openPortal} disabled={!!busy} className="text-[12.5px] font-semibold text-brand hover:underline disabled:opacity-60">{busy === "portal" ? "Opening…" : "Manage billing"}</button>}
            </div>

            {plan?.status === "PAST_DUE" && (
              <div className="mb-3 rounded-lg border border-warn/30 bg-warn-soft/40 px-3.5 py-2.5 text-[12px] text-warn">Your last payment failed — update your card via <button onClick={openPortal} className="font-semibold underline">Manage billing</button>.</div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((p) => {
                const isCurrent = currentPlan === p.id;
                const label = isCurrent ? (plan!.cancelAtPeriodEnd ? "Resume in portal" : "Current plan") : hasLiveSub ? `Switch to ${p.name}` : "Subscribe";
                return (
                  <Card key={p.id} className={cn("p-5", isCurrent && "ring-2 ring-brand")}>
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-semibold text-n900">{p.name}</p>
                      {isCurrent && <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide", plan!.status === "ACTIVE" ? "bg-ok-soft text-ok" : plan!.status === "PAST_DUE" ? "bg-warn-soft text-warn" : "bg-brand-soft text-brand")}>{statusLabel}</span>}
                    </div>
                    <p className="mt-1"><span className="tnum text-[22px] font-bold text-n900">{money(p.priceCents)}</span><span className="text-[11px] text-n500">/month</span></p>
                    <p className="mt-1 text-[12px] text-n500">{p.tagline}</p>
                    <ul className="mt-3 space-y-1.5">
                      {p.features.map((f) => (<li key={f} className="flex items-start gap-2 text-[12.5px] text-n700"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />{f}</li>))}
                    </ul>
                    <button
                      onClick={() => (isCurrent ? openPortal() : choosePlan(p.id))}
                      disabled={!!busy || (isCurrent && !plan!.cancelAtPeriodEnd)}
                      className={cn("mt-4 w-full rounded-lg px-3.5 py-2 text-[12.5px] font-semibold disabled:opacity-60",
                        isCurrent && !plan!.cancelAtPeriodEnd ? "cursor-default border border-n200 bg-n50 text-n500" : "bg-brand text-white hover:bg-brand/90")}
                    >{busy === p.id ? "Redirecting…" : label}</button>
                  </Card>
                );
              })}
            </div>

            {plan?.currentPeriodEnd && hasLiveSub && (
              <p className="mt-3 text-[12px] text-n500">{plan.cancelAtPeriodEnd ? `Access ends ${fmt(plan.currentPeriodEnd)}` : `Renews ${fmt(plan.currentPeriodEnd)}`}</p>
            )}
          </>
        )}

        {/* add-ons */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-[13px] font-semibold text-n900">Add-ons</h2><Link href="/dashboard/integrations" className="text-[12.5px] font-semibold text-brand hover:underline">Browse integrations</Link></div>
          <Card>
            {loading ? <div className="p-8 text-center text-[13px] text-n400">Loading…</div>
            : addons.length === 0 ? <div className="px-4 py-10 text-center"><p className="text-[13px] font-semibold text-n800">No paid add-ons</p><p className="mx-auto mt-1 max-w-[40ch] text-[12px] text-n500">Premium integrations (RouteOne, KBB, J.D. Power) show up here when you subscribe.</p></div>
            : (
              <div>
                {addons.map((a, i) => (
                  <div key={a.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-n100")}>
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", a.status === "scheduled_cancel" ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok")}>{a.status === "scheduled_cancel" ? <Clock className="h-4 w-4" /> : <Check className="h-4 w-4" />}</span>
                    <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-n900">{a.name}</p><p className="text-[11.5px] text-n500">{a.status === "scheduled_cancel" ? `Cancels ${fmt(a.periodEnd)}` : `Renews ${fmt(a.periodEnd)}`}{a.beta ? " · free during beta" : ""}</p></div>
                    <span className="tnum text-[13px] font-semibold text-n900">{money(a.priceCents)}/mo</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-n200 px-4 py-3"><span className="text-[12.5px] font-semibold text-n700">Add-ons total</span><span className="tnum text-[13px] font-bold text-n900">{money(addonTotal)}/mo</span></div>
              </div>
            )}
          </Card>
        </div>

        <p className="mt-4 text-[11.5px] text-n400">{data?.stripeConfigured ? "Update your card, download invoices, or cancel anytime through Manage billing." : "A billing portal (update card, download invoices, change plan) activates with payments at launch."}</p>
      </AppMain>
    </>
  );
}
