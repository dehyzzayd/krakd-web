/* Fourth vertical — Summit Builders (CONSTRUCTION). Company + owner + published
 * top-tier contractor site + a portfolio of projects (stored as listings via
 * title/subtitle/attributes). Idempotent by owner email + stockNumber.
 * Run: export $(grep -E '^DATABASE_URL=' .env.local | xargs) && node scripts/seed-construction.js */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=72`;
const OWNER_EMAIL = "summit@krakd.io";
const OWNER_PASSWORD = "Krakd!Demo26";
const SLUG = "summit-builders";
const ACCENT = "#b45309";

const PROJECTS = [
  { stock: "SB-001", title: "Hillside Modern", subtitle: "West Lake Hills", price: 1400000,
    attributes: { serviceType: "Custom home", location: "West Lake Hills", sqft: 4200, budget: "$1.4M", duration: "14 months", year: 2025, scope: "Ground-up custom build with pool", featured: true,
      description: "A ground-up custom home on a steep hillside lot — engineered foundation, floor-to-ceiling glass, white-oak millwork throughout, and a cantilevered pool deck with hill-country views." },
    photos: [img("1600585154340-be6161a56a0c"), img("1600607687939-ce8a6c25118c")] },
  { stock: "SB-002", title: "1920s Full Renovation", subtitle: "Hyde Park", price: 520000,
    attributes: { serviceType: "Renovation", location: "Hyde Park", sqft: 2600, budget: "$520k", duration: "8 months", year: 2024, scope: "Down-to-studs restoration",
      description: "A careful down-to-the-studs restoration of a 1920s bungalow — new systems and structure hidden behind restored original trim, with a modern rear kitchen that respects the home's bones." },
    photos: [img("1512917774080-9991f1c4c750"), img("1600566753086-00f18fb6b3ea")] },
  { stock: "SB-003", title: "Rear Addition & Primary Suite", subtitle: "Tarrytown", price: 285000,
    attributes: { serviceType: "Addition", location: "Tarrytown", sqft: 900, budget: "$285k", duration: "5 months", year: 2024, scope: "900 sqft addition",
      description: "A seamless 900 sqft addition adding a primary suite and study — matched rooflines, brick and window profiles so it reads as original, not bolted on." },
    photos: [img("1523217582562-09d0def993a6"), img("1600585154526-990dced4db0d")] },
  { stock: "SB-004", title: "Chef's Kitchen Remodel", subtitle: "Mueller", price: 140000,
    attributes: { serviceType: "Kitchen", location: "Mueller", sqft: 380, budget: "$140k", duration: "10 weeks", year: 2025, scope: "Full kitchen gut + reconfigure",
      description: "A full kitchen gut and reconfigure — walls opened to the living space, a 10-foot island, commercial-grade appliances and integrated storage designed around how the owners actually cook." },
    photos: [img("1556909212-d5b604d0c90d"), img("1556912173-3bb406ef7e77")] },
  { stock: "SB-005", title: "Warehouse to Office Build-out", subtitle: "East Austin", price: 980000,
    attributes: { serviceType: "Commercial", location: "East Austin", sqft: 6500, budget: "$980k", duration: "9 months", year: 2023, scope: "Tenant build-out, 6,500 sqft",
      description: "A 6,500 sqft tenant build-out converting a raw warehouse into a modern office — exposed structure, new mechanical, glass conference rooms and a full amenity floor, delivered on schedule." },
    photos: [img("1497366216548-37526070297c"), img("1524758631624-e2822e304c36")] },
  { stock: "SB-006", title: "Outdoor Living & Pool House", subtitle: "Lakeway", price: 310000,
    attributes: { serviceType: "Outdoor", location: "Lakeway", sqft: 1100, budget: "$310k", duration: "6 months", year: 2024, scope: "Covered patio, kitchen & pool house",
      description: "A covered outdoor living build with a full summer kitchen, fireplace and a detached pool house — engineered for Texas heat and built to entertain year-round." },
    photos: [img("1600047509807-ba8f99d2cdde"), img("1605276374104-dee2a0ed3cd6")] },
];

const LOGO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='210' height='40' viewBox='0 0 210 40'>
<path d='M6 30 L20 8 L34 30 Z' fill='none' stroke='#b45309' stroke-width='3.4' stroke-linejoin='round'/>
<path d='M13 30 L20 19 L27 30' fill='#b45309'/>
<text x='44' y='27' font-family='Oswald, Arial Narrow, sans-serif' font-weight='700' font-size='21' letter-spacing='1.5' fill='#17150f'>SUMMIT</text>
</svg>`;
const LOGO_URL = "data:image/svg+xml," + encodeURIComponent(LOGO_SVG);

