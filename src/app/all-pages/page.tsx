import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { getAllCategoriesWithItems, getSiteConfig } from "@/lib/db"
import { readAllPosts } from "@/lib/blog"
import { buildMetadata } from "@/lib/seo"

export const revalidate = 30

// A plain-HTML index of every page on the site. It gives crawlers a one-hop
// path from here to every product, range and guide, which is what gets pages
// that were "Discovered, currently not indexed" crawled sooner.

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig()
  return buildMetadata(siteConfig, {
    title: "All Products & Pages: Full Site Index",
    description: `Every product range, product and buying guide from ${siteConfig.shortName} in Dubai, UAE, in one list.`,
    path: "/all-pages",
  })
}

export default async function AllPagesPage() {
  const [categories, posts] = await Promise.all([getAllCategoriesWithItems(), readAllPosts()])

  return (
    <>
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:px-8 lg:px-12">
          <p className="eyebrow !text-accent">Site Index</p>
          <h1 className="mt-4 text-balance text-3xl font-extrabold uppercase tracking-tight text-primary-foreground md:text-5xl">
            All Products &amp; Pages
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8 md:py-16 lg:px-12">
        <Breadcrumbs crumbs={[{ label: "All Pages" }]} />

        <nav aria-label="Main pages" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          {[
            ["/", "Home"],
            ["/products", "All Products"],
            ["/about", "About"],
            ["/contact", "Contact"],
            ["/faq", "FAQ"],
            ["/blog", "Blog"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="text-accent underline-offset-2 hover:underline">
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <section key={cat.slug}>
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-foreground">
                <Link href={`/categories/${cat.slug}`} className="hover:text-accent">
                  {cat.name}
                </Link>
              </h2>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {cat.items.map((item) => (
                  <li key={item.id}>
                    <Link href={`/products/${cat.slug}/${item.slug}`} className="text-muted-foreground transition-colors hover:text-accent">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {posts.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-foreground">Buying Guides</h2>
            <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="text-muted-foreground transition-colors hover:text-accent">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
