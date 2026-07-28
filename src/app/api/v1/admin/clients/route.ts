import { NextRequest } from "next/server";
import { requirePlatformAdmin, allClients } from "@/lib/server/admin";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/v1/admin/clients → every dealership with status, services, money and health */
export const GET = route(async (req: NextRequest) => {
  await requirePlatformAdmin(req);
  const items = await allClients();
  return json({ items });
});
