import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_HOST, ADMIN_SITE_URL, MAIN_HOST, MAIN_SITE_URL, normalizeHost } from "@/lib/hosts"
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_SKEW_SECONDS,
  cookieOptions,
  isSecureRequest,
  jwtExpiry,
  refreshTokens,
} from "@/lib/admin-session"

// Host-based split of one deployment across two domains:
//   admin host (sabtadxb.org) -> only /admin/* (+ static assets); everything
//                                else bounces to the public site.
//   public host (sabtadxb.com) -> /admin/* bounces to the admin host.
// Other hosts (localhost, preview URLs) behave as before.

const STATIC_ASSET = /\.(png|jpe?g|webp|avif|svg|ico|gif|woff2?|css|js|map|mp4|webm)$/i

// Supabase access tokens are short-lived (about an hour). Server components
// can't set cookies, so the proxy quietly swaps in a fresh token pair (using
// the long-lived refresh token) just before the old one runs out. The new
// cookies are applied to this very request too, so the page that renders sees
// the fresh token, and to the response, so the browser keeps them.
async function nextWithSession(req: NextRequest, isAdminPath: boolean): Promise<NextResponse> {
  if (!isAdminPath) return NextResponse.next()

  const access = req.cookies.get(ACCESS_COOKIE)?.value
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value
  if (!refresh) return NextResponse.next()

  const exp = access ? jwtExpiry(access) : null
  const now = Math.floor(Date.now() / 1000)
  if (exp && exp - now > REFRESH_SKEW_SECONDS) return NextResponse.next()

  const result = await refreshTokens(refresh)

  if (result === null) return NextResponse.next() // Supabase unreachable: try again next request

  if (result === "invalid") {
    // Refresh token revoked/expired: drop the cookies so the login page shows.
    req.cookies.delete(ACCESS_COOKIE)
    req.cookies.delete(REFRESH_COOKIE)
    const res = NextResponse.next({ request: req })
    res.cookies.delete(ACCESS_COOKIE)
    res.cookies.delete(REFRESH_COOKIE)
    return res
  }

  const opts = cookieOptions(isSecureRequest(req.headers))
  req.cookies.set(ACCESS_COOKIE, result.access_token)
  req.cookies.set(REFRESH_COOKIE, result.refresh_token)
  const res = NextResponse.next({ request: req })
  res.cookies.set(ACCESS_COOKIE, result.access_token, opts)
  res.cookies.set(REFRESH_COOKIE, result.refresh_token, opts)
  return res
}

export async function proxy(req: NextRequest) {
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
    const res = await nextWithSession(req, isAdminPath)
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    return res
  }

  if (host === MAIN_HOST && isAdminPath) {
    return NextResponse.redirect(`${ADMIN_SITE_URL}${pathname}${search}`)
  }

  return nextWithSession(req, isAdminPath)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
