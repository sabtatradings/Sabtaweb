import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { FaqAccordion } from "@/components/faq-accordion"
import { CtaBanner } from "@/components/home/cta-banner"
import { JsonLd } from "@/components/json-ld"
import { getSiteConfig, getFaqs } from "@/lib/db"
import { buildMetadata } from "@/lib/seo"
import { faqEntities, graph, webPageNode } from "@/lib/structured-data"

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig()
  return buildMetadata(siteConfig, {
    title: "FAQ: Stock, Grades, Sourcing & Quotes",
    description: `Answers about ${siteConfig.name}: 304/316 stainless stock, sourcing items not on the shelf, delivery, collection and how to request a quote in Dubai.`,
    path: "/faq",
  })
}

export default async function FaqPage() {
  const [siteConfig, faqs] = await Promise.all([
    getSiteConfig(),
    getFaqs(),
  ])

  const faqJsonLd = graph([
    webPageNode(siteConfig, {
      path: "/faq",
      name: "Frequently asked questions",
      description: `Answers about stock, grades, sourcing and quotes from ${siteConfig.name}, Dubai.`,
      type: "FAQPage",
      speakable: ["h1", "[data-speakable]"],
      extra: { mainEntity: faqEntities(faqs) },
    }),
  ])

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-12">
          <p className="eyebrow !text-accent">Support</p>
          <h1 className="mt-4 text-balance text-3xl font-extrabold uppercase tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            Frequently Asked Questions
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-20 lg:px-12">
        <Breadcrumbs crumbs={[{ label: "FAQ" }]} />
        <div data-speakable className="mt-10">
          <FaqAccordion faqs={[...faqs]} />
        </div>
      </div>

      <CtaBanner />
    </>
  )
}

