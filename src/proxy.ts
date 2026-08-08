import { NextResponse, type NextRequest } from "next/server";

/* Host-based routing (Next 16 "proxy", formerly middleware).
 *   admin.krakd.io          → /admin
 *   <slug>.krakd.io         → the dealer's public site, served transparently from /site/<slug>
 *   krakd.io / www / app     → the app itself (marketing + dashboard), untouched
 * Plus a geo decoy: visitors from Morocco get an unrelated page (whole platform).
 * The subdomain IS the website slug, so no DB lookup is needed at the edge. */

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "krakd.io";
// Subdomains that are the platform itself, not a dealer site.
const RESERVED = new Set(["www", "app", "dashboard", "api", "staging", "preview", "cdn"]);

// Visitors geolocated here see the standalone decoy page instead of the platform.
const DECOY_COUNTRY = "MA";
const BYPASS_KEY = process.env.MA_BYPASS_KEY ?? "greenroots-2019";

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;
  const isIcon = pathname === "/favicon.ico" || pathname === "/icon.svg";

  // ── Decoy: hide the platform from Morocco + French-speaking devices ──
  // Triggers: IP geolocated to Morocco, OR the device's primary language is French
  // or Moroccan-Arabic, OR the client-side timezone guard flagged Casablanca (catches
  // Moroccans on a VPN whose device clock still says Morocco).
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  const lang = (req.headers.get("accept-language") ?? "").toLowerCase().split(",")[0].trim();
  const localeHidden = lang.startsWith("fr") || lang.startsWith("ar-ma");
  const tzHidden = req.cookies.get("geo_ma")?.value === "1";
  if (country === DECOY_COUNTRY || localeHidden || tzHidden) {
    // Team bypass: visiting ?key=SECRET drops a year-long cookie (all of *.krakd.io), then reloads clean.
    if (req.nextUrl.searchParams.get("key") === BYPASS_KEY) {
      const clean = req.nextUrl.clone();
      clean.searchParams.delete("key");
      const res = NextResponse.redirect(clean);
      res.cookies.set("krakd_bypass", "1", { path: "/", domain: `.${ROOT}`, maxAge: 60 * 60 * 24 * 365 });
      return res;
    }
    if (req.cookies.get("krakd_bypass")?.value !== "1") {
      // Icon requests → the charity favicon (so even the browser tab matches the decoy).
      if (isIcon) { const u = req.nextUrl.clone(); u.pathname = "/ma/icon.svg"; return NextResponse.rewrite(u); }
      // Everything else except internals/the decoy itself → the decoy page.
      const internal = pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/_vercel") || pathname === "/ma" || pathname.startsWith("/ma/");
      if (!internal) { const u = req.nextUrl.clone(); u.pathname = "/ma"; return NextResponse.rewrite(u); }
      return NextResponse.next();
    }
  }

  // Icons (non-Morocco or bypassed): serve the real favicon, never host-route them.
  if (isIcon) return NextResponse.next();

  const sub = host.endsWith(`.${ROOT}`) ? host.slice(0, -(ROOT.length + 1)) : null;
  if (!sub || sub.includes(".")) return NextResponse.next(); // apex host or deep subdomain → app

  if (sub === "admin") {
    if (pathname === "/") { const url = req.nextUrl.clone(); url.pathname = "/admin"; return NextResponse.rewrite(url); }
    return NextResponse.next();
  }
  if (RESERVED.has(sub)) return NextResponse.next();

  // Never rewrite app internals or the site/API surfaces (widget calls /api/… , assets under /_next).
  if (pathname.startsWith("/api") || pathname.startsWith("/site") || pathname.startsWith("/admin") || pathname.startsWith("/_next") || pathname.startsWith("/_vercel")) {
    return NextResponse.next();
  }

  // <slug>.krakd.io/<path> → /site/<slug>/<path>
  const url = req.nextUrl.clone();
  url.pathname = `/site/${sub}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

// Run on app routes + the two icon paths (normally skipped as static files) so the
// decoy can swap the favicon too. Still skips _next / _vercel / other static assets.
export const config = { matcher: ["/((?!_next/|_vercel/|.*\\.[\\w]+$).*)", "/favicon.ico", "/icon.svg"] };
