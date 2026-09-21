// Helpers for the admin login/logout endpoints, which are plain HTML form
// POSTs answered with a 303 redirect (not server actions). The browser then
// does an ordinary full page load of the next page — no client-side router or
// RSC round trip — which is what makes sign-in / sign-out reliable behind
// Hostinger's proxy.

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { normalizeHost } from "./hosts"

/** Same-origin check for form posts (browsers always send Origin on POST). */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return true // non-browser client or very old browser
  let originHost: string
  try {
    originHost = normalizeHost(new URL(origin).host)
  } catch {
    return false
  }
  const host = normalizeHost(req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
  return originHost === host
}

/** 303 See Other to a same-site path (relative Location keeps whatever host
 * the visitor used). */
export function seeOther(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path, "Cache-Control": "no-store" },
  })
}
