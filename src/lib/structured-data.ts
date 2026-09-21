// JSON-LD builders (schema.org). Every node has a stable @id so pages can
// reference the organisation / website / page instead of repeating them, which
// is what lets search engines and AI answer engines resolve "Sabta Trading Co.
// LLC" to one entity with one set of facts.
//
// Only facts that exist in the site's own data are emitted: no invented
// prices, ratings, opening hours or social profiles.

import type { CategoryMeta } from "./site-data"
import type { Product } from "./db"
import type { BlogPost } from "./blog"
import { absoluteUrl, brandFromNote } from "./seo"

export type LdSite = {
  name: string
  url: string
  description: string
  founded: number
  shortName?: string
  nameAr?: string
  tagline?: string
}

export type LdContact = {
  phone: string
  fax?: string
  poBox?: string
  address: string
  addressLocality: string
  addressCountry: string
  primaryEmail: string
  mapsPlaceUrl?: string
  lat: number
  lng: number
  contacts: { name: string; phone: string; email: string }[]
}

const base = (site: LdSite) => site.url.replace(/\/+$/, "")
export const orgId = (site: LdSite) => `${base(site)}/#organization`
export const websiteId = (site: LdSite) => `${base(site)}/#website`
export const pageId = (site: LdSite, path: string) => `${absoluteUrl(site.url, path)}#webpage`

export function graph(nodes: (object | null | undefined | false)[]) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) }
}

// ---------------------------------------------------------------------------
// Site-wide entities (rendered once in the root layout)
// ---------------------------------------------------------------------------

export function organizationNode(site: LdSite, contact: LdContact, categories: CategoryMeta[]) {
  const poBox = contact.poBox?.match(/\d{3,}/)?.[0]
  return {
    "@type": ["Organization", "HardwareStore"],
    "@id": orgId(site),
    name: site.name,
    legalName: site.name,
    alternateName: [site.shortName, site.nameAr].filter(Boolean),
    url: base(site),
    description: site.description,
    ...(site.tagline ? { slogan: site.tagline } : {}),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(site.url, "/brand/mark.png"),
      width: 540,
      height: 540,
    },
    image: [absoluteUrl(site.url, "/og/sabta-trading-og.jpg"), absoluteUrl(site.url, "/brand/logo.png")],
    foundingDate: String(site.founded),
    founder: { "@type": "Person", name: "Saifuddin Ismail", jobTitle: "Founder & Chairman" },
    telephone: contact.phone,
    ...(contact.fax ? { faxNumber: contact.fax } : {}),
    email: contact.primaryEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: contact.addressLocality,
      addressRegion: "Dubai",
      ...(poBox ? { postOfficeBoxNumber: poBox } : {}),
      addressCountry: contact.addressCountry,
    },
    geo: { "@type": "GeoCoordinates", latitude: contact.lat, longitude: contact.lng },
    ...(contact.mapsPlaceUrl ? { hasMap: contact.mapsPlaceUrl, sameAs: [contact.mapsPlaceUrl] } : {}),
    areaServed: { "@type": "Country", name: "United Arab Emirates" },
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer service", telephone: contact.phone, areaServed: "AE" },
      ...contact.contacts.map((c) => ({
        "@type": "ContactPoint",
        contactType: "sales",
        name: c.name,
        telephone: c.phone,
        email: c.email,
        areaServed: "AE",
      })),
    ],
    knowsAbout: [
      "Fasteners",
      "Marine rigging hardware",
      "Lifting hardware",
      "304 and 316 stainless steel fasteners",
      "Hose clips and clamps",
      ...categories.map((c) => c.name),
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${site.shortName || site.name} product ranges`,
      itemListElement: categories.map((c) => ({
        "@type": "OfferCatalog",
        name: c.name,
        url: absoluteUrl(site.url, `/categories/${c.slug}`),
      })),
    },
  }
}

export function websiteNode(site: LdSite) {
  return {
    "@type": "WebSite",
    "@id": websiteId(site),
    url: base(site),
    name: site.name,
    ...(site.shortName ? { alternateName: site.shortName } : {}),
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": orgId(site) },
  }
}

// ---------------------------------------------------------------------------
// Page-level nodes
// ---------------------------------------------------------------------------

export function webPageNode(
  site: LdSite,
  page: {
    path: string
    name: string
    description: string
    type?: string
    image?: string
    datePublished?: string
    dateModified?: string
    /** CSS selectors of the parts of the page suited to being read aloud / quoted by assistants. */
    speakable?: string[]
    extra?: Record<string, unknown>
  },
) {
  const url = absoluteUrl(site.url, page.path)
  return {
    "@type": page.type || "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.name,
    description: page.description,
    inLanguage: "en",
    isPartOf: { "@id": websiteId(site) },
    about: { "@id": orgId(site) },
    ...(page.image ? { primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(site.url, page.image) } } : {}),
    ...(page.datePublished ? { datePublished: page.datePublished } : {}),
    ...(page.dateModified ? { dateModified: page.dateModified } : {}),
    ...(page.speakable?.length ? { speakable: { "@type": "SpeakableSpecification", cssSelector: page.speakable } } : {}),
    ...page.extra,
  }
}

export function breadcrumbNode(site: LdSite, crumbs: { label: string; href?: string }[]) {
  const items = [{ label: "Home", href: "/" }, ...crumbs]
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      // The last crumb is the current page; Google lets it omit "item".
      ...(c.href && i < items.length - 1 ? { item: absoluteUrl(site.url, c.href) } : {}),
    })),
  }
}

export function faqEntities(faqs: { question: string; answer: string }[]) {
  return faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  }))
}

export function faqNode(site: LdSite, path: string, faqs: { question: string; answer: string }[]) {
  if (faqs.length === 0) return null
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(site.url, path)}#faq`,
    mainEntity: faqEntities(faqs),
  }
}

