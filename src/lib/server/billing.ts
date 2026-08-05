/** Billing boundary — Stripe-gated. Everything here works in "beta" mode with no
 *  charge until STRIPE_SECRET_KEY (+ price IDs + webhook secret) are set, then the
 *  same flows create real Stripe subscriptions. Mirrors the Twilio/R2/Resend gating
 *  pattern so launch is a config change, not a rewrite. */

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

const MONTH_MS = 30 * 86_400_000;

export type IntegrationSubStatus = "active" | "scheduled_cancel" | "expired";
export type IntegrationSub = {
  status: IntegrationSubStatus;
  priceCents: number;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  beta: boolean;                 // true = activated free during beta (billing starts at launch)
  stripeSubscriptionId?: string;
};

/** Lazily resolve a scheduled cancellation whose period has ended to "expired". */
export function effectiveSub(sub?: IntegrationSub | null): IntegrationSub | null {
  if (!sub) return null;
  if (sub.status === "scheduled_cancel" && new Date(sub.periodEnd).getTime() < Date.now()) {
    return { ...sub, status: "expired" };
  }
  return sub;
}

export function isSubActive(sub?: IntegrationSub | null): boolean {
  const s = effectiveSub(sub);
  return !!s && (s.status === "active" || s.status === "scheduled_cancel");
}

export function startSub(priceCents: number): IntegrationSub {
  const now = new Date();
  return {
    status: "active", priceCents,
    periodStart: now.toISOString(), periodEnd: new Date(now.getTime() + MONTH_MS).toISOString(),
    cancelAtPeriodEnd: false, beta: !stripeConfigured(),
  };
}

/** Cancel at period end — keep access until periodEnd, no further billing. */
export function cancelSub(sub: IntegrationSub): IntegrationSub {
  return { ...sub, status: "scheduled_cancel", cancelAtPeriodEnd: true };
}

/** Undo a scheduled cancellation while still inside the paid period. */
export function reactivateSub(sub: IntegrationSub): IntegrationSub {
  return { ...sub, status: "active", cancelAtPeriodEnd: false };
}
