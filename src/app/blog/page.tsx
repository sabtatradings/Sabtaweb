import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { BlogPostCard } from "@/components/blog-post-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { CtaBanner } from "@/components/home/cta-banner"
import { JsonLd } from "@/components/json-ld"
import { getSiteConfig } from "@/lib/db"
import { readAllPosts } from "@/lib/blog"
import { buildMetadata } from "@/lib/seo"
import { graph, itemListNode, webPageNode } from "@/lib/structured-data"

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig()
  const meta = buildMetadata(siteConfig, {
    title: "Fastener & Marine Rigging Guides",
    description: `Buying guides and technical explainers on bolt grades, 304 vs 316 stainless, shackles, chain and hose clips from ${siteConfig.name}, Dubai.`,
    path: "/blog",
  })
  return {
    ...meta,
    alternates: { ...meta.alternates, types: { "application/rss+xml": `${siteConfig.url}/blog/feed.xml` } },
  }
}

export default async function BlogIndexPage() {
  const [posts, siteConfig] = await Promise.all([readAllPosts(), getSiteConfig()])

  const blogJsonLd = graph([
    webPageNode(siteConfig, {
      path: "/blog",
      name: `${siteConfig.shortName} blog`,
      description: `Buying guides and technical explainers on fasteners and marine rigging hardware from ${siteConfig.name}.`,
      type: "CollectionPage",
      speakable: ["h1", "[data-speakable]"],
      extra: {
        mainEntity: {
          ...itemListNode(
            siteConfig,
            posts.map((p) => ({ name: p.title, path: `/blog/${p.slug}`, image: p.coverImage })),
            { name: "Articles" },
          ),
        },
      },
    }),
  ])

  return (
    <>
      <JsonLd data={blogJsonLd} />
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-12">
          <p className="eyebrow !text-accent">Resources</p>
          <h1 className="mt-4 text-balance text-3xl font-extrabold uppercase tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            The Sabta Trading Blog
          </h1>
          <p data-speakable className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-primary-foreground/80 md:text-base">
            Buying guides and technical explainers on fastener grades, materials and marine rigging hardware — written by
            the same team that stocks and ships it.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-20 lg:px-12">
        <Breadcrumbs crumbs={[{ label: "Blog" }]} />

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No articles published yet — check back soon.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <ScrollReveal key={post.slug} delay={(i % 3) * 80}>
                <BlogPostCard post={post} priority={i < 3} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      <CtaBanner />
    </>
  )
}
