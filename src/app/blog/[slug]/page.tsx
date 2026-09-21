import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { BlogPostCard } from "@/components/blog-post-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { CtaBanner } from "@/components/home/cta-banner"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { JsonLd } from "@/components/json-ld"
import { getCategories, getSiteConfig } from "@/lib/db"
import { getPost, getRelatedPosts, readAllPosts, type BlogContentBlock } from "@/lib/blog"
import { buildMetadata, snippet } from "@/lib/seo"
import { rangesFor } from "@/lib/related"
import { blogPostingNode, graph, webPageNode } from "@/lib/structured-data"

export async function generateStaticParams() {
  return (await readAllPosts()).map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [post, siteConfig] = await Promise.all([getPost(slug), getSiteConfig()])
  if (!post) return {}
  return buildMetadata(siteConfig, {
    title: post.title,
    description: snippet(post.excerpt),
    path: `/blog/${post.slug}`,
    image: { url: post.coverImage, alt: post.coverAlt },
    type: "article",
    publishedTime: post.publishedAt,
    section: post.category,
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function ContentBlock({ block }: { block: BlogContentBlock }) {
  if (block.type === "h2") {
    return <h2 className="mt-10 text-xl font-extrabold uppercase tracking-tight text-foreground first:mt-0 md:text-2xl">{block.text}</h2>
  }
  if (block.type === "ul") {
    return (
      <ul className="mt-4 flex flex-col gap-2.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground md:text-base">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  }
  return <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">{block.text}</p>
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const [siteConfig, related, categories] = await Promise.all([getSiteConfig(), getRelatedPosts(slug, 3), getCategories()])
  const ranges = rangesFor(post, categories)

  const articleJsonLd = graph([
    webPageNode(siteConfig, {
      path: `/blog/${post.slug}`,
      name: post.title,
      description: post.excerpt,
      type: "WebPage",
      image: post.coverImage,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      speakable: ["h1", "[data-speakable]"],
      extra: { mainEntity: { "@id": `${siteConfig.url.replace(/\/+$/, "")}/blog/${post.slug}#article` } },
    }),
    blogPostingNode(siteConfig, post),
  ])

  return (
    <>
      <JsonLd data={articleJsonLd} />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-14 lg:px-12">
        <Breadcrumbs crumbs={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

        <ScrollReveal>
          <div className="mt-6 flex flex-wrap items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            <span>{post.category}</span>
            <span className="text-border" aria-hidden="true">
              &middot;
            </span>
            <time dateTime={post.publishedAt} className="text-muted-foreground">
              {formatDate(post.publishedAt)}
            </time>
            <span className="text-border" aria-hidden="true">
              &middot;
            </span>
            <span className="text-muted-foreground">{post.readTime}</span>
          </div>

          <h1 className="mt-4 text-balance text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {post.title}
          </h1>

          <p data-speakable className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>

          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-white">
            <Image src={post.coverImage} alt={post.coverAlt} fill sizes="(min-width: 768px) 720px, 100vw" className="object-contain p-10" priority />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <article className="mt-2">
            {post.body.map((block, i) => (
              <ContentBlock key={i} block={block} />
            ))}
          </article>
        </ScrollReveal>

        {ranges.length > 0 && (
          <div className="mt-14 rounded-2xl border border-border bg-secondary/40 p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">Ranges mentioned in this guide</h2>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {ranges.map((range) => (
                <li key={range.slug}>
                  <Link
                    href={`/categories/${range.slug}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    {range.name}
                    <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-16 border-t border-border pt-12 md:mt-20">
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">More From the Blog</h2>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <BlogPostCard key={item.slug} post={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      <CtaBanner />
    </>
  )
}
