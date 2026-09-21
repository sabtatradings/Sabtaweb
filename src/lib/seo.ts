// Shared SEO helpers: one place that builds page metadata (title, description,
// canonical, Open Graph, Twitter) so every page is consistent and none of them
// accidentally drops the social image the way a page-level `openGraph` object
// otherwise would (Next.js replaces, not merges, nested metadata objects).

import type { Metadata } from "next"

export const DEFAULT_OG_IMAGE = {
  path: "/og/sabta-trading-og.jpg",
  width: 1200,
  height: 630,
  alt: "Sabta Trading Co. LLC: fastener and marine rigging hardware, Dubai UAE",
}

export type SeoSite = { name: string; url: string }

export function absoluteUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`
}

/** Trim to a search-result-snippet length at a word boundary. */
export function snippet(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${base.replace(/[\s,;:–—-]+$/, "")}…`
}

/** `text` plus a call to action, or just `text` (trimmed) when both don't fit. */
export function withCta(text: string, cta: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim()
  const full = `${t} ${cta}`
  return full.length <= max ? full : snippet(t, max)
}

export type PageSeo = {
  /** Page title. The site name is appended by the root title template unless `absoluteTitle` is set. */
  title: string
  absoluteTitle?: boolean
  description: string
  /** Path of this page, e.g. "/products/nuts". Becomes the canonical URL. */
  path: string
  image?: { url: string; alt?: string; width?: number; height?: number }
  type?: "website" | "article"
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  noindex?: boolean
}

// Search results cut titles at roughly 60 characters. The root template
// appends " | Sabta Trading" (16 chars), so a page title longer than this would
// be truncated mid-word; those go out without the suffix instead.
const MAX_TITLE_WITH_SUFFIX = 49

export function buildMetadata(site: SeoSite, input: PageSeo): Metadata {
  const page: PageSeo = {
    ...input,
    description: snippet(input.description, 160),
    absoluteTitle: input.absoluteTitle || input.title.length > MAX_TITLE_WITH_SUFFIX,
  }
  const canonical = absoluteUrl(site.url, page.path)
  const socialTitle = page.absoluteTitle ? page.title : `${page.title} | ${site.name}`
  type OgImage = { url: string; alt?: string; width?: number; height?: number }
  const image: OgImage = page.image
    ? { ...page.image, url: absoluteUrl(site.url, page.image.url) }
    : { ...DEFAULT_OG_IMAGE, url: absoluteUrl(site.url, DEFAULT_OG_IMAGE.path) }
  const ogImage = {
    url: image.url,
    alt: image.alt || page.title,
    ...(image.width && image.height ? { width: image.width, height: image.height } : {}),
  }

  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical },
    ...(page.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: socialTitle,
      description: page.description,
      url: canonical,
      siteName: site.name,
      locale: "en_AE",
      type: page.type ?? "website",
      images: [ogImage],
      ...(page.type === "article"
        ? {
            publishedTime: page.publishedTime,
            modifiedTime: page.modifiedTime ?? page.publishedTime,
            section: page.section,
            tags: page.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: page.description,
      images: [ogImage.url],
    },
  }
}

/** "Rubit Brand" -> "Rubit" (categories that carry a manufacturer brand note). */
export function brandFromNote(note?: string): string | null {
  if (!note) return null
  const m = note.match(/^(.+?)\s+brand$/i)
  return m ? m[1].trim() : null
}

/** Strip characters that would break out of a JSON-LD script tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(new RegExp("[\\u2028\\u2029]", "g"), "")
}
