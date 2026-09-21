import { supabase, supabaseAdmin, isSupabaseConfigured } from "./supabase"
import { readAllProducts } from "./products"
import { unstable_cache } from "next/cache"
import { updateTag } from "./revalidate"
import {
  siteConfig as staticSiteConfig,
  contactInfo as staticContactInfo,
  industries as staticIndustries,
  categories as staticCategories,
  faqs as staticFaqs,
  type CategoryMeta,
} from "./site-data"

// Fallbacks for Chatbot (copied from chatbot-content.ts)
const staticChatbotContent = {
  fabLabel: "Open support chat",
  headerTitle: "Sabta Trading Assistant",
  headerStatus: "Online • Auto-Answers",
  closeLabel: "Close chat",
  inputPlaceholder: "Type your question...",
  sendLabel: "Send message",
  welcome: "Hi there! Welcome to Sabta Trading. I can quickly answer questions about quotes, delivery, our product ranges, location or contact details. Pick an option below or type your question!",
  welcomeWhatsApp: "💬 Chat on WhatsApp",
  menuPrompt: "Here are the quick topics you can choose from:",
  showMenu: "↩️ Show Main Menu",
  mainMenu: "↩️ Main Menu",
  fallback: "I couldn't quite match that with our standard FAQs. I'm the Sabta Trading auto-assistant. You can pick one of the topics below, or chat directly with our team on WhatsApp.",
  fallbackWhatsApp: "💬 Chat on WhatsApp",
  fallbackEmail: "✉️ Send an Email",
}

const staticQuickReplies = [
  {
    id: "quote",
    label: "📋 Request a Quote",
    question: "How can I request a quote for products?",
    answer: "You can request a quote in two easy ways:\n\n1. Browse our products, add the ones you need to your **Quote Cart** (the bag icon in the header), then submit the whole list at once.\n2. Send us your requirements directly via WhatsApp or email.",
    actions: [
      { label: "💬 WhatsApp Quote", href: "https://wa.me/971505649976?text=Hello%20Sabta%20Trading%2C%20I%20would%20like%20to%20request%20a%20quote.%20Here%20are%20my%20requirements%3A%20", external: true },
      { label: "✉️ Email Quote", href: "mailto:ali@sabtadxb.com?subject=Quote%20Request", external: true },
      { label: "🔍 Browse Products", href: "/products" },
    ],
  },
  {
    id: "delivery",
    label: "🚚 Delivery & Stock",
    question: "Do you deliver and what's your stock like?",
    answer: `Yes! We stock 16,000+ items across 9 ranges and can arrange delivery across the UAE. If something isn't in ready stock, our supplier network can usually source it, send us the spec and quantity for a quote.`,
    actions: [
      { label: "💬 Ask About Delivery", href: "https://wa.me/971505649976?text=Hello%20Sabta%20Trading%2C%20I%20have%20a%20question%20about%20delivery%20and%20stock%20availability.", external: true },
    ],
  },
  {
    id: "categories",
    label: "🛠️ Product Ranges",
    question: "What product ranges do you supply?",
    answer: "We supply 9 ranges of fastener and marine rigging hardware:\n\n• **Hose Clips & Clamps**\n• **Banding & Buckle Systems**\n• **Rigging Hardware**\n• **Lifting & Marine Hardware**\n• **Clips & Pins**\n• **Bolts & Screws**\n• **Nuts**\n• **Washers**\n• **Grease Fittings & Workshop Hardware**",
    actions: [
      { label: "Hose Clips & Clamps", href: "/categories/hose-clips-clamps" },
      { label: "Banding & Buckle Systems", href: "/categories/banding-systems" },
      { label: "Rigging Hardware", href: "/categories/rigging-hardware" },
      { label: "Lifting & Marine Hardware", href: "/categories/lifting-marine-hardware" },
      { label: "🔍 View All Products", href: "/products" },
    ],
  },
  {
    id: "location",
    label: "📍 Location & Hours",
    question: "Where are you located and what are your hours?",
    answer: `Our office is in **Dubai, United Arab Emirates**, P.O. Box 14684, Dubai, U.A.E..\n\nCall us on **+971 4 2210506** or reach out on WhatsApp to confirm stock and arrange collection or delivery.`,
    actions: [
      { label: "🗺️ Google Maps Location", href: "https://www.google.com/maps/place/SABTA+TRADING+CO+LLC/@25.2697884,55.3054345,17z/data=!3m1!4b1!4m6!3m5!1s0x3e5f43485ed1f901:0x5ff9a43521b4ec62!8m2!3d25.2697884!4d55.3054345!16s%2Fg%2F11bbwpk8pj", external: true },
      { label: "📞 Call Us", href: "tel:+97142210506", external: true },
    ],
  },
  {
    id: "contact",
    label: "📞 Contact Sales",
    question: "How can I reach your sales team?",
    answer: `You can reach the Sabta Trading sales team directly:\n\n• **Phone:** +971 4 2210506\n• **Email:** ali@sabtadxb.com\n• **Location:** Dubai, United Arab Emirates`,
    actions: [
      { label: "💬 WhatsApp Chat", href: "https://wa.me/971505649976?text=Hello%20Sabta%20Trading%2C%20I%20need%20assistance%20with%20a%20product%20enquiry.", external: true },
      { label: "📞 Call Now", href: "tel:+97142210506", external: true },
    ],
  },
]

