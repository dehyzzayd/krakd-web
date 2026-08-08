import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { json, route, HttpError } from "@/lib/server/http";
import { normalizeDomain, isValidDomain, tldOf } from "@/lib/server/domain";
import { quoteDomain } from "@/lib/server/registrar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALT_TLDS = ["com", "net", "co", "io", "auto"];

/* GET /api/v1/website/domain/search?q=downtownauto[.com]
 * Live availability + price (registrar cost + our markup) for the query and a few
 * alternatives. The price shown here is exactly what the dealer is charged. */
export const GET = route(async (req: NextRequest) => {
  await requireAuth(req);
  const q = normalizeDomain(req.nextUrl.searchParams.get("q") ?? "");
  if (!q) throw new HttpError(400, "Enter a name to search.");

  const base = q.includes(".") ? q.split(".")[0] : q;
  const primary = q.includes(".") ? q : `${q}.com`;
  if (!isValidDomain(primary)) throw new HttpError(400, "Enter a valid name like downtownauto");

  const candidates = [primary];
  for (const tld of ALT_TLDS) {
    const cand = `${base}.${tld}`;
    if (cand !== primary && tldOf(primary) !== tld) candidates.push(cand);
  }

  const quotes = await Promise.all(candidates.slice(0, 5).map((c) => quoteDomain(c)));
  // Never leak the registrar cost / markup to the client — only the customer price.
  const results = quotes.map((x) => ({ domain: x.domain, available: x.available, priceCents: x.priceCents }));
  return json({ query: primary, results });
});
