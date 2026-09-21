// Drop-in replacements for next/cache's revalidatePath / updateTag.
//
// The admin lives on its own domain (its own deployment, its own cache), so a
// plain revalidatePath/updateTag there would only refresh the admin's cache,
// not the public site's. When running on the admin host these also tell the
// public site to purge the same paths/tags via /api/revalidate. Everywhere
// else they behave exactly like the originals.

import { headers } from "next/headers"
import {
  revalidatePath as nextRevalidatePath,
  revalidateTag as nextRevalidateTag,
  updateTag as nextUpdateTag,
} from "next/cache"
import { ADMIN_HOST, MAIN_SITE_URL, normalizeHost } from "./hosts"
import { notifyIndexNow } from "./indexnow"

async function forward(payload: { paths?: string[]; tags?: string[] }) {
  try {
    const h = await headers()
    const host = normalizeHost(h.get("x-forwarded-host") || h.get("host") || "")
    if (host !== ADMIN_HOST) return
    await fetch(`${MAIN_SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    console.error("Public-site revalidation failed:", err)
  }
}

export function revalidatePath(path: string, type?: "page" | "layout") {
  nextRevalidatePath(path, type)
  void forward({ paths: [path] })
  notifyIndexNow(path)
}

export function updateTag(tag: string) {
  try {
    nextUpdateTag(tag)
  } catch {
    // updateTag only works inside Server Actions; the admin's plain-form save
    // endpoints are Route Handlers, where revalidateTag(…, expire: 0) is the
    // equivalent immediate purge.
    nextRevalidateTag(tag, { expire: 0 })
  }
  void forward({ tags: [tag] })
}
