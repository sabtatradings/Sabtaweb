import type { Metadata } from "next"
import { Hero } from "@/components/home/hero"
import { TrustBadges } from "@/components/home/trust-badges"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedProducts } from "@/components/home/featured-products"
import { StatsCounter } from "@/components/home/stats-counter"
import { WhyChooseUs } from "@/components/home/why-choose-us"
import { Industries } from "@/components/home/industries"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { CtaBanner } from "@/components/home/cta-banner"
import { HomeFaq } from "@/components/home/home-faq"
import { JsonLd } from "@/components/json-ld"
import { getAllCategoriesWithItems, getFeaturedProducts, getSiteConfig, getTestimonials, getFaqs } from "@/lib/db"
import { buildMetadata } from "@/lib/seo"
import { faqNode, graph, itemListNode, webPageNode } from "@/lib/structured-data"

export const revalidate = 30

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig()
  return buildMetadata(siteConfig, {
    title: `Fastener & Marine Rigging Hardware in Dubai | ${siteConfig.shortName}`,
    absoluteTitle: true,
    description: `Dubai fastener & marine rigging hardware distributor since ${siteConfig.founded}. ${siteConfig.itemsInStock} items in stock in 304/316 stainless, GI and 8.8–12.9 grades. Request a quote.`,
    path: "/",
  })
}

export default async function HomePage() {
  const [categories, featuredProducts, testimonials, faqs, siteConfig] = await Promise.all([
    getAllCategoriesWithItems(),
    getFeaturedProducts(),
    getTestimonials(),
    getFaqs(),
    getSiteConfig(),
  ])

  // The homepage FAQ block shows the first five questions; the schema must
  // describe exactly what is visible on the page.
  const homeFaqs = faqs.slice(0, 5)
  const homeJsonLd = graph([
    webPageNode(siteConfig, {
      path: "/",
      name: `${siteConfig.name} | ${siteConfig.tagline}`,
      description: siteConfig.description,
      image: "/og/sabta-trading-og.jpg",
      speakable: ["h1", "[data-speakable]"],
    }),
    itemListNode(
      siteConfig,
      categories.map((c) => ({ name: c.name, path: `/categories/${c.slug}`, image: c.image ?? c.items[0]?.image })),
      { name: "Product ranges" },
    ),
    faqNode(siteConfig, "/", homeFaqs),
  ])

  return (
    <>
      <JsonLd data={homeJsonLd} />
      <Hero />
      <TrustBadges />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={featuredProducts} />
      <StatsCounter />
      <WhyChooseUs />
      <Industries />

      <TestimonialsSection
        title="What Our Clients Say"
        description="Hear from procurement managers and contractors who trust Sabta Trading."
        testimonials={testimonials}
      />
      <HomeFaq faqs={faqs} />
      <CtaBanner />
    </>
  )
}

