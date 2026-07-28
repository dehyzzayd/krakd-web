import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/http";

/** Internal ops dashboard is PLATFORM_ADMIN only (cross-tenant). */
export async function requirePlatformAdmin(req: Request) {
  const p = await requireAuth(req);
  if (p.role !== "PLATFORM_ADMIN") throw new HttpError(403, "Krakd internal access only.");
  return p;
}

const ago = (d: Date | null) => {
  if (!d) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

type DealerFull = {
  id: string; name: string; city: string | null; state: string | null; status: string; createdAt: Date;
  subscription: { status: string; priceCents: number } | null;
  website: { status: string; domainStatus: string; template: string; domain: string | null } | null;
  users: { email: string }[];
  vehicles: { updatedAt: Date }[];
  campaigns: { budgetCents: number; feeCents: number; netSpendCents: number }[];
  _count: { vehicles: number; users: number; leads: number };
};

const DEALER_INCLUDE = {
  subscription: { select: { status: true, priceCents: true } },
  website: { select: { status: true, domainStatus: true, template: true, domain: true } },
  users: { where: { role: "OWNER" as const }, select: { email: true }, take: 1 },
  vehicles: { orderBy: { updatedAt: "desc" as const }, take: 1, select: { updatedAt: true } },
  campaigns: { where: { status: "ACTIVE" as const }, select: { budgetCents: true, feeCents: true, netSpendCents: true } },
  _count: { select: { vehicles: true, users: true, leads: true } },
};

export function computeClient(d: DealerFull) {
  const subActive = d.subscription?.status === "ACTIVE";
  const adBudgetCents = d.campaigns.reduce((s, c) => s + c.budgetCents, 0);
  const lastVehicle = d.vehicles[0]?.updatedAt ?? null;
  const staleDays = lastVehicle ? Math.floor((Date.now() - lastVehicle.getTime()) / 86_400_000) : Infinity;
  const websiteLive = d.website?.status === "PUBLISHED";
  const domainStatus = d.website?.domainStatus ?? "NOT_CONNECTED";

  const attention: string[] = [];
  if (d.subscription?.status === "PAST_DUE") attention.push("Payment past due");
  if (d.subscription?.status === "CANCELED") attention.push("Subscription cancelled");
  if (d.status === "SUSPENDED") attention.push("Account suspended");
  if (d._count.vehicles === 0) attention.push("No inventory");
  if (domainStatus === "PENDING_DNS" || domainStatus === "ACTION_REQUIRED") attention.push("Domain not connected");
  if (!websiteLive) attention.push("Website not published");
  if (d._count.vehicles > 0 && staleDays > 30) attention.push("Inventory feed stale");

  let health = 100;
  if (d.subscription?.status === "PAST_DUE") health -= 30;
  if (["CANCELED", "INACTIVE"].includes(d.subscription?.status ?? "")) health -= 45;
  if (d.status === "SUSPENDED") health -= 40;
  if (d._count.vehicles === 0) health -= 15;
  if (!websiteLive) health -= 10;
  if (domainStatus === "PENDING_DNS" || domainStatus === "ACTION_REQUIRED") health -= 10;
  if (d._count.vehicles > 0 && staleDays > 30) health -= 10;
  health = Math.max(0, Math.min(100, health));

  return {
    id: d.id, name: d.name, city: d.city, state: d.state,
    adminEmail: d.users[0]?.email ?? "—",
    status: d.status,
    subscription: { status: d.subscription?.status ?? "INACTIVE", priceCents: d.subscription?.priceCents ?? 14900 },
    services: { ai: true, inventory: d._count.vehicles > 0, ads: d.campaigns.length > 0, website: websiteLive },
    adBudgetCents,
    website: { live: websiteLive, template: d.website?.template ?? null, domainStatus, domain: d.website?.domain ?? null },
    inventory: { count: d._count.vehicles, lastSync: ago(lastVehicle), stale: staleDays > 30 && d._count.vehicles > 0 },
    users: d._count.users, leads: d._count.leads,
    health,
    attention,
    owner: "Unassigned",
    createdAt: d.createdAt.toISOString(),
  };
}

export type ClientRow = ReturnType<typeof computeClient>;

/** All clients (excludes the internal Krakd Operations org). */
export async function allClients(): Promise<ClientRow[]> {
  const rows = await prisma.dealership.findMany({
    where: { name: { not: "Krakd Operations" } },
    include: DEALER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  const clients = (rows as unknown as DealerFull[]).map(computeClient);
  // needs-action first, then onboarding (low health), then healthy
  return clients.sort((a, b) => (b.attention.length - a.attention.length) || (a.health - b.health));
}

export { ago };
