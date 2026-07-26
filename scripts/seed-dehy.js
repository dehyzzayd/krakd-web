/* One-off: seed the real Dehy Auto Sales account with a finished website + 5 units.
 * Idempotent — vehicles upsert by (dealershipId, stockNumber); website upserts by dealershipId.
 * Run: export $(grep -E '^DATABASE_URL=' .env.local | xargs) && node scripts/seed-dehy.js */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

const VEHICLES = [
  { stock: "DAS-101", vin: "3TMCZ5AN7NM123101", year: 2022, make: "Toyota", model: "Tacoma", trim: "TRD Off-Road", bodyType: "Truck",
    price: 3899500, cost: 3450000, mileage: 34210, exteriorColor: "Magnetic Gray", interiorColor: "Black", drivetrain: "4WD", fuel: "Gas", transmission: "Automatic", engine: "3.5L V6",
    photos: [img("1552519507-da3b142c6e3d"), img("1533473359331-0135ef1b58bf")] },
  { stock: "DAS-102", vin: "7FARW2H82ME123102", year: 2021, make: "Honda", model: "CR-V", trim: "EX-L", bodyType: "SUV",
    price: 2745000, cost: 2380000, mileage: 41880, exteriorColor: "Modern Steel", interiorColor: "Gray", drivetrain: "AWD", fuel: "Gas", transmission: "CVT", engine: "1.5L Turbo I4",
    photos: [img("1568605117036-5fe5e7bab0b7"), img("1502877338535-766e1452684a")] },
  { stock: "DAS-103", vin: "1FTFW1E85PFA23103", year: 2023, make: "Ford", model: "F-150", trim: "XLT", bodyType: "Truck",
    price: 4690000, cost: 4200000, mileage: 18540, exteriorColor: "Agate Black", interiorColor: "Medium Earth Gray", drivetrain: "4WD", fuel: "Gas", transmission: "Automatic", engine: "3.5L EcoBoost V6",
    photos: [img("1583121274602-3e2820c69888"), img("1494976388531-d1058494cdd8")] },
  { stock: "DAS-104", vin: "5YJ3E1EA7LF123104", year: 2020, make: "Tesla", model: "Model 3", trim: "Long Range", bodyType: "Sedan",
    price: 2890000, cost: 2500000, mileage: 52110, exteriorColor: "Pearl White", interiorColor: "Black", drivetrain: "AWD", fuel: "Electric", transmission: "Automatic", engine: "Dual Motor",
    photos: [img("1560958089-b8a1929cea89"), img("1580273916550-e323be2ae537")] },
  { stock: "DAS-105", vin: "1C4RJFBG7NC123105", year: 2022, make: "Jeep", model: "Grand Cherokee", trim: "Limited", bodyType: "SUV",
    price: 3975000, cost: 3550000, mileage: 29300, exteriorColor: "Diamond Black", interiorColor: "Global Black", drivetrain: "4WD", fuel: "Gas", transmission: "Automatic", engine: "3.6L V6",
    photos: [img("1605559424843-9e4c228bf1c2"), img("1550355291-bbee04a92027")] },
];

