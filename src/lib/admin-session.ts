// Shared plumbing for the admin session, used by both `auth.ts` (server
// components / actions) and `proxy.ts`. It must stay free of `next/headers`
// and `next/navigation` imports so the proxy can use it too.
//
// Sign-in is handled by Supabase Auth (email + password). The Supabase access
// token (a short-lived JWT) and refresh token are kept in httpOnly cookies, so
// an admin can sign in from any device and stay signed in until they log out.

import { ADMIN_HOST, MAIN_HOST, normalizeHost } from "./hosts"

export const ACCESS_COOKIE = "sabta_sb_access"
export const REFRESH_COOKIE = "sabta_sb_refresh"

/** Cookies live 30 days; the access token inside is refreshed automatically. */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/** Refresh the access token when it has less than this many seconds left. */
export const REFRESH_SKEW_SECONDS = 90

export type TokenPair = {
  access_token: string
  refresh_token: string
}

export function supabaseAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  return { url: url.replace(/\/+$/, ""), anon }
}

/** Seconds-since-epoch expiry of a JWT, or null if it can't be read. (Only
 * used to decide *when to refresh*; trust is always decided by Supabase.) */
export function jwtExpiry(token: string): number | null {
  try {
    const part = token.split(".")[1]
    if (!part) return null
    const json = JSON.parse(Buffer.from(part, "base64url").toString("utf8"))
    return typeof json.exp === "number" ? json.exp : null
  } catch {
    return null
  }
}

/** "Secure" cookies are switched on automatically when the request came in
 * over HTTPS (or on the real .com/.org domains, which are always HTTPS). A
 * Secure cookie is silently dropped over plain http://, so plain-HTTP
 * localhost keeps working. */
export function isSecureRequest(h: { get(name: string): string | null }) {
  if (process.env.ADMIN_COOKIE_SECURE === "true") return true
  const proto = (h.get("x-forwarded-proto") || "").split(",")[0].trim().toLowerCase()
  if (proto === "https") return true
  const host = normalizeHost(h.get("x-forwarded-host") || h.get("host") || "")
  return host === ADMIN_HOST || host === MAIN_HOST
}

export function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  }
}

/** Exchange a refresh token for a new token pair.
 *  - a TokenPair on success
 *  - "invalid" when Supabase says the refresh token is no longer good
 *  - null when Supabase couldn't be reached (try again later, keep cookies) */
export async function refreshTokens(refreshToken: string): Promise<TokenPair | "invalid" | null> {
  const cfg = supabaseAuthConfig()
  if (!cfg) return null
  try {
    const res = await fetch(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: cfg.anon, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) {
      const json = await res.json()
      if (json?.access_token && json?.refresh_token) {
        return { access_token: json.access_token, refresh_token: json.refresh_token }
      }
      return "invalid"
    }
    return res.status >= 500 || res.status === 429 ? null : "invalid"
  } catch {
    return null
  }
}

type AdminLike = {
  email?: string | null
  email_confirmed_at?: string | null
  app_metadata?: Record<string, unknown> | null
}

/** A Supabase user is an admin if EITHER
 *   - their `app_metadata.role` is "admin" (only settable server-side, never
 *     by the user themselves), or
 *   - their confirmed email is listed in the ADMIN_EMAIL env var
 *     (comma-separated for several admins).
 * This means merely having a Supabase account is never enough, even if public
 * sign-ups are switched on. */
export function isAllowedAdmin(user: AdminLike | null | undefined): boolean {
  if (!user) return false
  if (user.app_metadata?.role === "admin") return true
  const email = (user.email || "").trim().toLowerCase()
  if (!email || !user.email_confirmed_at) return false
  const allowed = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email)
}
