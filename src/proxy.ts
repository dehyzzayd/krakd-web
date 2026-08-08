import { NextResponse, type NextRequest } from "next/server";

/* Host-based routing (Next 16 "proxy", formerly middleware) + a geo/locale decoy.
 *   admin.krakd.io          → /admin
 *   <slug>.krakd.io         → the dealer's public site, served from /site/<slug>
 * Decoy: visitors we don't serve (Morocco, French/Moroccan-Arabic devices, Casablanca
 * timezone, or flagged VPN/proxy IPs) get an unrelated page across the whole platform. */

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "krakd.io";
const RESERVED = new Set(["www", "app", "dashboard", "api", "staging", "preview", "cdn"]);
const DECOY_COUNTRY = "MA";
const BYPASS_KEY = process.env.MA_BYPASS_KEY ?? "greenroots-2019";

const clientIp = (req: NextRequest) =>
  (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "").trim();

// Best-effort per-isolate cache so we don't re-hit IPQS for the same IP.
const vpnCache = new Map<string, { hidden: boolean; exp: number }>();

/** Ask IPQualityScore whether an IP is a VPN/proxy/Tor. Fail-open (never blocks real
 *  visitors on an API hiccup) and never flags search-engine crawlers. */
async function isFlaggedIp(ip: string): Promise<boolean> {
  const key = process.env.IPQS_API_KEY;
  if (!key || !ip || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.") || ip === "::1") return false;
  const cached = vpnCache.get(ip);
  if (cached && cached.exp > Date.now()) return cached.hidden;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch(`https://ipqualityscore.com/api/json/ip/${key}/${encodeURIComponent(ip)}?strictness=1&fast=true&allow_public_access_points=true`, { signal: ctrl.signal });
    clearTimeout(t);
    const d = await r.json();
    const hidden = !!d.success && !d.is_crawler && (d.vpn || d.active_vpn || d.tor || d.active_tor || (d.proxy && d.fraud_score >= 90));
    vpnCache.set(ip, { hidden, exp: Date.now() + 60 * 60 * 1000 });
    return hidden;
  } catch {
    return false; // fail open
  }
}

export async function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;
  const isIcon = pathname === "/favicon.ico" || pathname === "/icon.svg";
  const bypassed = req.cookies.get("krakd_bypass")?.value === "1";

  const toDecoy = () => { const u = req.nextUrl.clone(); u.pathname = "/ma"; return NextResponse.rewrite(u); };
  const toDecoyIcon = () => { const u = req.nextUrl.clone(); u.pathname = "/ma/icon.svg"; return NextResponse.rewrite(u); };
  const internal = pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/_vercel") || pathname === "/ma" || pathname.startsWith("/ma/");

  // ── Decoy: hide from Morocco + French/Moroccan-Arabic devices + Casablanca timezone ──
  const country = req.headers.get("x-vercel-ip-country") ?? "";
  const lang = (req.headers.get("accept-language") ?? "").toLowerCase().split(",")[0].trim();
  const localeHidden = lang.startsWith("fr") || lang.startsWith("ar-ma");
  const tzHidden = req.cookies.get("geo_ma")?.value === "1";
  if (country === DECOY_COUNTRY || localeHidden || tzHidden) {
    // Team bypass: ?key=SECRET drops a year-long cookie across *.krakd.io, then reloads clean.
    if (req.nextUrl.searchParams.get("key") === BYPASS_KEY) {
      const clean = req.nextUrl.clone();
      clean.searchParams.delete("key");
      const res = NextResponse.redirect(clean);
      res.cookies.set("krakd_bypass", "1", { path: "/", domain: `.${ROOT}`, maxAge: 60 * 60 * 24 * 365 });
      return res;
    }
    if (!bypassed) {
      if (isIcon) return toDecoyIcon();
      if (!internal) return toDecoy();
      return NextResponse.next();
    }
  }

  // ── VPN/proxy layer (IPQS): one lookup per visitor, page navigations only ──
  const checked = req.cookies.get("geo_chk")?.value === "1";
  if (!bypassed && !checked && !internal && !isIcon && process.env.IPQS_API_KEY) {
    const flagged = await isFlaggedIp(clientIp(req));
    const res = flagged ? toDecoy() : NextResponse.next();
    res.cookies.set("geo_chk", "1", { path: "/", maxAge: 60 * 60 * 6 }); // recheck every 6h
    if (flagged) res.cookies.set("geo_ma", "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // Icons (not hidden / bypassed): serve the real favicon, never host-route them.
  if (isIcon) return NextResponse.next();

  const sub = host.endsWith(`.${ROOT}`) ? host.slice(0, -(ROOT.length + 1)) : null;
  if (!sub || sub.includes(".")) return NextResponse.next(); // apex host or deep subdomain → app

  if (sub === "admin") {
    if (pathname === "/") { const url = req.nextUrl.clone(); url.pathname = "/admin"; return NextResponse.rewrite(url); }
    return NextResponse.next();
  }
  if (RESERVED.has(sub)) return NextResponse.next();

  if (pathname.startsWith("/api") || pathname.startsWith("/site") || pathname.startsWith("/admin") || pathname.startsWith("/_next") || pathname.startsWith("/_vercel")) {
    return NextResponse.next();
  }

  // <slug>.krakd.io/<path> → /site/<slug>/<path>
  const url = req.nextUrl.clone();
  url.pathname = `/site/${sub}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/((?!_next/|_vercel/|.*\\.[\\w]+$).*)", "/favicon.ico", "/icon.svg"] };
