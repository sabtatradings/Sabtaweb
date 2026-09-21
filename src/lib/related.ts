// Internal linking: connects product ranges to the buying guides that explain
// them (and back). Matching is keyword based on the live post text, so a post
// added later from the admin panel is linked automatically, with no mapping to
// maintain and no link ever pointing at a page that doesn't exist.

import type { BlogPost } from "./blog"
import type { CategoryMeta } from "./site-data"

// Regex sources, matched at a word start (case-insensitive).
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "hose-clips-clamps": ["hose clips?", "hose clamps?", "clamps?", "worm drive", "jubilee"],
  "banding-systems": ["banding", "buckles?", "strapping"],
  "rigging-hardware": ["rigging", "turnbuckles?", "wire rope", "shackles?", "thimbles?", "slings?"],
  "lifting-marine-hardware": ["lifting", "chains?", "g70", "g80", "shackles?", "marine", "hooks?", "eye bolts?"],
  "clips-pins": ["circlips?", "split pins?", "cotter", "clips?", "pins?"],
  "bolts-screws": ["bolts?", "screws?", "8\\.8", "10\\.9", "12\\.9", "threads?", "fasteners?"],
  nuts: ["nuts?", "nyloc", "lock nuts?"],
  washers: ["washers?"],
  "misc-hardware": ["grease", "workshop"],
}

const STOP = new Set(["with", "type", "steel", "stainless", "plain", "heavy", "duty", "pack", "size", "and", "the", "for"])

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const count = (text: string, re: RegExp) => (text.match(re) || []).length

function bodyText(post: BlogPost) {
  return post.body.map((b) => (b.type === "ul" ? b.items.join(" ") : b.text)).join(" ")
}

function scorePost(post: BlogPost, patterns: string[], weight = 1) {
  let total = 0
  const title = post.title
  const excerpt = post.excerpt
  const body = bodyText(post)
  for (const src of patterns) {
    const re = new RegExp(`\\b(?:${src})`, "gi")
    total += weight * (count(title, re) * 4 + count(excerpt, re) * 2 + Math.min(count(body, re), 5))
  }
  return total
}

/** Buying guides most relevant to a product range (and, optionally, one product). */
export function guidesFor(
  posts: BlogPost[],
  target: { categorySlug: string; productName?: string },
  limit = 3,
): BlogPost[] {
  const patterns = CATEGORY_KEYWORDS[target.categorySlug] ?? []
  const terms = (target.productName || "")
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .filter((w) => w.length >= 4 && !STOP.has(w))
    .map((w) => `${esc(w)}s?`)

  return posts
    .map((post) => ({ post, score: scorePost(post, patterns) + scorePost(post, terms, 2) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.post.publishedAt < b.post.publishedAt ? 1 : -1))
    .slice(0, limit)
    .map((x) => x.post)
}

/** Product ranges a guide is about, for a "Shop the ranges mentioned" block. */
export function rangesFor(post: BlogPost, categories: CategoryMeta[], limit = 4): CategoryMeta[] {
  return categories
    .map((c) => ({ c, score: scorePost(post, CATEGORY_KEYWORDS[c.slug] ?? []) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c)
}
