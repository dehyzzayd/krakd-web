import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { byId, type IntegrationsRecord, type ProviderConfig } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const load = async (dealershipId: string) =>
  ((await prisma.dealership.findUnique({ where: { id: dealershipId }, select: { integrations: true } }))?.integrations ?? {}) as IntegrationsRecord;

/* GET /api/v1/integrations → the dealer's saved integration configs (secrets masked) */
export const GET = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const rec = await load(dealershipId);
  const masked: IntegrationsRecord = {};
  for (const [pid, cfg] of Object.entries(rec)) {
    const def = byId(pid);
    const out: ProviderConfig = { ...cfg };
    def?.fields.forEach((f) => {
      if (f.type === "password" && out[f.key]) { out[`${f.key}Set`] = true; out[f.key] = ""; }
    });
    masked[pid] = out;
  }
  return json({ integrations: masked });
});

const schema = z.object({
  id: z.string(),
  config: z.record(z.string(), z.union([z.string(), z.boolean()])),
});

/* PUT /api/v1/integrations → connect / update / disable one provider */
export const PUT = route(async (req: NextRequest) => {
  const { dealershipId } = await requireAuth(req);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);
  const def = byId(parsed.data.id);
  if (!def) throw new HttpError(400, "Unknown integration");

  const rec = await load(dealershipId);
  const existing = rec[def.id] ?? {};
  const incoming = parsed.data.config;

  // required non-secret fields must be present to enable (unless it's a toggle-only/no-field provider)
  const enabling = incoming.enabled === true;
  if (enabling && def.fields.length) {
    const anyValue = def.fields.some((f) => String(incoming[f.key] ?? "").trim() || (f.type === "password" && existing[f.key]));
    if (!anyValue) throw new HttpError(400, "Enter your connection details first.");
  }

  const next: ProviderConfig = { ...existing };
  for (const f of def.fields) {
    const v = incoming[f.key];
    // blank password → keep the stored secret
    if (f.type === "password" && (v === "" || v === undefined)) continue;
    if (v !== undefined) next[f.key] = v;
  }
  if (incoming.mode === "automatic" || incoming.mode === "manual") next.mode = incoming.mode;
  next.enabled = enabling;
  if (enabling && !next.connectedAt) next.connectedAt = new Date().toISOString();
  if (!enabling) delete next.connectedAt;

  const saved: IntegrationsRecord = { ...rec, [def.id]: next };
  await prisma.dealership.update({ where: { id: dealershipId }, data: { integrations: saved as unknown as Prisma.InputJsonValue } });
  return json({ ok: true, live: def.live });
});
