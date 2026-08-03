import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import type { FeedConfig } from "@/lib/server/feed";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const load = async (dealershipId: string) => ((await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { feedConfig: true } }))?.feedConfig ?? {}) as FeedConfig;
const publicView = (c: FeedConfig) => ({ enabled: !!c.enabled, protocol: c.protocol ?? "ftp", host: c.host ?? "", port: c.port ?? 21, username: c.username ?? "", path: c.path ?? "", passwordSet: !!c.password, lastRunAt: c.lastRunAt ?? null, lastResult: c.lastResult ?? null });

/* GET /api/v1/inventory/feed → the dealer's FTP feed config (password never returned) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  return json(publicView(await load(dealershipId)));
});

const schema = z.object({
  enabled: z.boolean().optional(),
  protocol: z.enum(["ftp", "ftps"]).optional(),
  host: z.string().optional(),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  username: z.string().optional(),
  password: z.string().optional(), // blank = keep existing
  path: z.string().optional(),
});

/* PUT /api/v1/inventory/feed → save config (keeps existing password if blank) */
export const PUT = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const current = await load(dealershipId);
  const next: FeedConfig = { ...current, ...parsed.data, password: parsed.data.password ? parsed.data.password : current.password };
  await prisma.dealership.update({ where: { id: dealershipId }, data: { feedConfig: next as unknown as Prisma.InputJsonValue } });
  return json(publicView(next));
});
