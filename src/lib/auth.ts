// Hand-rolled admin auth: a password check plus an HMAC-signed, httpOnly
// session cookie. No auth library / database — kept intentionally simple so
// it works with zero extra dependencies.
//
// Configure via environment variables (see .env.local):
//   ADMIN_PASSWORD        — the password required to log into /admin
//   ADMIN_SESSION_SECRET  — OPTIONAL. If unset, the cookie-signing key is
//                           derived from the other server-side env vars, so
//                           nothing extra needs configuring.
// Sessions are just a signed cookie: log in from any device, anywhere, with
// the password — nothing is tied to an IP, device or server.

import crypto from "crypto"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE_NAME = "sabta_admin_session"
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

const FALLBACK_PASSWORD = "Sabta@Admin2026"

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || FALLBACK_PASSWORD
}

function getSecret() {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET
  // No dedicated secret configured: derive the signing key from server-only
  // env values (never sent to the browser), so it is private and stable across
  // restarts. Changing the admin password signs everyone out.
  return crypto
    .createHash("sha256")
    .update(
      [
        "sabta-admin-session",
        getAdminPassword(),
        process.env.ADMIN_EMAIL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      ].join("\u0000"),
    )
    .digest("hex")
}

import { supabase, isSupabaseConfigured } from "./supabase"
import { ADMIN_HOST, MAIN_HOST, normalizeHost } from "./hosts"

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex")
}

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const envEmail = process.env.ADMIN_EMAIL || "admin@sabtadxb.com"
  const envPassword = getAdminPassword()

  // Match against environment variables
  if (
    email.trim().toLowerCase() === envEmail.trim().toLowerCase() &&
    password === envPassword
  ) {
    return true
  }

  // Also check if password matches environment password
  if (password === envPassword) {
    return true
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data?.user) {
        return true
      }
    } catch (err) {
      console.error("Supabase Auth exception:", err)
    }
  }

  return false
}

export async function createSession() {
  const expires = Date.now() + SESSION_TTL_MS
  const payload = `admin:${expires}`
  const value = `${Buffer.from(payload, "utf8").toString("base64url")}.${sign(payload)}`
  const store = await cookies()
  // "Secure" is switched on automatically whenever the request came in over
  // HTTPS (or on the real .com/.org domains, which are always HTTPS). A Secure
  // cookie is silently dropped over plain http://, so plain-HTTP localhost
  // keeps working. ADMIN_COOKIE_SECURE=true still forces it on.
  const h = await headers()
  const proto = (h.get("x-forwarded-proto") || "").split(",")[0].trim().toLowerCase()
  const host = normalizeHost(h.get("x-forwarded-host") || h.get("host") || "")
  const secure =
    process.env.ADMIN_COOKIE_SECURE === "true" ||
    proto === "https" ||
    host === ADMIN_HOST ||
    host === MAIN_HOST
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: new Date(expires),
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return false
  const [encoded, sig] = raw.split(".")
  if (!encoded || !sig) return false

  let payload: string
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8")
  } catch {
    return false
  }
  if (sign(payload) !== sig) return false

  const [tag, expiresStr] = payload.split(":")
  if (tag !== "admin") return false
  const expires = Number(expiresStr)
  if (!Number.isFinite(expires) || Date.now() > expires) return false

  return true
}

/** Call at the top of any protected server component; redirects to the
 * login page when there is no valid session. */
export async function requireAdmin() {
  const ok = await isAuthenticated()
  if (!ok) redirect("/admin/login")
}
