/** Deal desk math — a simple, honest four-square worksheet. All money in cents. */

export type TradeVehicle = { year?: string; make?: string; model?: string; mileage?: string };
export type Deal = {
  sellPriceCents?: number;
  tradeValueCents?: number;   // appraised allowance for their trade
  tradePayoffCents?: number;  // what they still owe on it
  downCents?: number;
  taxRatePct?: number;
  termMonths?: number;
  aprPct?: number;
  trade?: TradeVehicle;
};

export type DealComputed = { taxCents: number; tradeEquityCents: number; financedCents: number; monthlyCents: number };

export function computeDeal(d: Deal): DealComputed {
  const price = d.sellPriceCents ?? 0;
  const tradeValue = Math.max(0, d.tradeValueCents ?? 0);
  const payoff = Math.max(0, d.tradePayoffCents ?? 0);
  const tradeEquity = tradeValue - payoff; // negative = upside-down, rolls into the loan
  const down = Math.max(0, d.downCents ?? 0);

  // most states tax price minus trade allowance
  const taxable = Math.max(0, price - tradeValue);
  const taxCents = Math.round((taxable * (d.taxRatePct ?? 0)) / 100);

  const financedCents = Math.max(0, price + taxCents - down - tradeEquity);

  const n = Math.max(0, Math.round(d.termMonths ?? 0));
  const r = (d.aprPct ?? 0) / 100 / 12;
  let monthlyCents = 0;
  if (n > 0) monthlyCents = r > 0 ? Math.round((financedCents * r) / (1 - Math.pow(1 + r, -n))) : Math.round(financedCents / n);

  return { taxCents, tradeEquityCents: tradeEquity, financedCents, monthlyCents };
}
