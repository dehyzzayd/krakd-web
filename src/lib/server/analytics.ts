/** Ads analytics — deterministic daily time-series + derived metrics + insights.
 *  Series are seeded from the campaign id so they are STABLE across requests
 *  (no random drift). This stands in for a real Meta/Google metric-sync job;
 *  swap the series source here when the live API is wired. */

type CampaignLike = {
  id: string; status: string; startDate: Date | null; budgetCents: number;
  spentCents: number; impressions: number; clicks: number; leadCount: number;
};

export type Day = { date: string; spendCents: number; impressions: number; clicks: number; leads: number };

const AVG_GROSS_CENTS = 265000; // blended front+back gross per used unit — value side of ROI

function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Distribute a campaign's lifetime totals across the last `days` days with weekly
 *  seasonality + deterministic jitter, so trend charts look real and stay stable. */
export function dailySeries(c: CampaignLike, days = 30): Day[] {
  const today = new Date();
  const out: Day[] = [];
  for (let i = days - 1; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); out.push({ date: iso(d), spendCents: 0, impressions: 0, clicks: 0, leads: 0 }); }
  if (c.status === "DRAFT" || c.status === "PENDING_REVIEW" || c.status === "REJECTED" || !c.startDate) return out;

  const rnd = mulberry32(hashStr(c.id));
  // how many of the trailing days the campaign has actually been live
  const liveDays = Math.max(1, Math.min(days, Math.round((today.getTime() - new Date(c.startDate).getTime()) / 86400000) + 1));
  const startIdx = days - liveDays;
  const weights: number[] = [];
  let sum = 0;
  for (let i = 0; i < days; i++) {
    if (i < startIdx) { weights.push(0); continue; }
    const dow = new Date(out[i].date).getUTCDay();
    const season = dow === 0 || dow === 6 ? 0.75 : 1.05; // auto shoppers skew weekday
    const w = season * (0.65 + rnd() * 0.7);
    weights.push(w); sum += w;
  }
  if (sum === 0) return out;
  for (let i = 0; i < days; i++) {
    const f = weights[i] / sum;
    out[i].spendCents = Math.round(c.spentCents * f);
    out[i].impressions = Math.round(c.impressions * f);
    out[i].clicks = Math.round(c.clicks * f);
    out[i].leads = Math.round(c.leadCount * f);
  }
  return out;
}

export function mergeSeries(all: Day[][], days = 30): Day[] {
  const base = dailySeries({ id: "empty", status: "DRAFT", startDate: null, budgetCents: 0, spentCents: 0, impressions: 0, clicks: 0, leadCount: 0 }, days);
  for (const s of all) s.forEach((d, i) => { base[i].spendCents += d.spendCents; base[i].impressions += d.impressions; base[i].clicks += d.clicks; base[i].leads += d.leads; });
  return base;
}

const div = (a: number, b: number) => (b ? a / b : 0);

export type Metrics = { cpmCents: number; ctr: number; cpcCents: number; cplCents: number; costPerSoldCents: number; roas: number; grossCents: number };
export function deriveMetrics(a: { spendCents: number; impressions: number; clicks: number; leads: number; sold: number }): Metrics {
  const grossCents = a.sold * AVG_GROSS_CENTS;
  return {
    cpmCents: div(a.spendCents, a.impressions) * 1000,
    ctr: div(a.clicks, a.impressions) * 100,
    cpcCents: div(a.spendCents, a.clicks),
    cplCents: div(a.spendCents, a.leads),
    costPerSoldCents: div(a.spendCents, a.sold),
    roas: div(grossCents, a.spendCents),
    grossCents,
  };
}

/** Funnel stages with drop-off rate + cost-at-stage. `sold`/`appts` come from
 *  real attributed leads (Lead.status), the rest from delivery counts. */
export type FunnelStage = { key: string; value: number; rate: number | null; costEachCents: number };
export function funnel(a: { spendCents: number; impressions: number; clicks: number; leads: number; appts: number; sold: number }): FunnelStage[] {
  const stages: [string, number][] = [["Impressions", a.impressions], ["Clicks", a.clicks], ["Leads", a.leads], ["Appointments", a.appts], ["Sold", a.sold]];
  return stages.map(([key, value], i) => ({ key, value, rate: i === 0 ? null : div(value, stages[i - 1][1]) * 100, costEachCents: div(a.spendCents, value) }));
}

export type Insight = { tone: "ok" | "warn" | "info" | "brand"; title: string; detail: string };
export function insights(c: CampaignLike & { channel?: string }, m: Metrics, ctx: { avgCplCents: number; sold: number; apptRate?: number }): Insight[] {
  const out: Insight[] = [];
  const daysLive = c.startDate ? Math.round((Date.now() - new Date(c.startDate).getTime()) / 86400000) : 0;
  if (c.status === "ACTIVE" && daysLive < 7 && c.leadCount < 15) out.push({ tone: "info", title: "Learning phase", detail: `Only ${daysLive}d live — delivery is still optimizing. Give it a few more days before changing the budget or creative.` });
  if (ctx.avgCplCents && m.cplCents > ctx.avgCplCents * 1.4 && c.leadCount > 5) out.push({ tone: "warn", title: "Cost per lead is high", detail: `CPL is ${Math.round((m.cplCents / ctx.avgCplCents - 1) * 100)}% above your account average. Try refreshing the creative or widening the audience.` });
  if (c.impressions > 5000 && m.ctr < 0.8) out.push({ tone: "warn", title: "Low click-through", detail: `CTR of ${m.ctr.toFixed(2)}% is under benchmark — the creative may not be resonating. Test a new image or headline.` });
  if (m.roas >= 3 && c.status === "ACTIVE") out.push({ tone: "ok", title: "Strong return", detail: `Roughly ${m.roas.toFixed(1)}× return on spend. This campaign can take more budget.` });
  if (ctx.sold > 0) out.push({ tone: "brand", title: `${ctx.sold} sale${ctx.sold > 1 ? "s" : ""} attributed`, detail: `$${Math.round(m.costPerSoldCents / 100).toLocaleString()} cost per sold vehicle from this campaign.` });
  if (c.status === "PAUSED") out.push({ tone: "info", title: "Paused", detail: "This campaign isn't delivering. Resume it to keep leads coming in." });
  if (!out.length) out.push({ tone: "ok", title: "Delivering normally", detail: "No issues detected — performance is within your normal range." });
  return out;
}
