import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ProductCard } from "@/components/product-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { CtaBanner } from "@/components/home/cta-banner"
import { RelatedGuides } from "@/components/related-guides"
import { JsonLd } from "@/components/json-ld"
import { getSiteConfig, getCategories, getCategoryWithItems } from "@/lib/db"
import { buildMetadata, withCta } from "@/lib/seo"
import { readAllPosts } from "@/lib/blog"
import { guidesFor } from "@/lib/related"
import { graph, itemListNode, webPageNode } from "@/lib/structured-data"

export const revalidate = 30

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((cat) => ({ slug: cat.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [siteConfig, categories] = await Promise.all([
    getSiteConfig(),
    getCategories(),
  ])
  const category = categories.find((c) => c.slug === slug)
  if (!category) return {}
  const withItems = await getCategoryWithItems(slug)
  const image = category.image ?? withItems?.items.find((i) => i.image)?.image
  return buildMetadata(siteConfig, {
    title: `${category.name} in Dubai, UAE`,
    description: withCta(`${category.shortDescription} ${withItems?.items.length ?? 0} product types stocked by ${siteConfig.shortName} in Dubai, UAE.`, "Request a quote."),
    path: `/categories/${category.slug}`,
    image: image ? { url: image, alt: `${category.name} stocked by ${siteConfig.shortName}, Dubai` } : undefined,
  })
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [category, categories, posts] = await Promise.all([
    getCategoryWithItems(slug),
    getCategories(),
    readAllPosts(),
  ])

  if (!category) notFound()

  const others = categories.filter((c) => c.slug !== category.slug)
  const siteConfig = await getSiteConfig()
  const categoryJsonLd = graph([
    webPageNode(siteConfig, {
      path: `/categories/${category.slug}`,
      name: `${category.name} in Dubai, UAE`,
      description: category.description,
      type: "CollectionPage",
      image: category.image ?? category.items.find((i) => i.image)?.image,
      speakable: ["h1", "[data-speakable]"],
      extra: {
        mainEntity: itemListNode(
          siteConfig,
          category.items.map((i) => ({ name: i.name, path: `/products/${category.slug}/${i.slug}`, image: i.image })),
          { name: category.name },
        ),
      },
    }),
  ])

  return (
    <>
      <JsonLd data={categoryJsonLd} />
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 surface-grid opacity-[0.05]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 md:px-8 md:py-20 lg:px-12">
          <div>
            {category.brandNote && <p className="eyebrow !text-accent">{category.brandNote}</p>}
            <h1 className="text-balance text-2xl font-extrabold uppercase tracking-tight text-primary-foreground sm:text-3xl md:text-5xl">
              {category.name}
            </h1>
          </div>
          <p data-speakable className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-primary-foreground/75 md:text-base">{category.description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:px-12">
        <Breadcrumbs crumbs={[
          { label: "Products", href: "/products" },
          { label: category.name }
        ]} />

        <ScrollReveal>
          <div className="mt-10">
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">Product Types In This Range</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {category.items.length} product types, grades and standards as stocked. Confirm current availability with our sales team.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {category.items.map((item) => (
              <ProductCard key={item.id} item={item} color={category.color} icon={category.icon} />
            ))}
          </div>
        </ScrollReveal>

        <RelatedGuides posts={guidesFor(posts, { categorySlug: category.slug })} heading={`${category.name}: Buying Guides`} />

        <div className="mt-16 border-t border-border pt-12 md:mt-20">
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">Other Ranges</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.slice(0, 4).map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className="card-premium group flex items-center gap-3 p-4">
                <span className="text-sm font-bold leading-tight text-foreground">{cat.name}</span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-accent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <CtaBanner />
    </>
  )
}
