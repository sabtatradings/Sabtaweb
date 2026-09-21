// IndexNow: tells Bing, Yandex, Seznam, Naver and other participating search
// engines (and the AI products built on their indexes) that a page changed, the
// moment it is saved in the admin panel, instead of waiting for the next crawl.
// Google does not use IndexNow; it reads the sitemap.
//
// The key is not a secret: IndexNow requires it to be published at
// /<key>.txt on the site, which is how the receiving engine verifies that the
// submitter controls the domain (see public/90e9efbc1716399839714ac47ff4db68.txt).

import { MAIN_SITE_URL } from "./hosts"

export const INDEXNOW_KEY = "90e9efbc1716399839714ac47ff4db68"

const ENDPOINT = "https://api.indexnow.org/indexnow"

// Paths that are never worth submitting (admin, API, feeds, dynamic files).
const SKIP = /^\/(admin|api|_next)(\/|$)|\.(xml|txt)$/

let pending = new Set<string>()
let timer: ReturnType<typeof setTimeout> | null = null

async function flush() {
  const paths = [...pending]
  pending = new Set()
  timer = null
  if (paths.length === 0) return
  try {
    const host = new URL(MAIN_SITE_URL).host
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${MAIN_SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: paths.map((p) => `${MAIN_SITE_URL}${p}`),
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Best effort only: a failed ping must never affect an admin save.
  }
}

/** Queue a changed public path. Pings are batched so one save = one request. */
export function notifyIndexNow(path: string) {
  if (process.env.NODE_ENV !== "production" || process.env.INDEXNOW_DISABLED === "true") return
  if (!path.startsWith("/") || SKIP.test(path)) return
  pending.add(path)
  if (!timer) timer = setTimeout(() => void flush(), 400)
}