export function itemListNode(
  site: LdSite,
  items: { name: string; path: string; image?: string }[],
  opts: { name?: string } = {},
) {
  return {
    "@type": "ItemList",
    ...(opts.name ? { name: opts.name } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(site.url, it.path),
      name: it.name,
      ...(it.image ? { image: absoluteUrl(site.url, it.image) } : {}),
    })),
  }
}

export function productNode(
  site: LdSite,
  category: { slug: string; name: string; brandNote?: string },
  product: Product,
  images: string[],
) {
  const path = `/products/${category.slug}/${product.slug}`
  const url = absoluteUrl(site.url, path)
  const brand = brandFromNote(category.brandNote)
  const props = [
    product.grade ? { "@type": "PropertyValue", name: "Grade", value: product.grade } : null,
    product.standard ? { "@type": "PropertyValue", name: "Standard", value: product.standard } : null,
  ].filter(Boolean)

  // No `offers`/price block: Sabta is a request-a-quote distributor with no
  // listed prices, and Google's Product guidelines require a real price on any
  // `offers` entry, so inventing one would be inaccurate.
  return {
    "@type": "Product",
    "@id": `${url}#product`,
    url,
    name: product.name,
    description: product.description,
    ...(images.length > 0 ? { image: images.map((src) => absoluteUrl(site.url, src)) } : {}),
    category: category.name,
    // Only a manufacturer brand the catalogue actually names (e.g. Rubit); Sabta
    // is the distributor, so it is not claimed as the brand for every product.
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(props.length > 0 ? { additionalProperty: props } : {}),
    mainEntityOfPage: { "@id": `${url}#webpage` },
  }
}

const wordsIn = (post: BlogPost) =>
  post.body
    .map((b) => (b.type === "ul" ? b.items.join(" ") : b.text))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length

/** "6 min read" -> "PT6M" */
function isoDuration(readTime: string) {
  const m = readTime.match(/(\d+)/)
  return m ? `PT${m[1]}M` : undefined
}

export function blogPostingNode(site: LdSite, post: BlogPost) {
  const url = absoluteUrl(site.url, `/blog/${post.slug}`)
  const duration = isoDuration(post.readTime)
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    image: { "@type": "ImageObject", url: absoluteUrl(site.url, post.coverImage), caption: post.coverAlt },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Organization", "@id": orgId(site), name: site.name, url: base(site) },
    publisher: { "@id": orgId(site) },
    mainEntityOfPage: { "@id": `${url}#webpage` },
    articleSection: post.category,
    wordCount: wordsIn(post),
    inLanguage: "en",
    ...(duration ? { timeRequired: duration } : {}),
  }
}
