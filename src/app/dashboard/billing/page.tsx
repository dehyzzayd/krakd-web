"use client";

import Link from "next/link";
import { Topbar, AppMain } from "@/components/app/Topbar";
import { Card, ErrorBanner } from "@/components/app/AppKit";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/useApi";
import { CreditCard, Check, Clock } from "lucide-react";

type Addon = { id: string; name: string; priceCents: number; status: string; periodEnd: string; beta: boolean };
type Billing = {
  stripeConfigured: boolean;
  plan: { name: string; priceCents: number; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean };
  addons: Addon[];
};

const money = (c: number) => `$${Math.round(c / 100).toLocaleString()}`;
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null);

export default function BillingPage() {
  const { data, loading, error, reload } = useApi<Billing>("/billing");
  const plan = data?.plan;
  const addons = data?.addons ?? [];
  const addonTotal = addons.reduce((s, a) => s + a.priceCents, 0);

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
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><CreditCard className="h-5 w-5" /></span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-semibold text-n900">{plan?.name ?? "Krakd Platform + AI"}</p>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide", plan?.status === "ACTIVE" ? "bg-ok-soft text-ok" : "bg-brand-soft text-brand")}>{plan?.status === "ACTIVE" ? "Active" : "Beta"}</span>
              </div>
              <p className="mt-0.5 text-[12.5px] text-n500">AI lead handling, CRM, inventory, website, marketing & reporting — everything in one plan.</p>
            </div>
            <div className="text-right"><p className="tnum text-[20px] font-bold text-n900">{money(plan?.priceCents ?? 14900)}</p><p className="text-[11px] text-n500">/month</p></div>
          </div>
          {plan?.currentPeriodEnd && <p className="mt-3 border-t border-n100 pt-3 text-[12px] text-n500">{plan.cancelAtPeriodEnd ? `Cancels ${fmt(plan.currentPeriodEnd)}` : `Renews ${fmt(plan.currentPeriodEnd)}`}</p>}
        </Card>

        {/* add-ons */}
        <div className="mt-4">
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

        <p className="mt-4 text-[11.5px] text-n400">{data?.stripeConfigured ? "Manage your card and invoices through the billing portal." : "A billing portal (update card, download invoices, change plan) activates with payments at launch."}</p>
      </AppMain>
    </>
  );
}