const WEBSITE = {
  template: "MODERN", status: "PUBLISHED", primaryColor: ACCENT, logoUrl: LOGO_URL,
  headline: "Built right. Built to last.",
  intro: "Summit Builders is a full-service design-build firm crafting custom homes, renovations and additions across Central Texas — licensed, insured, and obsessive about the details.",
  ctaLabel: "See our work",
  heroImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80",
  aboutText: "Summit Builders was founded on a simple idea: a build should be as painless as it is beautiful. We run one dedicated crew per project, keep our sites clean, quote honestly and hold ourselves to the schedule we set. From ground-up custom homes to full renovations and additions, we treat your project like it's the only one that matters — because to us, it is.",
  whyUs: [
    { title: "Licensed & insured", body: "Fully licensed, bonded and insured. Every job is permitted, inspected and done to code — protected from the first day to the last." },
    { title: "On time, on budget", body: "Clear scopes and honest, itemized estimates up front, and a schedule we hold ourselves to. No surprise change orders." },
    { title: "Craftsmanship that lasts", body: "Skilled in-house crews and materials we stand behind. We build for the decades, not the trend cycle." },
  ],
  staff: [
    { name: "Jordan Cole", role: "Founder & Lead Builder", photoUrl: img("1507003211169-0a1dd7228f2d") },
    { name: "Marcus Webb", role: "Project Manager", photoUrl: img("1500648767791-00dcc994a43e") },
  ],
  reviews: [
    { name: "The Hendersons", rating: 5, body: "Summit rebuilt our 1920s home to the studs and it came out flawless. Clean site every day, and they hit the timeline to the week." },
    { name: "Rachel & Tom", rating: 5, body: "The most honest contractor we've worked with. The estimate was the estimate — no surprise change orders. We'd build with them again tomorrow." },
    { name: "David M.", rating: 5, body: "Our addition looks like it was always part of the house. Craftsmanship is genuinely a cut above." },
  ],
  hours: [
    { day: "Mon", open: "7:00 AM", close: "5:00 PM" }, { day: "Tue", open: "7:00 AM", close: "5:00 PM" },
    { day: "Wed", open: "7:00 AM", close: "5:00 PM" }, { day: "Thu", open: "7:00 AM", close: "5:00 PM" },
    { day: "Fri", open: "7:00 AM", close: "3:00 PM" },
  ],
  socials: { facebook: "https://facebook.com", instagram: "https://instagram.com" },
  phone: "(512) 555-0177", email: "build@summitbuilders.com",
  address: "3400 E 5th St", city: "Austin", state: "TX", zip: "78702",
};

(async () => {
  const now = new Date();
  let dealershipId;
  const existing = await p.user.findUnique({ where: { email: OWNER_EMAIL }, select: { dealershipId: true } });
  if (existing) {
    dealershipId = existing.dealershipId;
    await p.dealership.update({ where: { id: dealershipId }, data: { vertical: "CONSTRUCTION", status: "ACTIVE" } });
  } else {
    const d = await p.dealership.create({
      data: {
        name: "Summit Builders", vertical: "CONSTRUCTION", status: "ACTIVE",
        phone: WEBSITE.phone, email: WEBSITE.email, brandColor: ACCENT, logoUrl: LOGO_URL,
        addressLine1: WEBSITE.address, city: WEBSITE.city, state: WEBSITE.state, postalCode: WEBSITE.zip, hours: WEBSITE.hours,
        subscription: { create: { priceCents: 14900, status: "ACTIVE" } }, aiSettings: { create: {} },
      },
    });
    dealershipId = d.id;
    await p.user.create({ data: { dealershipId, email: OWNER_EMAIL, passwordHash: bcrypt.hashSync(OWNER_PASSWORD, 10), firstName: "Jordan", lastName: "Cole", role: "OWNER" } });
  }

  for (const j of PROJECTS) {
    const data = { dealershipId, stockNumber: j.stock, title: j.title, subtitle: j.subtitle, attributes: j.attributes, priceCents: j.price * 100, status: "AVAILABLE", photoUrls: j.photos, listedAt: now };
    await p.vehicle.upsert({ where: { dealershipId_stockNumber: { dealershipId, stockNumber: j.stock } }, create: data, update: data });
  }
  await p.website.upsert({ where: { dealershipId }, create: { dealershipId, slug: SLUG, ...WEBSITE, publishedAt: now }, update: { ...WEBSITE, publishedAt: now } });

  const count = await p.vehicle.count({ where: { dealershipId } });
  console.log(`✓ Summit Builders (CONSTRUCTION) — projects: ${count} | site: /site/${SLUG}`);
  console.log(`  login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
})().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
