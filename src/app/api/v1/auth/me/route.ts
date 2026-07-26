import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (req: NextRequest) => {
  return json(await requireAuth(req));
});