export type Product = {
  id: string
  categorySlug: string
  slug: string
  name: string
  grade?: string
  standard?: string
  description: string
  image?: string
  images?: string[]
  featured?: boolean
  /** Included in the rotating 3D product carousel in the homepage hero. */
  heroCarousel?: boolean
  order: number
}

export type CategoryWithItems = CategoryMeta & { items: Product[] }

// -------------------------------------------------------------
// Site Settings Helpers
// -------------------------------------------------------------

// Cache tags let admin saves (see saveSetting/addProduct/etc. below) push
// fresh content out immediately via updateTag, while everyone else gets
// a cached, statically-servable page instead of a fresh Supabase round trip
// on every request (and every Next.js Link prefetch).
const CATEGORIES_TAG = "categories"
const PRODUCTS_TAG = "products"
const settingTag = (key: string) => `site-setting:${key}`

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured) return fallback
  try {
    const getCachedSetting = unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", key)
          .single()

        if (error || !data) return null
        return (data.value as T) ?? null
      },
      ["site-setting", key],
      { tags: [settingTag(key)], revalidate: 3600 },
    )
    const value = await getCachedSetting()
    return value === null ? fallback : value
  } catch (err) {
    console.error(`Error loading setting "${key}":`, err)
    return fallback
  }
}

export async function getSiteConfig() {
  return getSetting("site_config", staticSiteConfig)
}

export async function getContactInfo() {
  return getSetting("contact_info", staticContactInfo)
}

export async function getIndustries() {
  return getSetting("industries", staticIndustries)
}

export async function getFaqs() {
  return getSetting("faqs", staticFaqs)
}

export async function getChatbotContent() {
  return getSetting("chatbot_content", staticChatbotContent)
}

export async function getQuickReplies() {
  return getSetting("quick_replies", staticQuickReplies)
}

export async function saveSetting(key: string, value: any): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  try {
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) throw error
    updateTag(settingTag(key))
    return true
  } catch (err) {
    console.error(`Error saving setting "${key}":`, err)
    return false
  }
}

// -------------------------------------------------------------
// Categories Helpers
// -------------------------------------------------------------

const getCachedCategoryRows = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order")

    if (error || !data) throw error || new Error("No categories found")
    return data
  },
  ["categories"],
  { tags: [CATEGORIES_TAG], revalidate: 30 },
)

export async function getCategories(): Promise<CategoryMeta[]> {
  if (!isSupabaseConfigured) return staticCategories
  try {
    const data = await getCachedCategoryRows()
    return data.map((c) => ({
      slug: c.slug,
      name: c.name,
      shortDescription: c.short_description,
      description: c.description,
      icon: c.icon as any,
      color: c.color,
      brandNote: c.brand_note || undefined,
      pageRange: [c.page_range_start, c.page_range_end],
      image: c.image || undefined,
    }))
  } catch (err) {
    console.error("Error loading categories from Supabase:", err)
    return staticCategories
  }
}

export async function getCategoryMeta(slug: string): Promise<CategoryMeta | undefined> {
  const cats = await getCategories()
  return cats.find((c) => c.slug === slug)
}

// -------------------------------------------------------------
// Products Helpers
// -------------------------------------------------------------

