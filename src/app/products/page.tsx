import type { Metadata } from "next"
import { ChevronRight, Download } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CategoryCard } from "@/components/category-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ProductsBrowser, type FlatItem } from "@/components/products-browser"
import { CtaBanner } from "@/components/home/cta-banner"
import { catalogPdfPath } from "@/lib/site-data"
import { JsonLd } from "@/components/json-ld"
import { getSiteConfig, getCategories, getAllCategoriesWithItems } from "@/lib/db"
import { buildMetadata } from "@/lib/seo"
import { graph, itemListNode, webPageNode } from "@/lib/structured-data"

export const revalidate = 30

export async function generateMetadata(): Promise<Metadata> {
  const [siteConfig, categories] = await Promise.all([
    getSiteConfig(),
    getCategories(),
  ])
  return buildMetadata(siteConfig, {
    title: "Fastener & Marine Hardware Catalogue, Dubai",
    description: `Browse all ${categories.length} fastener, rigging and marine hardware ranges from ${siteConfig.shortName} in Dubai, UAE: ${siteConfig.itemsInStock} items in 304/316 stainless and GI.`,
    path: "/products",
  })
}

export default async function ProductsPage() {
  const [siteConfig, categoriesWithItems] = await Promise.all([
    getSiteConfig(),
    getAllCategoriesWithItems(),
  ])

  const flatItems: FlatItem[] = categoriesWithItems.flatMap((cat) =>
    cat.items.map((item) => ({
      name: item.name,
      grade: item.grade,
      standard: item.standard,
      categorySlug: cat.slug,
      categoryName: cat.name,
      slug: item.slug,
      color: cat.color,
      icon: cat.icon,
    })),
  )

  const productsJsonLd = graph([
    webPageNode(siteConfig, {
      path: "/products",
      name: `${siteConfig.shortName} product catalogue`,
      description: `Fastener, rigging and marine hardware ranges stocked by ${siteConfig.name} in Dubai, UAE.`,
      type: "CollectionPage",
      extra: {
        mainEntity: itemListNode(
          siteConfig,
          categoriesWithItems.map((c) => ({ name: c.name, path: `/categories/${c.slug}`, image: c.image ?? c.items[0]?.image })),
          { name: "Product ranges" },
        ),
      },
    }),
  ])

  return (
    <>
      <JsonLd data={productsJsonLd} />
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-12">
          <p className="eyebrow !text-accent">Product Catalogue</p>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold uppercase tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            {siteConfig.itemsInStock} Items Across Our Ranges
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-primary-foreground/70 md:text-base">
            Every range below is stocked ready to ship from Dubai. Search for a specific product type, browse a range, or
            download the full 2026 catalogue.
          </p>
          <a
            href={catalogPdfPath}
            download="Sabta-Trading-Product-Catalog-2026.pdf"
            className="group relative mt-7 inline-flex h-13 items-center overflow-hidden rounded-xl border border-white/30 bg-white/10 px-7 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-primary"
          >
            <span className="mr-8 flex items-center gap-2.5 transition-opacity duration-500 group-hover:opacity-0">
              <Download className="size-4 shrink-0" aria-hidden="true" />
              Download Full Catalog (PDF)
            </span>
            <span className="absolute bottom-1 right-1 top-1 z-10 grid w-1/4 place-items-center rounded-md bg-white/20 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
              <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
            </span>
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:px-12">
        <Breadcrumbs crumbs={[{ label: "Products" }]} />

        <div className="mt-10">
          <ProductsBrowser items={flatItems} />
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {categoriesWithItems.map((cat, i) => (
            <ScrollReveal key={cat.slug} delay={i * 50} className="h-full">
              <CategoryCard category={cat} />
            </ScrollReveal>
          ))}
        </div>
      </div>

      <CtaBanner />
    </>
  )
}

