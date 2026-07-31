import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/campaigns → dealer's campaigns + rolled-up stats */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const items = await prisma.campaign.findMany({
    where: { dealershipId },
    orderBy: { createdAt: "desc" },
  });
  const active = items.filter((c) => c.status === "ACTIVE").length;
  const spentCents = items.reduce((s, c) => s + c.spentCents, 0);
  const leads = items.reduce((s, c) => s + c.leadCount, 0);
  return json({ items, stats: { active, spentCents, leads } });
});

const createSchema = z.object({
  name: z.string().trim().min(1, "Name your campaign"),
  channel: z.enum(["FACEBOOK", "INSTAGRAM", "GOOGLE"]),
  objective: z.enum(["LEADS", "CALLS", "TRAFFIC", "MESSAGES"]).default("LEADS"),
  frequency: z.enum(["ONE_TIME", "WEEKLY", "MONTHLY"]).default("MONTHLY"),
  budgetCents: z.number().int().min(5000, "Minimum budget is $50"),
  radiusMiles: z.number().int().min(1).max(500).default(25),
  ageMin: z.number().int().min(18).max(99).default(18),
  ageMax: z.number().int().min(18).max(99).default(65),
  gender: z.enum(["all", "male", "female"]).default("all"),
  smartTargeting: z.boolean().default(true),
  promotedVehicleIds: z.array(z.string()).default([]),
  // ad creative snapshot
  format: z.enum(["SINGLE_IMAGE", "CAROUSEL", "SEARCH", "VEHICLE"]).default("SINGLE_IMAGE"),
  primaryText: z.string().max(2000).optional(),
  headline: z.string().max(255).optional(),
  description: z.string().max(255).optional(),
  cta: z.string().max(40).optional(),
  creativeImageUrl: z.string().max(1_500_000).nullable().optional(),
  creativeImages: z.array(z.string().max(1_500_000)).max(20).default([]),
});

/* POST /api/v1/campaigns → create a DRAFT campaign; Krakd takes a flat 10% fee, 90% is media spend */
export const POST = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const b = parsed.data;
  if (b.ageMax < b.ageMin) throw new HttpError(400, "Max age must be above min age");

  const feeCents = Math.round(b.budgetCents * 0.1);
  const netSpendCents = b.budgetCents - feeCents;

  const campaign = await prisma.campaign.create({
    data: {
      dealershipId,
      name: b.name,
      channel: b.channel,
      objective: b.objective,
      frequency: b.frequency,
      status: "DRAFT",
      budgetCents: b.budgetCents,
      feeCents,
      netSpendCents,
      radiusMiles: b.radiusMiles,
      ageMin: b.ageMin,
      ageMax: b.ageMax,
      gender: b.gender,
      smartTargeting: b.smartTargeting,
      promotedVehicleIds: b.promotedVehicleIds as unknown as Prisma.InputJsonValue,
      format: b.format,
      primaryText: b.primaryText ?? null,
      headline: b.headline ?? null,
      description: b.description ?? null,
      cta: b.cta ?? "LEARN_MORE",
      creativeImageUrl: b.creativeImageUrl ?? null,
      creativeImages: b.creativeImages as unknown as Prisma.InputJsonValue,
    },
  });
  return json(campaign, 201);
});