const getCachedProductRows = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("order")

    if (error || !data) throw error
    return data
  },
  ["products"],
  { tags: [PRODUCTS_TAG], revalidate: 30 },
)

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return readAllProducts()
  try {
    const data = await getCachedProductRows()
    return data.map((p) => ({
      id: p.id,
      categorySlug: p.category_slug,
      slug: p.slug,
      name: p.name,
      grade: p.grade || undefined,
      standard: p.standard || undefined,
      description: p.description,
      image: p.image || undefined,
      images: p.images || [],
      featured: p.featured,
      heroCarousel: p.hero_carousel ?? false,
      order: p.order,
    }))
  } catch (err) {
    console.error("Error loading products from Supabase:", err)
    return readAllProducts()
  }
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const all = await getProducts()
  return all
    .filter((p) => p.categorySlug === categorySlug)
    .sort((a, b) => a.order - b.order)
}

export async function getProduct(categorySlug: string, slug: string): Promise<Product | undefined> {
  const all = await getProducts()
  return all.find((p) => p.categorySlug === categorySlug && p.slug === slug)
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const all = await getProducts()
  return all.find((p) => p.id === id)
}

export async function getCategoryWithItems(slug: string): Promise<CategoryWithItems | undefined> {
  const meta = await getCategoryMeta(slug)
  if (!meta) return undefined
  const items = await getProductsByCategory(slug)
  return { ...meta, items }
}

export async function getAllCategoriesWithItems(): Promise<CategoryWithItems[]> {
  const [categoriesList, productsList] = await Promise.all([
    getCategories(),
    getProducts(),
  ])

  return categoriesList.map((meta) => ({
    ...meta,
    items: productsList
      .filter((p) => p.categorySlug === meta.slug)
      .sort((a, b) => a.order - b.order),
  }))
}

const FEATURED_PRIORITY_CATEGORIES = ["rigging-hardware", "lifting-marine-hardware", "bolts-screws", "nuts", "washers"]

export async function getFeaturedProducts(limit = 10): Promise<Product[]> {
  const allProducts = await getProducts()
  const withImages = allProducts.filter((p) => !!p.image)
  const marked = withImages.filter((p) => p.featured)
  if (marked.length >= limit) return marked.slice(0, limit)

  const unmarked = withImages.filter((p) => !p.featured)
  const byCategory = new Map<string, Product[]>(
    FEATURED_PRIORITY_CATEGORIES.map((slug) => [slug, unmarked.filter((p) => p.categorySlug === slug).reverse()]),
  )

  const priorityPicks: Product[] = []
  let addedInRound = true
  while (addedInRound && marked.length + priorityPicks.length < limit) {
    addedInRound = false
    for (const slug of FEATURED_PRIORITY_CATEGORIES) {
      if (marked.length + priorityPicks.length >= limit) break
      const list = byCategory.get(slug)
      const next = list ? list.shift() : null
      if (next) {
        priorityPicks.push(next)
        addedInRound = true
      }
    }
  }

  const usedIds = new Set([...marked, ...priorityPicks].map((p) => p.id))
  const stillNeeded = limit - marked.length - priorityPicks.length
  const rest = stillNeeded > 0 ? [...unmarked].reverse().filter((p) => !usedIds.has(p.id)).slice(0, stillNeeded) : []

  return [...marked, ...priorityPicks, ...rest]
}

/**
 * Products hand-picked (via the `heroCarousel` admin checkbox) to appear in
 * the rotating 3D showcase in the homepage hero banner. Returns an empty
 * array when nothing is marked yet, so callers can fall back to a curated
 * default set rather than showing an empty carousel.
 */
export async function getHeroCarouselProducts(limit = 12): Promise<Product[]> {
  const all = await getProducts()
  return all.filter((p) => p.heroCarousel && !!p.image).slice(0, limit)
}

// -------------------------------------------------------------
// Products Write Operations (with fallbacks)
// -------------------------------------------------------------

import {
  addProduct as localAddProduct,
  updateProduct as localUpdateProduct,
  deleteProduct as localDeleteProduct,
  reorderCategory as localReorderCategory,
  slugify,
} from "./products"

function uniqueSlug(base: string, categorySlug: string, products: Product[], excludeId?: string) {
  const taken = new Set(
    products.filter((p) => p.categorySlug === categorySlug && p.id !== excludeId).map((p) => p.slug),
  )
  let slug = base || "product"
  let n = 2
  while (taken.has(slug)) {
    slug = `${base}-${n}`
    n += 1
  }
  return slug
}

