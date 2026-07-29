/* Prototype: a second vertical on the same engine — Northpeak Realty (REAL_ESTATE).
 * Creates the business + owner + published site + 5 property listings (stored in the
 * same `vehicles` table via title/subtitle/attributes; year/make/model left null).
 * Idempotent — user upserts by email; listings upsert by (dealershipId, stockNumber).
 * Run: export $(grep -E '^DATABASE_URL=' .env.local | xargs) && node scripts/seed-realestate.js */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;
const OWNER_EMAIL = "northpeak@krakd.io";
const OWNER_PASSWORD = "Krakd!Demo26";
const SLUG = "northpeak-realty";

const LISTINGS = [
  { stock: "NP-001", title: "Modern Hillside Estate", subtitle: "West Lake Hills", price: 185000000,
    attributes: { beds: 4, baths: 3.5, sqft: 3200, propertyType: "House", yearBuilt: 2019, neighborhood: "West Lake Hills", lotSize: "0.9 acre", parking: "3-car garage", status: "new" },
    photos: [img("1568605114967-8130f3a36994"), img("1600585154340-be6161a56a0c")] },
  { stock: "NP-002", title: "Downtown Skyline Condo", subtitle: "Downtown", price: 72000000,
    attributes: { beds: 2, baths: 2, sqft: 1450, propertyType: "Condo", yearBuilt: 2021, neighborhood: "Downtown", parking: "1 reserved space" },
    photos: [img("1502672260266-1c1ef2d93688"), img("1600607687939-ce8a6c25118c")] },
  { stock: "NP-003", title: "Restored Craftsman Bungalow", subtitle: "Travis Heights", price: 94500000,
    attributes: { beds: 3, baths: 2, sqft: 1780, propertyType: "House", yearBuilt: 1998, neighborhood: "Travis Heights", lotSize: "0.25 acre", parking: "Driveway" },
    photos: [img("1512917774080-9991f1c4c750"), img("1600566753086-00f18fb6b3ea")] },
  { stock: "NP-004", title: "Lakefront Contemporary", subtitle: "Lake Austin", price: 245000000,
    attributes: { beds: 5, baths: 4, sqft: 4100, propertyType: "House", yearBuilt: 2022, neighborhood: "Lake Austin", lotSize: "1.2 acre", parking: "3-car garage", status: "new" },
    photos: [img("1580587771525-78b9dba3b914"), img("1600585154526-990dced4db0d")] },
  { stock: "NP-005", title: "Garden District Townhome", subtitle: "Clarksville", price: 83500000,
    attributes: { beds: 3, baths: 2.5, sqft: 2050, propertyType: "Townhouse", yearBuilt: 2016, neighborhood: "Clarksville", parking: "2-car garage", reduced: true },
    photos: [img("1605276374104-dee2a0ed3cd6"), img("1600047509807-ba8f99d2cdde")] },
];

