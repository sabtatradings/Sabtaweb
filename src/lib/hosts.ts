// Two domains, one codebase:
//   • PUBLIC_SITE_URL — the customer-facing website (default sabtadxb.com)
//   • ADMIN_SITE_URL  — the admin panel (default sabtadxb.org)
// The same build is deployed on both; src/proxy.ts decides what each host may
// serve. Any other host (localhost, Hostinger preview URLs) is left untouched.

const strip = (u: string) => u.replace(/\/+$/, "")

export const MAIN_SITE_URL = strip(process.env.PUBLIC_SITE_URL || "https://www.sabtadxb.com")
export const ADMIN_SITE_URL = strip(process.env.ADMIN_SITE_URL || "https://sabtadxb.org")

export function normalizeHost(host: string): string {
  return host.split(",")[0].trim().split(":")[0].toLowerCase().replace(/^www\./, "")
}

function hostOf(url: string): string {
  try {
    return normalizeHost(new URL(url).hostname)
  } catch {
    return ""
  }
}

export const MAIN_HOST = hostOf(MAIN_SITE_URL)
export const ADMIN_HOST = hostOf(ADMIN_SITE_URL)
