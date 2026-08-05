/** Ads analytics — derived from REAL attributed leads (Lead.campaignId) and the
 *  dealer's own recorded spend. No synthetic series: leads-per-day come from
 *  actual lead timestamps; gross comes from the dealer's real sold-unit margins.
 *  Impressions/clicks stay 0 until a live ad-platform sync is wired. */

export type Day = { date: string; spendCents: number; impressions: number; clicks: number; leads: number };

/** Fallback blended gross when the dealer has no sold units yet to average. */
export const DEFAULT_AVG_GROSS_CENTS = 265000;

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Real leads-per-day bucketed from attributed lead timestamps. */
export function leadsByDay(createdAts: Date[], days = 30): Day[] {
  const today = new Date();
  const out: Day[] = [];
  const idx: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const k = iso(d); idx[k] = out.length;
    out.push({ date: k, spendCents: 0, impressions: 0, clicks: 0, leads: 0 });
  }
  for (const t of createdAts) { const k = iso(new Date(t)); if (k in idx) out[idx[k]].leads++; }
  return out;
}

const div = (a: number, b: number) => (b ? a / b : 0);

export type Metrics = { cpmCents: number; ctr: number; cpcCents: number; cplCents: number; costPerSoldCents: number; roas: number; grossCents: number };

/** avgGrossCents = the dealer's real average front gross per sold unit. */
export function deriveMetrics(a: { spendCents: number; impressions: number; clicks: number; leads: number; sold: number }, avgGrossCents: number): Metrics {
  const grossCents = a.sold * avgGrossCents;
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

/** Funnel from real attributed leads. Impressions/clicks show only if a real
 *  source populated them; leads/appts/sold are always real. */
export type FunnelStage = { key: string; value: number; rate: number | null; costEachCents: number };
export function funnel(a: { spendCents: number; impressions: number; clicks: number; leads: number; appts: number; sold: number }): FunnelStage[] {
  const raw: [string, number][] = [["Impressions", a.impressions], ["Clicks", a.clicks], ["Leads", a.leads], ["Appointments", a.appts], ["Sold", a.sold]];
  // drop impression/click stages when we have no real delivery data, so the funnel starts at Leads
  const stages = a.impressions === 0 && a.clicks === 0 ? raw.slice(2) : raw;
  return stages.map(([key, value], i) => ({ key, value, rate: i === 0 ? null : div(value, stages[i - 1][1]) * 100, costEachCents: div(a.spendCents, value) }));
}

type CampaignLike = { id: string; status: string; startDate: Date | null; leadCount: number; impressions: number; channel?: string };

export type Insight = { tone: "ok" | "warn" | "info" | "brand"; title: string; detail: string };
export function insights(c: CampaignLike, m: Metrics, ctx: { avgCplCents: number; sold: number }): Insight[] {
  const out: Insight[] = [];
  const daysLive = c.startDate ? Math.round((Date.now() - new Date(c.startDate).getTime()) / 86400000) : 0;
  if (c.status === "ACTIVE" && daysLive < 7 && c.leadCount < 15) out.push({ tone: "info", title: "Learning phase", detail: `Only ${daysLive}d live — give it a few more days of data before judging performance.` });
  if (ctx.avgCplCents && m.cplCents > ctx.avgCplCents * 1.4 && c.leadCount > 5) out.push({ tone: "warn", title: "Cost per lead is high", detail: `CPL is ${Math.round((m.cplCents / ctx.avgCplCents - 1) * 100)}% above your account average.` });
  if (m.roas >= 3 && c.status === "ACTIVE") out.push({ tone: "ok", title: "Strong return", detail: `Roughly ${m.roas.toFixed(1)}× return on the spend you recorded. This campaign can take more budget.` });
  if (ctx.sold > 0) out.push({ tone: "brand", title: `${ctx.sold} sale${ctx.sold > 1 ? "s" : ""} attributed`, detail: m.costPerSoldCents ? `$${Math.round(m.costPerSoldCents / 100).toLocaleString()} cost per sold unit from this campaign.` : `${ctx.sold} sold from leads this campaign drove.` });
  if (c.status === "PAUSED") out.push({ tone: "info", title: "Paused", detail: "This campaign isn't delivering. Resume it to keep leads coming in." });
  if (!m.cplCents && c.leadCount > 0) out.push({ tone: "info", title: "Add your spend to see ROI", detail: "This campaign has attributed leads — record what you actually spent to get real cost-per-lead and ROAS." });
  if (!out.length) out.push({ tone: "ok", title: "No issues detected", detail: "Performance is within your normal range." });
  return out;
}
