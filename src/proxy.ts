import { NextResponse, type NextRequest } from "next/server";

/** Route the admin.* subdomain (e.g. admin.krakd.io) to the /admin surface.
 * The app also serves /admin directly, so links keep the /admin prefix and work on any host. */
export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  if (host.startsWith("admin.") && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
