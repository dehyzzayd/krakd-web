import { PrismaClient } from "@prisma/client";

// Reuse a single client across hot-reloads and warm serverless invocations so we
// don't open a fresh Postgres connection per request. Runtime points at Neon's
// POOLED host (PgBouncer) via DATABASE_URL, which keeps serverless from exhausting
// connections under load; migrations use DIRECT_URL.
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
g.prisma = prisma;