const LOGO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='210' height='40' viewBox='0 0 210 40'>
<path d='M6 30 L18 8 L30 30 Z' fill='none' stroke='#1f3a5f' stroke-width='3' stroke-linejoin='round'/>
<path d='M12 30 L18 19 L24 30' fill='none' stroke='#b08d57' stroke-width='2.5' stroke-linejoin='round'/>
<text x='40' y='23' font-family='Georgia, serif' font-weight='700' font-size='19' letter-spacing='0.5' fill='#1f3a5f'>NORTHPEAK</text>
<text x='41' y='34' font-family='Arial, sans-serif' font-weight='700' font-size='8' letter-spacing='4' fill='#b08d57'>R E A L T Y</text>
</svg>`;
const LOGO_URL = "data:image/svg+xml," + encodeURIComponent(LOGO_SVG);

const WEBSITE = {
  template: "PREMIUM", status: "PUBLISHED", primaryColor: "#b08d57", logoUrl: LOGO_URL,
  headline: "Find where you belong.",
  intro: "A curated portfolio of the city's most distinctive homes — represented by agents who know every street, school and skyline.",
  ctaLabel: "View listings",
  heroImageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2000&q=80",
  aboutText: "Northpeak Realty is a boutique brokerage devoted to the homes and neighborhoods that define this city. We represent a considered portfolio of distinctive properties, and we guide every client — from first-time buyers to seasoned investors — with the same discretion, market fluency and care. From the first private showing to the closing table, your agent is with you at every step.",
  financingText: "Our in-house mortgage partners pre-qualify you in a single conversation, so you can make an offer with confidence. Conventional, jumbo and first-time buyer programs available.",
  tradeInText: "Selling before you buy? Our listing team prepares, stages and markets your current home to reach the right buyers — often before it ever hits the open market.",
  whyUs: [
    { title: "Local market experts", body: "Decades of combined experience across the city's most sought-after neighborhoods and price points." },
    { title: "White-glove representation", body: "From first showing to closing table, a dedicated agent guides every step — nothing is outsourced." },
    { title: "Priced with precision", body: "Every listing is positioned with real comparable data and live market signals — never guesswork." },
  ],
  staff: [
    { name: "Elena Marsh", role: "Principal Broker", photoUrl: img("1573496359142-b8d87734a5a2") },
    { name: "Daniel Cho", role: "Listing Agent", photoUrl: img("1507003211169-0a1dd7228f2d") },
    { name: "Sofia Reyes", role: "Buyer's Agent", photoUrl: img("1494790108377-be9c29b29330") },
  ],
  reviews: [
    { name: "The Hendersons", rating: 5, body: "Elena sold our home for over asking in nine days and found us our next place the same week. Flawless." },
    { name: "Marcus T.", rating: 5, body: "As a first-time buyer I felt guided, never rushed. They knew every building downtown inside out." },
    { name: "Priya & Sam", rating: 5, body: "Boutique attention with big-brokerage reach. We'd never use anyone else." },
  ],
  hours: [
    { day: "Mon", open: "9:00 AM", close: "6:00 PM" }, { day: "Tue", open: "9:00 AM", close: "6:00 PM" },
    { day: "Wed", open: "9:00 AM", close: "6:00 PM" }, { day: "Thu", open: "9:00 AM", close: "6:00 PM" },
    { day: "Fri", open: "9:00 AM", close: "6:00 PM" }, { day: "Sat", open: "10:00 AM", close: "4:00 PM" },
  ],
  socials: { facebook: "https://facebook.com", instagram: "https://instagram.com" },
  phone: "(512) 555-0192", email: "hello@northpeakrealty.com",
  address: "1100 W 6th St, Suite 200", city: "Austin", state: "TX", zip: "78703",
};

(async () => {
  const now = new Date();
  let dealershipId;
  const existing = await p.user.findUnique({ where: { email: OWNER_EMAIL }, select: { dealershipId: true } });

  if (existing) {
    dealershipId = existing.dealershipId;
    await p.dealership.update({ where: { id: dealershipId }, data: { vertical: "REAL_ESTATE", status: "ACTIVE" } });
  } else {
    const dealership = await p.dealership.create({
      data: {
        name: "Northpeak Realty", vertical: "REAL_ESTATE", status: "ACTIVE",
        phone: WEBSITE.phone, email: WEBSITE.email,
        subscription: { create: { priceCents: 14900, status: "ACTIVE" } },
        aiSettings: { create: {} },
      },
    });
    dealershipId = dealership.id;
    await p.user.create({
      data: {
        dealershipId, email: OWNER_EMAIL, passwordHash: bcrypt.hashSync(OWNER_PASSWORD, 10),
        firstName: "Elena", lastName: "Marsh", role: "OWNER",
      },
    });
  }

  for (const l of LISTINGS) {
    const data = {
      dealershipId, stockNumber: l.stock, title: l.title, subtitle: l.subtitle, attributes: l.attributes,
      priceCents: l.price, status: "AVAILABLE", photoUrls: l.photos, listedAt: now,
    };
    await p.vehicle.upsert({ where: { dealershipId_stockNumber: { dealershipId, stockNumber: l.stock } }, create: data, update: data });
  }

  await p.website.upsert({
    where: { dealershipId },
    create: { dealershipId, slug: SLUG, ...WEBSITE, publishedAt: now },
    update: { ...WEBSITE, publishedAt: now },
  });

  const count = await p.vehicle.count({ where: { dealershipId } });
  const w = await p.website.findUnique({ where: { dealershipId }, select: { slug: true, status: true, template: true } });
  console.log(`✓ Northpeak Realty (REAL_ESTATE) — listings: ${count} | site: /site/${w.slug} (${w.template}, ${w.status})`);
  console.log(`  login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
})().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
