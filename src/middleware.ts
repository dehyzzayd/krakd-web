import { NextResponse, type NextRequest } from "next/server";

/* Host-based routing.
 *   admin.krakd.io          → /admin
 *   <slug>.krakd.io         → the dealer's public site, served transparently from /site/<slug>
 *   krakd.io / www / app     → the app itself (marketing + dashboard), untouched
 * The subdomain IS the website slug, so no DB lookup is needed at the edge. Custom
 * domains (dealer-owned) are handled separately once connected via the domain flow. */

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "krakd.io";
// Subdomains that are the platform itself, not a dealer site.
const RESERVED = new Set(["www", "app", "dashboard", "api", "staging", "preview", "cdn"]);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;

  const sub = host.endsWith(`.${ROOT}`) ? host.slice(0, -(ROOT.length + 1)) : null;
  if (!sub || sub.includes(".")) return NextResponse.next(); // apex host or deep subdomain → app

  if (sub === "admin") {
    if (pathname === "/") { const url = req.nextUrl.clone(); url.pathname = "/admin"; return NextResponse.rewrite(url); }
    return NextResponse.next();
  }
  if (RESERVED.has(sub)) return NextResponse.next();

  // Never rewrite app internals or the site/API surfaces (widget calls /api/... , assets under /_next).
  if (pathname.startsWith("/api") || pathname.startsWith("/site") || pathname.startsWith("/admin") || pathname.startsWith("/_next") || pathname.startsWith("/_vercel")) {
    return NextResponse.next();
  }

  // <slug>.krakd.io/<path> → /site/<slug>/<path>
  const url = req.nextUrl.clone();
  url.pathname = `/site/${sub}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

// Skip Next internals and static files; run on everything else so host routing applies.
export const config = { matcher: ["/((?!_next/|_vercel/|.*\\.[\\w]+$).*)"] };
