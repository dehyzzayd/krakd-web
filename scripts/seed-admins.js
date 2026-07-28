/* Seed two Krakd internal (PLATFORM_ADMIN) accounts for the Internal Operations Dashboard.
 * Run: export $(grep -E '^DATABASE_URL=' .env.local | xargs) && node scripts/seed-admins.js */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

const PASSWORD = "Krakd!Admin26";
const ADMINS = [
  { email: "zayd@krakd.io", firstName: "Zayd", lastName: "Dehy" },
  { email: "ops@krakd.io", firstName: "Krakd", lastName: "Operations" },
];

(async () => {
  // internal org to attach platform admins to (excluded from the client portfolio)
  let org = await p.dealership.findFirst({ where: { name: "Krakd Operations" } });
  if (!org) org = await p.dealership.create({ data: { name: "Krakd Operations", status: "ACTIVE" } });

  const hash = await bcrypt.hash(PASSWORD, 10);
  for (const a of ADMINS) {
    const existing = await p.user.findUnique({ where: { email: a.email } });
    if (existing) {
      await p.user.update({ where: { email: a.email }, data: { role: "PLATFORM_ADMIN", passwordHash: hash, status: "ACTIVE" } });
      console.log("updated", a.email);
    } else {
      await p.user.create({ data: { email: a.email, passwordHash: hash, firstName: a.firstName, lastName: a.lastName, role: "PLATFORM_ADMIN", status: "ACTIVE", dealershipId: org.id } });
      console.log("created", a.email);
    }
  }
  console.log(`\n✓ 2 platform admins ready · password: ${PASSWORD}`);
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
