/* Third vertical on the same engine — Cedar Dental (MEDICAL).
 * Business + owner + published site + services (stored in the shared `vehicles`
 * table via title/subtitle/attributes). Idempotent by owner email + stockNumber.
 * Run: export $(grep -E '^DATABASE_URL=' .env.local | xargs) && node scripts/seed-medical.js */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;
const OWNER_EMAIL = "cedar@krakd.io";
const OWNER_PASSWORD = "Krakd!Demo26";
const SLUG = "cedar-dental";

const SERVICES = [
  { stock: "CD-001", title: "New Patient Exam & Cleaning", subtitle: "Comprehensive first visit", price: 12900,
    attributes: { category: "Preventive", provider: "Dr. Alvarez", duration: "60 min", insurance: "Most plans", popular: true, description: "A thorough exam, digital X-rays, and a gentle professional cleaning — the ideal first visit to get a clear picture of your oral health." },
    photos: [img("1588776814546-1ffcf47267a5"), img("1606811841689-23dfddce3e95")] },
  { stock: "CD-002", title: "Professional Teeth Whitening", subtitle: "Brighter in one visit", price: 39900,
    attributes: { category: "Cosmetic", provider: "Dr. Alvarez", duration: "75 min", insurance: "Self-pay", description: "In-office whitening that lifts years of staining in a single appointment, with custom trays to maintain your results at home." },
    photos: [img("1609840114035-3c981b782dfe"), img("1601046668428-94ea13437736")] },
  { stock: "CD-003", title: "Invisalign Clear Aligners", subtitle: "Straighten discreetly", price: 480000,
    attributes: { category: "Cosmetic", provider: "Dr. Chen", duration: "45 min consult", insurance: "Select plans", description: "A custom clear-aligner plan to straighten your smile without wires or brackets, mapped out with a 3D preview of your results." },
    photos: [img("1519494026892-80bbd2d6fd0d"), img("1607613009820-a29f7bb81c04")] },
  { stock: "CD-004", title: "Root Canal Therapy", subtitle: "Save the natural tooth", price: 110000,
    attributes: { category: "Restorative", provider: "Dr. Chen", duration: "90 min", insurance: "Most plans", description: "Modern, comfortable endodontic treatment to relieve pain and preserve your natural tooth, using rotary instrumentation and gentle sedation options." },
    photos: [img("1612349317150-e413f6a5b16d"), img("1583912267550-d6c2ac3196c0")] },
  { stock: "CD-005", title: "Dental Implant Consultation", subtitle: "Permanent tooth replacement", price: 0,
    attributes: { category: "Surgical", provider: "Dr. Alvarez", duration: "45 min", insurance: "Most plans", description: "A one-on-one consult and 3D scan to plan a natural-looking, permanent replacement for a missing tooth. Pricing is tailored after your evaluation." },
    photos: [img("1629909613654-28e377c37b09"), img("1598256989800-fe5f95da9787")] },
];