export async function addProduct(input: {
  categorySlug: string
  name: string
  grade?: string
  standard?: string
  description: string
  image?: string
  featured?: boolean
  heroCarousel?: boolean
}): Promise<Product> {
  if (!isSupabaseConfigured) {
    return localAddProduct(input)
  }

  const products = await getProducts()
  const baseSlug = slugify(input.name)
  const slug = uniqueSlug(baseSlug, input.categorySlug, products)
  const id = `${input.categorySlug}--${slug}`
  const order = products.filter((p) => p.categorySlug === input.categorySlug).length

  const newProduct = {
    id,
    category_slug: input.categorySlug,
    slug,
    name: input.name.trim(),
    grade: input.grade?.trim() || null,
    standard: input.standard?.trim() || null,
    description: input.description.trim(),
    image: input.image || null,
    images: [],
    featured: input.featured ?? false,
    hero_carousel: input.heroCarousel ?? false,
    order,
  }

  try {
    const { error } = await supabaseAdmin.from("products").insert(newProduct)
    if (error) throw error
    updateTag(PRODUCTS_TAG)
    return {
      id,
      categorySlug: input.categorySlug,
      slug,
      name: input.name.trim(),
      grade: input.grade?.trim() || undefined,
      standard: input.standard?.trim() || undefined,
      description: input.description.trim(),
      image: input.image || undefined,
      images: [],
      featured: input.featured ?? false,
      heroCarousel: input.heroCarousel ?? false,
      order,
    }
  } catch (err) {
    console.error("Supabase addProduct failed, trying local fallback:", err)
    return localAddProduct(input)
  }
}

export async function updateProduct(id: string, patch: {
  categorySlug?: string
  name?: string
  grade?: string
  standard?: string
  description?: string
  image?: string
  featured?: boolean
  heroCarousel?: boolean
}): Promise<Product | null> {
  if (!isSupabaseConfigured) {
    return localUpdateProduct(id, patch)
  }

  const products = await getProducts()
  const idx = products.findIndex((p) => p.id === id)
  if (idx === -1) return null
  const current = products[idx]

  const categorySlug = patch.categorySlug ?? current.categorySlug
  let slug = current.slug
  let newId = current.id

  const nameChanged = patch.name !== undefined && patch.name.trim() !== current.name
  const categoryChanged = categorySlug !== current.categorySlug
  if (nameChanged || categoryChanged) {
    const baseSlug = slugify(patch.name ?? current.name)
    slug = uniqueSlug(baseSlug, categorySlug, products, current.id)
    newId = `${categorySlug}--${slug}`
  }

  const updatedRow: any = {}
  if (patch.categorySlug !== undefined || categoryChanged) updatedRow.category_slug = categorySlug
  if (nameChanged || categoryChanged) {
    updatedRow.slug = slug
    updatedRow.id = newId
  }
  if (patch.name !== undefined) updatedRow.name = patch.name.trim()
  if (patch.grade !== undefined) updatedRow.grade = patch.grade.trim() || null
  if (patch.standard !== undefined) updatedRow.standard = patch.standard.trim() || null
  if (patch.description !== undefined) updatedRow.description = patch.description.trim()
  if (patch.image !== undefined) updatedRow.image = patch.image || null
  if (patch.featured !== undefined) updatedRow.featured = patch.featured
  if (patch.heroCarousel !== undefined) updatedRow.hero_carousel = patch.heroCarousel
  if (categoryChanged) {
    updatedRow.order = products.filter((p) => p.categorySlug === categorySlug).length
  }

  try {
    // If the ID changed, we need to handle reference constraint cascade or insert/delete,
    // but in Supabase, since ID is the primary key and reference keys are set to ON UPDATE CASCADE/ON DELETE CASCADE,
    // wait, we can just update the primary key! PostgreSQL fully supports updating primary keys and cascading.
    const { error } = await supabaseAdmin
      .from("products")
      .update(updatedRow)
      .eq("id", id)

    if (error) throw error

    updateTag(PRODUCTS_TAG)

    return {
      ...current,
      id: newId,
      categorySlug,
      slug,
      name: patch.name !== undefined ? patch.name.trim() : current.name,
      grade: patch.grade !== undefined ? patch.grade.trim() || undefined : current.grade,
      standard: patch.standard !== undefined ? patch.standard.trim() || undefined : current.standard,
      description: patch.description !== undefined ? patch.description.trim() : current.description,
      image: patch.image !== undefined ? patch.image : current.image,
      featured: patch.featured !== undefined ? patch.featured : current.featured,
      heroCarousel: patch.heroCarousel !== undefined ? patch.heroCarousel : current.heroCarousel,
      order: categoryChanged ? updatedRow.order : current.order,
    }
  } catch (err) {
    console.error("Supabase updateProduct failed, trying local fallback:", err)
    return localUpdateProduct(id, patch)
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return localDeleteProduct(id)
  }

  try {
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id)
    if (error) throw error
    updateTag(PRODUCTS_TAG)
    return true
  } catch (err) {
    console.error("Supabase deleteProduct failed, trying local fallback:", err)
    return localDeleteProduct(id)
  }
}

