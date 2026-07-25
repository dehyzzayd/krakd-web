/** Marketing domain model — grounded in how Meta & Google ads actually work
 *  and how auto dealers measure them (lead → appt → shown → sold, matchback,
 *  cost-per-sold-vehicle). All ratios/costs are DERIVED from raw counts so the
 *  numbers are always internally consistent. */

export type Freq = "one-time" | "weekly" | "monthly";
export type NetId = "facebook" | "instagram" | "google";
export type Objective = "sales" | "leads" | "traffic" | "calls";
export type Delivery = "active" | "learning" | "learning_limited" | "paused" | "review";

export const OBJECTIVE_LABEL: Record<Objective, string> = { sales: "Sales", leads: "Leads", traffic: "Traffic", calls: "Calls" };
export const DELIVERY_LABEL: Record<Delivery, string> = {
  active: "Active", learning: "Learning", learning_limited: "Learning limited", paused: "Paused", review: "In review",
};
export const DELIVERY_TONE: Record<Delivery, "ok" | "brand" | "warn" | "neutral"> = {
  active: "ok", learning: "brand", learning_limited: "warn", paused: "neutral", review: "neutral",
};

/** Blended front+back gross per used unit — the value side of ROI. */
export const AVG_GROSS = 2650;
/** How far through the month we are (for pacing math). */
const MONTH_ELAPSED = 0.8;
/** Total store deliveries this month (from the DMS) — the matchback denominator. */
export const STORE_UNITS_SOLD = 28;

type AdSet = {
  name: string;
  audience: string;
  placements: string;
  delivery: Delivery;
  learning?: { events: number; threshold: number };
  spend: number; leads: number; sold: number;
};

type Raw = {
  id: string; network: NetId; name: string; objective: Objective; delivery: Delivery;
  budget: number; freq: Freq; // monthly budget for pacing
  spend: number; impressions: number; reach: number; clicks: number;
  vdpViews: number; leads: number; apptsSet: number; apptsShown: number; sold: number;
  adsets: AdSet[];
};

const div = (a: number, b: number) => (b ? a / b : 0);

export type Campaign = Raw & {
  cpm: number; frequency: number; ctr: number; cpc: number; costPerVdp: number;
  cpl: number; costPerSold: number; roas: number; gross: number; pacePct: number;
};

function build(r: Raw): Campaign {
  const gross = r.sold * AVG_GROSS;
  return {
    ...r,
    cpm: div(r.spend, r.impressions) * 1000,
    frequency: div(r.impressions, r.reach),
    ctr: div(r.clicks, r.impressions) * 100,
    cpc: div(r.spend, r.clicks),
    costPerVdp: div(r.spend, r.vdpViews),
    cpl: div(r.spend, r.leads),
    costPerSold: div(r.spend, r.sold),
    roas: div(gross, r.spend),
    gross,
    pacePct: div(r.spend, r.budget * MONTH_ELAPSED) * 100,
  };
}

const RAW: Raw[] = [
  {
    id: "fb-certified-trucks", network: "facebook", name: "Certified Trucks — spring", objective: "sales", delivery: "active",
    budget: 1500, freq: "monthly", spend: 1180, impressions: 198000, reach: 92000, clicks: 3350, vdpViews: 2050, leads: 44, apptsSet: 20, apptsShown: 11, sold: 4,
    adsets: [
      { name: "Truck intenders · 25mi", audience: "Truck intenders, 25–65, 25 mi", placements: "Feed, Reels, Marketplace", delivery: "active", spend: 720, leads: 27, sold: 3 },
      { name: "Lookalike — past buyers", audience: "1% LAL of 1,240 buyers", placements: "Advantage+ placements", delivery: "active", spend: 460, leads: 17, sold: 1 },
    ],
  },
  {
    id: "fb-retarget", network: "facebook", name: "Retargeting — VDP visitors", objective: "sales", delivery: "active",
    budget: 600, freq: "monthly", spend: 410, impressions: 62000, reach: 21000, clicks: 980, vdpViews: 720, leads: 21, apptsSet: 11, apptsShown: 7, sold: 3,
    adsets: [{ name: "Site & VDP viewers · 30d", audience: "Pixel: VDP viewers, 30 days", placements: "Feed, Stories", delivery: "active", spend: 410, leads: 21, sold: 3 }],
  },
  {
    id: "fb-tradein", network: "facebook", name: "Trade-in leads", objective: "leads", delivery: "learning",
    budget: 500, freq: "monthly", spend: 240, impressions: 41000, reach: 24000, clicks: 520, vdpViews: 150, leads: 12, apptsSet: 4, apptsShown: 2, sold: 1,
    adsets: [{ name: "Instant form — trade value", audience: "In-market, 25 mi, 25–60", placements: "Feed, Marketplace", delivery: "learning", learning: { events: 12, threshold: 50 }, spend: 240, leads: 12, sold: 1 }],
  },
  {
    id: "gg-search-suv", network: "google", name: "Search — Used SUVs", objective: "leads", delivery: "active",
    budget: 900, freq: "monthly", spend: 610, impressions: 3100, reach: 2600, clicks: 245, vdpViews: 180, leads: 27, apptsSet: 13, apptsShown: 8, sold: 3,
    adsets: [{ name: "Used SUV — exact/phrase", audience: "Keywords: used suv near me…", placements: "Google Search", delivery: "active", spend: 610, leads: 27, sold: 3 }],
  },
  {
    id: "gg-vla", network: "google", name: "Vehicle Ads — full inventory", objective: "sales", delivery: "active",
    budget: 500, freq: "monthly", spend: 290, impressions: 84000, reach: 38000, clicks: 760, vdpViews: 690, leads: 17, apptsSet: 8, apptsShown: 5, sold: 2,
    adsets: [{ name: "VIN feed · all units", audience: "Vehicle feed, 214 VINs", placements: "Search, PMax", delivery: "active", spend: 290, leads: 17, sold: 2 }],
  },
  {
    id: "gg-pmax", network: "google", name: "PMax — aged inventory", objective: "sales", delivery: "learning_limited",
    budget: 500, freq: "monthly", spend: 190, impressions: 46000, reach: 22000, clicks: 410, vdpViews: 260, leads: 8, apptsSet: 3, apptsShown: 1, sold: 1,
    adsets: [{ name: "Asset group — 45d+ units", audience: "Vehicle feed, aging VINs", placements: "All Google networks", delivery: "learning_limited", learning: { events: 8, threshold: 50 }, spend: 190, leads: 8, sold: 1 }],
  },
];