const LOGO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='40' viewBox='0 0 200 40'>
<path d='M18 8 C11 8 7 13 7 20 c0 8 4 14 7 12 2-1 2-4 4-4 s2 3 4 4 c3 2 7-4 7-12 C29 13 25 8 18 8 Z' fill='none' stroke='#0e7490' stroke-width='2.4'/>
<text x='40' y='23' font-family='Georgia, serif' font-weight='700' font-size='19' letter-spacing='0.3' fill='#134e5a'>CEDAR</text>
<text x='41' y='34' font-family='Arial, sans-serif' font-weight='700' font-size='8' letter-spacing='3.5' fill='#0e7490'>D E N T A L</text>
</svg>`;
const LOGO_URL = "data:image/svg+xml," + encodeURIComponent(LOGO_SVG);

const WEBSITE = {
  template: "MODERN", status: "PUBLISHED", primaryColor: "#0e7490", logoUrl: LOGO_URL,
  headline: "Care that keeps you smiling.",
  intro: "A modern dental practice built around your comfort — gentle providers, clear pricing, and most insurance accepted. New patients always welcome.",
  ctaLabel: "See our services",
  heroImageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2000&q=80",
  aboutText: "Cedar Dental is a modern, family-friendly practice devoted to comfortable, honest care. Our providers take the time to explain your options, work with most major insurance plans, and use up-to-date technology to make every visit easier. From routine cleanings to full smile makeovers, we treat every patient like a neighbor.",
  whyUs: [
    { title: "Experienced providers", body: "A credentialed team delivering attentive, up-to-date care for every patient and every age." },
    { title: "Most insurance accepted", body: "We work with major plans and offer clear self-pay pricing — no surprises at checkout." },
    { title: "Comfortable, modern care", body: "A calm, modern office with sedation options and technology that makes visits easier." },
  ],
  staff: [
    { name: "Dr. Maria Alvarez", role: "General & Cosmetic Dentist", photoUrl: img("1594824476967-48c8b964273f") },
    { name: "Dr. David Chen", role: "Endodontist", photoUrl: img("1612349317150-e413f6a5b16d") },
    { name: "Renee Park", role: "Patient Coordinator", photoUrl: img("1573496359142-b8d87734a5a2") },
  ],
  reviews: [
    { name: "Jamie L.", rating: 5, body: "Genuinely painless. They explained every option and my insurance covered more than I expected." },
    { name: "The Okafors", rating: 5, body: "Took the whole family in same week. Kids actually want to go back." },
    { name: "Sofia R.", rating: 5, body: "Whitening results were incredible and the team could not have been kinder." },
  ],
  hours: [
    { day: "Mon", open: "8:00 AM", close: "5:00 PM" }, { day: "Tue", open: "8:00 AM", close: "5:00 PM" },
    { day: "Wed", open: "8:00 AM", close: "5:00 PM" }, { day: "Thu", open: "8:00 AM", close: "5:00 PM" },
    { day: "Fri", open: "8:00 AM", close: "2:00 PM" },
  ],
  socials: { facebook: "https://facebook.com", instagram: "https://instagram.com" },
  phone: "(512) 555-0148", email: "hello@cedardental.com",
  address: "820 Congress Ave, Suite 300", city: "Austin", state: "TX", zip: "78701",
};

(async () => {
  const now = new Date();
  let dealershipId;
  const existing = await p.user.findUnique({ where: { email: OWNER_EMAIL }, select: { dealershipId: true } });

  if (existing) {
    dealershipId = existing.dealershipId;
    await p.dealership.update({ where: { id: dealershipId }, data: { vertical: "MEDICAL", status: "ACTIVE" } });
  } else {
    const dealership = await p.dealership.create({
      data: {
        name: "Cedar Dental", vertical: "MEDICAL", status: "ACTIVE",
        phone: WEBSITE.phone, email: WEBSITE.email, brandColor: WEBSITE.primaryColor, logoUrl: LOGO_URL,
        addressLine1: WEBSITE.address, city: WEBSITE.city, state: WEBSITE.state, postalCode: WEBSITE.zip, hours: WEBSITE.hours,
        subscription: { create: { priceCents: 14900, status: "ACTIVE" } },
        aiSettings: { create: {} },
      },
    });
    dealershipId = dealership.id;
    await p.user.create({
      data: { dealershipId, email: OWNER_EMAIL, passwordHash: bcrypt.hashSync(OWNER_PASSWORD, 10), firstName: "Maria", lastName: "Alvarez", role: "OWNER" },
    });
  }

  for (const s of SERVICES) {
    const data = { dealershipId, stockNumber: s.stock, title: s.title, subtitle: s.subtitle, attributes: s.attributes, priceCents: s.price, status: "AVAILABLE", photoUrls: s.photos, listedAt: now };
    await p.vehicle.upsert({ where: { dealershipId_stockNumber: { dealershipId, stockNumber: s.stock } }, create: data, update: data });
  }

  await p.website.upsert({ where: { dealershipId }, create: { dealershipId, slug: SLUG, ...WEBSITE, publishedAt: now }, update: { ...WEBSITE, publishedAt: now } });

  const count = await p.vehicle.count({ where: { dealershipId } });
  console.log(`✓ Cedar Dental (MEDICAL) — services: ${count} | site: /site/${SLUG} (${WEBSITE.template}, ${WEBSITE.status})`);
  console.log(`  login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
})().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
