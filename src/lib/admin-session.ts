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
  is_anonymous?: boolean | null
  app_metadata?: Record<string, unknown> | null
}

let signupCache: { value: boolean; at: number } | null = null
const SIGNUP_CACHE_MS = 60_000

/** True when "Allow new users to sign up" is switched OFF in the Supabase
 * dashboard (Authentication > Sign In / Providers). Then the only accounts
 * that exist are the ones the project owner created by hand, so any of them
 * may sign in to the admin panel. Read live from Supabase's public settings
 * endpoint — no env var involved. */
export async function signupsDisabled(fresh = false): Promise<boolean> {
  const cfg = supabaseAuthConfig()
  if (!cfg) return false
  if (!fresh && signupCache && Date.now() - signupCache.at < SIGNUP_CACHE_MS) return signupCache.value
  try {
    const res = await fetch(`${cfg.url}/auth/v1/settings`, {
      headers: { apikey: cfg.anon },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return false
    const json = await res.json()
    const value = json?.disable_signup === true
    signupCache = { value, at: Date.now() }
    return value
  } catch {
    return false
  }
}

/** Who may use the admin panel — decided by Supabase alone:
 *   1. Sign-ups are turned off in Supabase (the default setup: you create the
 *      admin user by hand in the dashboard), so every account that can sign in
 *      is one you created; or
 *   2. the user has `app_metadata.role = "admin"` (only settable server-side),
 *      which keeps working even if sign-ups are open; or
 *   3. optionally, the email is listed in the ADMIN_EMAIL env var. Not needed.
 * If sign-ups are open and none of the above applies, nobody gets in — a
 * random visitor could otherwise register an account and walk in. */
export async function isAllowedAdmin(
  user: AdminLike | null | undefined,
  opts: { fresh?: boolean } = {},
): Promise<boolean> {
  if (!user || user.is_anonymous) return false
  if (user.app_metadata?.role === "admin") return true
  const email = (user.email || "").trim().toLowerCase()
  if (!email) return false
  if (user.email_confirmed_at) {
    const allowed = (process.env.ADMIN_EMAIL || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    if (allowed.includes(email)) return true
  }
  return signupsDisabled(opts.fresh)
}
