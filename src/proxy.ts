import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_HOST, ADMIN_SITE_URL, MAIN_HOST, MAIN_SITE_URL, normalizeHost } from "@/lib/hosts"

// Host-based split of one deployment across two domains:
//   admin host (sabtadxb.org) -> only /admin/* (+ static assets); everything
//                                else bounces to the public site.
//   public host (sabtadxb.com) -> /admin/* bounces to the admin host.
// Other hosts (localhost, preview URLs) behave as before.

const STATIC_ASSET = /\.(png|jpe?g|webp|avif|svg|ico|gif|woff2?|css|js|map|mp4|webm)$/i

export function proxy(req: NextRequest) {
  // A server action that ends in redirect() makes Next fetch the target page
  // itself (a GET carrying the action's own x-action-redirect header) and
  // splice its payload into the action response. On Hostinger that internal
  // fetch comes back with chunk references that don't exist, so the browser
  // dies with a ChunkLoadError right after login / save. Answering it with a
  // non-RSC 204 makes Next fall back to its normal redirect: the browser
  // simply does a full page load of the target, which works.
  if (req.method === "GET" && req.headers.has("x-action-redirect")) {
    return new NextResponse(null, { status: 204 })
  }

  const host = normalizeHost(req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
  const { pathname, search } = req.nextUrl
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/")

  if (host === ADMIN_HOST) {
    if (pathname === "/robots.txt") {
      return new NextResponse("User-agent: *\nDisallow: /\n", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    }
    if (pathname === "/") return NextResponse.redirect(`${ADMIN_SITE_URL}/admin`)
    if (!isAdminPath && !STATIC_ASSET.test(pathname)) {
      // Background fetches (Next <Link> prefetch / soft navigation) can't follow a
      // cross-origin redirect (CORS). A real page load always asks for text/html;
      // anything else gets a plain 204 so Next falls back to a normal page load,
      // which then redirects properly.
      if (!(req.headers.get("accept") || "").includes("text/html")) {
        return new NextResponse(null, { status: 204 })
      }
      return NextResponse.redirect(`${MAIN_SITE_URL}${pathname}${search}`)
    }
    const res = NextResponse.next()
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    return res
  }

  if (host === MAIN_HOST && isAdminPath) {
    return NextResponse.redirect(`${ADMIN_SITE_URL}${pathname}${search}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
