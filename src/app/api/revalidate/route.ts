import { NextResponse, type NextRequest } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

// Called by the admin deployment (sabtadxb.org) after every content change so
// the public site's cached pages/data refresh immediately.
//
// No secret: this only purges cache (never reads or writes content), accepts
// nothing but known tag names and plain site paths, and is rate-limited, so
// the worst a stranger can do is make the site re-fetch a page early.

const TAG_OK = /^(categories|products|site-setting:[\w.-]{1,80})$/
const PATH_OK = /^\/[a-z0-9\-_/.]{0,200}$/i
const LIMIT_PER_MIN = 120

let windowStart = 0
let hits = 0

function rateLimited() {
  const now = Date.now()
  if (now - windowStart > 60_000) {
    windowStart = now
    hits = 0
  }
  return ++hits > LIMIT_PER_MIN
}

export async function POST(req: NextRequest) {
  if (rateLimited()) return NextResponse.json({ error: "slow down" }, { status: 429 })

  let body: { paths?: unknown; tags?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 })
  }

  const tags = (Array.isArray(body.tags) ? body.tags : [])
    .filter((t): t is string => typeof t === "string" && TAG_OK.test(t))
    .slice(0, 20)
  const paths = (Array.isArray(body.paths) ? body.paths : [])
    .filter((p): p is string => typeof p === "string" && PATH_OK.test(p))
    .slice(0, 30)

  for (const t of tags) revalidateTag(t, { expire: 0 })
  for (const p of paths) revalidatePath(p)

  return NextResponse.json({ ok: true, tags, paths })
}