export async function reorderCategory(categorySlug: string, orderedIds: string[]): Promise<void> {
  if (!isSupabaseConfigured) {
    return localReorderCategory(categorySlug, orderedIds)
  }

  try {
    const promises = orderedIds.map((id, index) =>
      supabaseAdmin
        .from("products")
        .update({ order: index })
        .eq("id", id)
    )
    const results = await Promise.all(promises)
    const error = results.find((r) => r.error)
    if (error) throw error.error
    updateTag(PRODUCTS_TAG)
  } catch (err) {
    console.error("Supabase reorderCategory failed, trying local fallback:", err)
    return localReorderCategory(categorySlug, orderedIds)
  }
}

// -------------------------------------------------------------
// Categories Write Operations
// -------------------------------------------------------------

export async function createCategory(input: {
  slug: string
  name: string
  shortDescription: string
  description: string
  icon: string
  color: string
  brandNote?: string
  pageRangeStart: number
  pageRangeEnd: number
  image?: string
}): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase is not configured, cannot write category locally.")
    return false
  }

  try {
    const categoriesList = await getCategories()
    const order = categoriesList.length

    const { error } = await supabaseAdmin.from("categories").insert({
      slug: input.slug,
      name: input.name,
      short_description: input.shortDescription,
      description: input.description,
      icon: input.icon,
      color: input.color,
      brand_note: input.brandNote || null,
      page_range_start: input.pageRangeStart,
      page_range_end: input.pageRangeEnd,
      image: input.image || null,
      order,
    })
    if (error) throw error
    updateTag(CATEGORIES_TAG)
    return true
  } catch (err) {
    console.error("Supabase createCategory failed:", err)
    return false
  }
}

export async function updateCategory(slug: string, data: {
  name: string
  shortDescription: string
  description: string
  icon: string
  color: string
  brandNote?: string
  pageRangeStart: number
  pageRangeEnd: number
  image?: string
}): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase is not configured, cannot update category locally.")
    return false
  }

  try {
    const { error } = await supabaseAdmin
      .from("categories")
      .update({
        name: data.name,
        short_description: data.shortDescription,
        description: data.description,
        icon: data.icon,
        color: data.color,
        brand_note: data.brandNote || null,
        page_range_start: data.pageRangeStart,
        page_range_end: data.pageRangeEnd,
        image: data.image || null,
      })
      .eq("slug", slug)

    if (error) throw error
    updateTag(CATEGORIES_TAG)
    return true
  } catch (err) {
    console.error("Supabase updateCategory failed:", err)
    return false
  }
}

export async function deleteCategory(slug: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase is not configured, cannot delete category locally.")
    return false
  }

  try {
    const { error } = await supabaseAdmin.from("categories").delete().eq("slug", slug)
    if (error) throw error
    updateTag(CATEGORIES_TAG)
    return true
  } catch (err) {
    console.error("Supabase deleteCategory failed:", err)
    return false
  }
}

export async function reorderCategories(orderedSlugs: string[]): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const promises = orderedSlugs.map((slug, index) =>
      supabaseAdmin
        .from("categories")
        .update({ order: index })
        .eq("slug", slug)
    )
    const results = await Promise.all(promises)
    const error = results.find((r) => r.error)
    if (error) throw error.error
    updateTag(CATEGORIES_TAG)
  } catch (err) {
    console.error("Supabase reorderCategories failed:", err)
  }
}

import { testimonials as staticTestimonials } from "./site-data"

export async function getTestimonials(): Promise<any[]> {
  return getSetting("testimonials", staticTestimonials)
}