const WEBSITE = {
  template: "MODERN",
  status: "PUBLISHED",
  primaryColor: "#2b6ba4",
  headline: "Drive home something you love.",
  intro: "Hand-picked, fully inspected vehicles priced to the market — with financing options for every situation. No pressure, no games.",
  ctaLabel: "Browse inventory",
  heroImageUrl: img("1517672651691-24622a91b550"),
  aboutText: "Dehy Auto Sales is a locally owned dealership built on straight talk and fair pricing. We hand-select every vehicle, put it through a multi-point inspection, and price it to the live market — so you always know you're getting a real deal. Whether you're buying your first car or your fifth, our team makes the process simple and honest from test drive to keys in hand.",
  financingText: "Good credit, bad credit, or no credit — we work with a network of lenders to get you approved. Get pre-qualified online in minutes with no impact to your credit score.",
  tradeInText: "Trade in your current vehicle and put its value straight toward your next one. Get a fair, fast written offer — no obligation to buy.",
  whyUs: [
    { title: "Hand-picked inventory", body: "Every vehicle is selected for quality and condition, then priced to the live market — never over sticker." },
    { title: "Inspected & reconditioned", body: "A multi-point inspection and full reconditioning before any car reaches our lot." },
    { title: "Financing for everyone", body: "Get pre-qualified in minutes with lenders for every credit situation — all online." },
  ],
  staff: [
    { name: "Marcus Ellison", role: "Owner / Sales", photoUrl: img("1500648767791-00dcc994a43e") },
    { name: "Priya Nair", role: "Finance Manager", photoUrl: img("1494790108377-be9c29b29330") },
    { name: "Diego Ramirez", role: "Sales Specialist", photoUrl: img("1507003211169-0a1dd7228f2d") },
  ],
  hours: [
    { day: "Mon", open: "9:00 AM", close: "7:00 PM" },
    { day: "Tue", open: "9:00 AM", close: "7:00 PM" },
    { day: "Wed", open: "9:00 AM", close: "7:00 PM" },
    { day: "Thu", open: "9:00 AM", close: "7:00 PM" },
    { day: "Fri", open: "9:00 AM", close: "7:00 PM" },
    { day: "Sat", open: "9:00 AM", close: "6:00 PM" },
  ],
  socials: { facebook: "https://facebook.com", instagram: "https://instagram.com" },
  phone: "(982) 736-4434",
  email: "dehyinbox@gmail.com",
  address: "4200 S Lamar Blvd",
  city: "Austin",
  state: "TX",
  zip: "78704",
};

(async () => {
  const user = await p.user.findUnique({ where: { email: "dehyinbox@gmail.com" }, select: { dealershipId: true } });
  if (!user) throw new Error("dehyinbox account not found");
  const dealershipId = user.dealershipId;
  const now = new Date();

  for (const v of VEHICLES) {
    const data = {
      dealershipId, vin: v.vin, stockNumber: v.stock, year: v.year, make: v.make, model: v.model, trim: v.trim,
      bodyType: v.bodyType, mileage: v.mileage, status: "AVAILABLE", priceCents: v.price, costCents: v.cost,
      exteriorColor: v.exteriorColor, interiorColor: v.interiorColor, drivetrain: v.drivetrain, fuel: v.fuel,
      transmission: v.transmission, engine: v.engine, photoUrls: v.photos, listedAt: now,
    };
    await p.vehicle.upsert({ where: { dealershipId_stockNumber: { dealershipId, stockNumber: v.stock } }, create: data, update: data });
  }

  await p.website.update({
    where: { dealershipId },
    data: {
      template: WEBSITE.template, status: WEBSITE.status, primaryColor: WEBSITE.primaryColor,
      headline: WEBSITE.headline, intro: WEBSITE.intro, ctaLabel: WEBSITE.ctaLabel, heroImageUrl: WEBSITE.heroImageUrl,
      aboutText: WEBSITE.aboutText, financingText: WEBSITE.financingText, tradeInText: WEBSITE.tradeInText,
      whyUs: WEBSITE.whyUs, staff: WEBSITE.staff, hours: WEBSITE.hours, socials: WEBSITE.socials,
      phone: WEBSITE.phone, email: WEBSITE.email, address: WEBSITE.address, city: WEBSITE.city, state: WEBSITE.state, zip: WEBSITE.zip,
      publishedAt: now,
    },
  });

  const count = await p.vehicle.count({ where: { dealershipId } });
  const w = await p.website.findUnique({ where: { dealershipId }, select: { slug: true, status: true, template: true } });
  console.log(`✓ seeded — vehicles: ${count} | website: /${w.slug} (${w.template}, ${w.status})`);
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
