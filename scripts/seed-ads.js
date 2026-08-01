/* Seeds a realistic Digital Marketing state for the automotive demo dealer
 * (Dehy Auto Sales): connects Facebook + Google, and creates live/paused/draft
 * campaigns with believable performance so the whole marketing section is alive. */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const DEALER = "Dehy Auto Sales";

const CAMPAIGNS = [
  { name: "Certified Trucks — Spring", channel: "FACEBOOK", format: "CAROUSEL", objective: "LEADS", status: "ACTIVE",
    budget: 150000, spent: 118000, impressions: 198000, clicks: 3350, leads: 44, cta: "GET_OFFER",
    headline: "Certified Trucks — low miles", primaryText: "Fresh truck inventory just landed at Dehy Auto Sales — swipe through this week's arrivals. Great financing, quick approvals. 🚚" },
  { name: "Used SUVs — Search", channel: "GOOGLE", format: "SEARCH", objective: "LEADS", status: "ACTIVE",
    budget: 90000, spent: 61000, impressions: 3100, clicks: 245, leads: 27, cta: "LEARN_MORE",
    headline: "Used SUVs Near You | Dehy Auto Sales", primaryText: "Shop quality used SUVs with easy financing.", description: "In-stock now · Financing available" },
  { name: "Inventory Showcase — Vehicle Ads", channel: "GOOGLE", format: "VEHICLE", objective: "TRAFFIC", status: "ACTIVE",
    budget: 50000, spent: 29000, impressions: 84000, clicks: 760, leads: 17, cta: "SHOP_NOW",
    headline: "Shop the full lineup", primaryText: "Every vehicle in stock, with photo and price." },
  { name: "Retargeting — VDP visitors", channel: "FACEBOOK", format: "SINGLE_IMAGE", objective: "LEADS", status: "PAUSED",
    budget: 60000, spent: 41000, impressions: 62000, clicks: 980, leads: 21, cta: "SEND_MESSAGE",
    headline: "Still thinking it over?", primaryText: "That vehicle you were eyeing at Dehy Auto Sales is still here. Message us and we'll hold it for you." },
  { name: "Trade-in Leads", channel: "INSTAGRAM", format: "SINGLE_IMAGE", objective: "MESSAGES", status: "DRAFT",
    budget: 50000, spent: 0, impressions: 0, clicks: 0, leads: 0, cta: "GET_QUOTE",
    headline: "What's your car worth?", primaryText: "Get a real trade-in number in minutes — no haggling." },
  { name: "Weekend Sales Event", channel: "FACEBOOK", format: "CAROUSEL", objective: "TRAFFIC", status: "PENDING_REVIEW",
    budget: 70000, spent: 0, impressions: 0, clicks: 0, leads: 0, cta: "SHOP_NOW",
    headline: "Weekend Sales Event — 3 days only", primaryText: "This weekend only at Dehy Auto Sales — special pricing across the lot. Come find your next ride. 🎉" },
];

const FIRST = ["James", "Maria", "Robert", "Ashley", "David", "Jessica", "Michael", "Sarah", "Chris", "Amanda", "Daniel", "Nicole", "Kevin", "Brittany", "Jason", "Megan", "Eric", "Rachel", "Brian", "Lauren"];
const LAST = ["Smith", "Johnson", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "White", "Harris"];
const SOURCE = "seed-ads";

/** Realistic status funnel for L delivered leads → returns an array of statuses. */
function leadStatuses(L) {
  const sold = Math.round(L * 0.09), appt = Math.round(L * 0.14), qual = Math.round(L * 0.18), cont = Math.round(L * 0.25), lost = Math.round(L * 0.12);
  const out = [];
  for (let i = 0; i < sold; i++) out.push("SOLD");
  for (let i = 0; i < appt; i++) out.push("APPOINTMENT");
  for (let i = 0; i < qual; i++) out.push("QUALIFIED");
  for (let i = 0; i < cont; i++) out.push("CONTACTED");
  for (let i = 0; i < lost; i++) out.push("LOST");
  while (out.length < L) out.push("NEW");
  return out.slice(0, L);
}

(async () => {
  const dealer = await p.dealership.findFirst({ where: { name: DEALER }, select: { id: true } });
  if (!dealer) { console.error(`✗ Dealer "${DEALER}" not found`); process.exit(1); }
  const dealershipId = dealer.id;

  await p.dealership.update({ where: { id: dealershipId }, data: { adConnections: { facebook: true, instagram: false, google: true } } });
  console.log("✓ Connected Facebook + Google (Instagram left disconnected)");

  const vehicles = await p.vehicle.findMany({ where: { dealershipId }, select: { photoUrls: true }, take: 8 });
  const images = vehicles.flatMap((v) => (Array.isArray(v.photoUrls) ? v.photoUrls : [])).filter(Boolean).slice(0, 6);

  const names = CAMPAIGNS.map((c) => c.name);
  await p.campaign.deleteMany({ where: { dealershipId, name: { in: names } } });
  await p.lead.deleteMany({ where: { dealershipId, source: SOURCE } });

  const start = new Date(); start.setDate(start.getDate() - 21); // campaigns have been live ~3 weeks

  for (const c of CAMPAIGNS) {
    const feeCents = Math.round(c.budget * 0.1);
    const imgs = c.format === "CAROUSEL" ? images : c.format === "SEARCH" ? [] : images.slice(0, 1);
    const created = await p.campaign.create({
      data: {
        dealershipId, name: c.name, channel: c.channel, format: c.format, objective: c.objective, status: c.status,
        frequency: "MONTHLY", budgetCents: c.budget, feeCents, netSpendCents: c.budget - feeCents,
        radiusMiles: 30, ageMin: 25, ageMax: 60, gender: "all", smartTargeting: true,
        impressions: c.impressions, clicks: c.clicks, leadCount: c.leads, spentCents: c.spent,
        startDate: c.status === "DRAFT" || c.status === "PENDING_REVIEW" ? null : start,
        primaryText: c.primaryText, headline: c.headline, description: c.description ?? null, cta: c.cta,
        creativeImageUrl: imgs[0] ?? null, creativeImages: imgs,
      },
    });

    let sold = 0;
    if (c.leads > 0) {
      const statuses = leadStatuses(c.leads);
      sold = statuses.filter((s) => s === "SOLD").length;
      await p.lead.createMany({
        data: statuses.map((status, i) => ({
          dealershipId, campaignId: created.id, source: SOURCE, status,
          firstName: FIRST[(i * 7 + c.name.length) % FIRST.length], lastName: LAST[(i * 3) % LAST.length],
          temperature: status === "SOLD" || status === "APPOINTMENT" ? "HOT" : status === "LOST" ? "COLD" : "WARM",
        })),
      });
    }
    console.log(`  · ${c.name} [${c.channel}/${c.format}] ${c.status} — $${(c.spent / 100).toLocaleString()} spent, ${c.leads} leads, ${sold} sold`);
  }
  console.log(`\n✓ Seeded ${CAMPAIGNS.length} campaigns for ${DEALER}`);
  await p.$disconnect();
})();
