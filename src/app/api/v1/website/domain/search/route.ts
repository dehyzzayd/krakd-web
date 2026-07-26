import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { normalizeDomain, isValidDomain, quote, tldOf } from "@/lib/server/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALT_TLDS = ["com", "net", "co", "auto", "cars"];

/* GET /api/v1/website/domain/search?q=downtownauto[.com]
 * Returns availability + exact price for the query and a few alternatives.
 * Price is always shown before any purchase is confirmed. */
export const GET = route(async (req: NextRequest) => {
  await requireAuth(req);
  const q = normalizeDomain(req.nextUrl.searchParams.get("q") ?? "");
  if (!q) throw new HttpError(400, "Enter a name to search.");

  const base = q.includes(".") ? q.split(".")[0] : q;
  const primary = q.includes(".") ? q : `${q}.com`;
  if (!isValidDomain(primary)) throw new HttpError(400, "Enter a valid name like downtownauto");

  const results = [quote(primary)];
  for (const tld of ALT_TLDS) {
    const cand = `${base}.${tld}`;
    if (cand !== primary && tldOf(primary) !== tld) results.push(quote(cand));
  }
  return json({ query: primary, results: results.slice(0, 5) });
});
