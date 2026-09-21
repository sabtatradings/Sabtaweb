// Admin auth, powered by Supabase Authentication (email + password).
//
// Create your admin user in the Supabase dashboard (Authentication → Users →
// Add user), then either
//   - list that email in the ADMIN_EMAIL env var (comma-separated for several), or
//   - give the user `app_metadata.role = "admin"` (see README / SQL below).
//
//   update auth.users
//     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
//     where email = 'you@example.com';
//
// Sessions are the Supabase access + refresh tokens stored in httpOnly cookies
// (see admin-session.ts). Nothing is tied to an IP, device or server, so you can
// log in from anywhere, on any device. The access token is validated by
// Supabase on every request, and refreshed automatically by proxy.ts.

import { cache } from "react"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient, type Session } from "@supabase/supabase-js"
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  isAllowedAdmin,
  isSecureRequest,
  supabaseAuthConfig,
} from "./admin-session"

export type AdminUser = { id: string; email: string }
export type SignInResult = "ok" | "invalid" | "denied" | "limited" | "unavailable"

function statelessClient() {
  const cfg = supabaseAuthConfig()
  if (!cfg) return null
  return createClient(cfg.url, cfg.anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

// --- tiny in-process brute-force guard (Supabase also rate-limits sign-ins) --
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 10
const attempts = new Map<string, { count: number; reset: number }>()

function tooManyAttempts(key: string) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now > entry.reset) {
    attempts.set(key, { count: 1, reset: now + ATTEMPT_WINDOW_MS })
    if (attempts.size > 5000) {
      for (const [k, v] of attempts) if (now > v.reset) attempts.delete(k)
    }
    return false
  }
  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

async function setSessionCookies(session: Pick<Session, "access_token" | "refresh_token">) {
  const store = await cookies()
  const secure = isSecureRequest(await headers())
  const opts = cookieOptions(secure)
  store.set(ACCESS_COOKIE, session.access_token, opts)
  store.set(REFRESH_COOKIE, session.refresh_token, opts)
}

export async function signInAdmin(email: string, password: string): Promise<SignInResult> {
  const client = statelessClient()
  if (!client) return "unavailable"

  const h = await headers()
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown"
  if (tooManyAttempts(ip)) return "limited"

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error || !data.session || !data.user) {
    const status = error?.status ?? 0
    if (status === 429) return "limited"
    if (error?.name === "AuthRetryableFetchError" || status >= 500) return "unavailable"
    return "invalid"
  }

  if (!isAllowedAdmin(data.user)) {
    // Valid Supabase account, but not an admin: don't keep the session around.
    await client.auth.signOut({ scope: "local" }).catch(() => {})
    return "denied"
  }

  await setSessionCookies(data.session)
  return "ok"
}

export async function signOutAdmin() {
  const store = await cookies()
  const access = store.get(ACCESS_COOKIE)?.value
  const cfg = supabaseAuthConfig()
  if (access && cfg) {
    // Best effort: revoke this device's session at Supabase (other devices
    // stay signed in).
    try {
      await fetch(`${cfg.url}/auth/v1/logout?scope=local`, {
        method: "POST",
        headers: { apikey: cfg.anon, Authorization: `Bearer ${access}` },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      })
    } catch {
      // ignore — cookies are cleared below regardless
    }
  }
  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
}

/** The signed-in admin, or null. Supabase validates the token on every call,
 * so a revoked or deleted user loses access immediately. */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies()
  const token = store.get(ACCESS_COOKIE)?.value
  if (!token) return null
  const client = statelessClient()
  if (!client) return null
  try {
    const { data, error } = await client.auth.getUser(token)
    if (error || !data.user) return null
    if (!isAllowedAdmin(data.user)) return null
    return { id: data.user.id, email: data.user.email || "" }
  } catch {
    return null
  }
})

export async function isAuthenticated(): Promise<boolean> {
  return (await getAdminUser()) !== null
}

/** Call at the top of any protected server component or action; redirects to
 * the login page when there is no valid admin session. */
export async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) redirect("/admin/login")
  return user
}
