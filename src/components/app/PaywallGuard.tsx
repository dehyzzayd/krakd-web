"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Logo } from "@/components/layout/Logo";
import { Check, Lock } from "lucide-react";

type PlanDef = { id: string; name: string; priceCents: number; tagline: string; features: string[] };
type Gate = { gated: boolean; status: string; role: string; plans: PlanDef[] };

const money = (c: number) => `$${Math.round(c / 100).toLocaleString()}`;

/* Wraps the dashboard. If the account hasn't paid (INACTIVE / CANCELED under live
 * billing), it blocks the app with a full-screen "complete your subscription" screen
 * whose Subscribe buttons go straight to Stripe Checkout. Krakd staff and beta mode
 * are never gated. Fails open — if the check errors, the dashboard still renders. */
export function PaywallGuard({ children }: { children: React.ReactNode }) {
  const [gate, setGate] = useState<Gate | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch<Gate>("/account/gate")
      .then((g) => { if (alive) setGate(g); })
      .catch(() => { if (alive) setGate(null); }) // fail open
      .finally(() => { if (alive) setChecked(true); });
    return () => { alive = false; };
  }, []);

  const subscribe = async (planId: string) => {
    setBusy(planId);
    try {
      const { url } = await apiFetch<{ url?: string }>("/billing/checkout", { method: "POST", body: JSON.stringify({ plan: planId }) });
      if (url) { window.location.href = url; return; }
    } catch { /* leave as-is */ }
    setBusy(null);
  };

  // Until the check resolves, render the app (avoids a flash-then-lock for paying users).
  if (!checked || !gate?.gated) return <>{children}</>;

  const plans = gate.plans ?? [];
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white">
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center px-5 py-14">
        <Logo className="mb-8 text-[22px]" />
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand"><Lock className="h-3 w-3" /> Subscription required</span>
        <h1 className="mt-4 text-[28px] font-bold tracking-[-0.02em] text-n900">Activate your account</h1>
        <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-n500">
          {gate.status === "CANCELED" ? "Your subscription was canceled." : "Your account isn't active yet."} Choose a plan to unlock your dashboard — AI lead handling, CRM, inventory, website and marketing.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-n200 p-5">
              <p className="text-[16px] font-semibold text-n900">{p.name}</p>
              <p className="mt-1"><span className="tnum text-[24px] font-bold text-n900">{money(p.priceCents)}</span><span className="text-[12px] text-n500">/month</span></p>
              <p className="mt-1 text-[12.5px] text-n500">{p.tagline}</p>
              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (<li key={f} className="flex items-start gap-2 text-[12.5px] text-n700"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />{f}</li>))}
              </ul>
              <button onClick={() => subscribe(p.id)} disabled={!!busy} className="mt-4 w-full rounded-lg bg-brand px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60">
                {busy === p.id ? "Redirecting…" : `Subscribe to ${p.name}`}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[12px] text-n400">Secure payment via Stripe. Cancel anytime.</p>
      </div>
    </div>
  );
}