export const CAMPAIGNS: Campaign[] = RAW.map(build);

/* ── networks (connection state only; metrics derived from campaigns) ── */
export type Network = { id: NetId; name: string; logo: string; connected: boolean };
export const NETWORKS: Network[] = [
  { id: "facebook", name: "Facebook", logo: "/logos/facebook.svg", connected: true },
  { id: "instagram", name: "Instagram", logo: "/logos/instagram.svg", connected: false },
  { id: "google", name: "Google", logo: "/logos/google.svg", connected: true },
];

export const netById = (id: string) => NETWORKS.find((n) => n.id === id);
export const connectedNetworks = () => NETWORKS.filter((n) => n.connected);
export const disconnectedNetworks = () => NETWORKS.filter((n) => !n.connected);
export const campaignsFor = (id: string) => CAMPAIGNS.filter((c) => c.network === id);
export const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

type Roll = {
  spend: number; impressions: number; reach: number; clicks: number; vdpViews: number;
  leads: number; apptsSet: number; apptsShown: number; sold: number; budget: number; gross: number;
  cpl: number; costPerSold: number; costPerVdp: number; cpc: number; ctr: number; cpm: number; roas: number; pacePct: number;
};

function roll(list: Campaign[]): Roll {
  const s = list.reduce((a, c) => ({
    spend: a.spend + c.spend, impressions: a.impressions + c.impressions, reach: a.reach + c.reach,
    clicks: a.clicks + c.clicks, vdpViews: a.vdpViews + c.vdpViews, leads: a.leads + c.leads,
    apptsSet: a.apptsSet + c.apptsSet, apptsShown: a.apptsShown + c.apptsShown, sold: a.sold + c.sold,
    budget: a.budget + c.budget, gross: a.gross + c.gross,
  }), { spend: 0, impressions: 0, reach: 0, clicks: 0, vdpViews: 0, leads: 0, apptsSet: 0, apptsShown: 0, sold: 0, budget: 0, gross: 0 });
  return {
    ...s,
    cpl: div(s.spend, s.leads), costPerSold: div(s.spend, s.sold), costPerVdp: div(s.spend, s.vdpViews),
    cpc: div(s.spend, s.clicks), ctr: div(s.clicks, s.impressions) * 100, cpm: div(s.spend, s.impressions) * 1000,
    roas: div(s.gross, s.spend), pacePct: div(s.spend, s.budget * MONTH_ELAPSED) * 100,
  };
}

export const networkMetrics = (id: string) => roll(campaignsFor(id));
export const aggregate = () => roll(connectedNetworks().flatMap((n) => campaignsFor(n.id)));

/* ── dealer funnel (impressions → VDP → lead → appt → shown → sold) ── */
export type FunnelStage = { key: string; value: number; rate: number | null; costEach: number };
export function funnel(): FunnelStage[] {
  const a = aggregate();
  const stages: [string, number][] = [
    ["Impressions", a.impressions],
    ["VDP views", a.vdpViews],
    ["Leads", a.leads],
    ["Appointments set", a.apptsSet],
    ["Shown up", a.apptsShown],
    ["Sold", a.sold],
  ];
  return stages.map(([key, value], i) => ({
    key,
    value,
    rate: i === 0 ? null : div(value, stages[i - 1][1]) * 100,
    costEach: div(a.spend, value),
  }));
}

/* ── sales matchback / attribution ── */
export function attribution() {
  const a = aggregate();
  const matched = a.sold;
  const unmatched = Math.max(0, STORE_UNITS_SOLD - matched);
  return {
    spend: a.spend,
    matched,
    storeSold: STORE_UNITS_SOLD,
    unmatched,
    matchedRate: div(matched, STORE_UNITS_SOLD) * 100,
    costPerSold: div(a.spend, matched),
    gross: matched * AVG_GROSS,
    roi: div(matched * AVG_GROSS, a.spend),
  };
}
