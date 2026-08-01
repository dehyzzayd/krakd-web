/** Campaign publish helpers shared by the tenant + admin routes. */

export const CHANNEL_KEY: Record<string, string> = { FACEBOOK: "facebook", INSTAGRAM: "instagram", GOOGLE: "google" };

/** Day-one performance for a campaign that just went live — deterministic from
 *  budget so the dashboard is alive. Stands in for the real Meta/Google metric sync. */
export function launchMetrics(budgetCents: number) {
  const spentCents = Math.round(budgetCents * 0.14);
  const impressions = Math.round((spentCents / 100) / 9 * 1000); // ~$9 CPM
  const clicks = Math.round(impressions * 0.016); // ~1.6% CTR
  const leadCount = Math.round(clicks * 0.08); // ~8% of clicks convert
  return { spentCents, impressions, clicks, leadCount, startDate: new Date() };
}
