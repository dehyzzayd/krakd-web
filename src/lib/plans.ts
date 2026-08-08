/** Platform subscription tiers. Shared by the billing UI and the server. The Stripe
 *  price id for each is resolved server-side from env (STRIPE_PRICE_<ID>) via
 *  priceIdForTarget() in lib/server/stripe.ts — never shipped to the client. */

export type PlanId = "starter" | "growth";

export type PlanDef = {
  id: PlanId;
  name: string;
  priceCents: number;
  tagline: string;
  features: string[];
};

export const PLANS: PlanDef[] = [
  {
    id: "starter",
    name: "Starter",
    priceCents: 14900,
    tagline: "Everything a single location needs to sell.",
    features: ["AI lead handling", "CRM & inventory", "Dealer website", "Marketing & reporting"],
  },
  {
    id: "growth",
    name: "Growth",
    priceCents: 34900,
    tagline: "For high-volume teams that need more room.",
    features: ["Everything in Starter", "Higher usage limits", "Priority support", "Advanced reporting"],
  },
];

export const PLAN_IDS = PLANS.map((p) => p.id);

export const isPlanId = (v: string): v is PlanId => (PLAN_IDS as string[]).includes(v);

export const planById = (id: string): PlanDef | undefined => PLANS.find((p) => p.id === id);

/** Map a subscription's stored priceCents back to a plan (tiers have distinct prices). */
export const planByPriceCents = (cents: number): PlanDef | undefined => PLANS.find((p) => p.priceCents === cents);
