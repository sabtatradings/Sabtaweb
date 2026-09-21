import type { MetadataRoute } from "next"
import { getSiteConfig, getAllCategoriesWithItems } from "@/lib/db"
import { readAllPosts } from "@/lib/blog"
import { absoluteUrl } from "@/lib/seo"

// `lastModified` is only emitted where there is a real date behind it (blog
// posts). Stamping every URL with "now" teaches Google to ignore the field.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteConfig = await getSiteConfig()
  const base = siteConfig.url
  const url = (path: string) => absoluteUrl(base, path)

  const [categoriesWithItems, posts] = await Promise.all([getAllCategoriesWithItems(), readAllPosts()])
  const latestPost = posts[0]?.publishedAt

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/products"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/about"), changeFrequency: "yearly", priority: 0.6 },
    { url: url("/contact"), changeFrequency: "yearly", priority: 0.7 },
    { url: url("/faq"), changeFrequency: "monthly", priority: 0.6 },
    {
      url: url("/blog"),
      ...(latestPost ? { lastModified: new Date(latestPost) } : {}),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = categoriesWithItems.map((cat) => {
    const cover = cat.image ?? cat.items.find((i) => i.image)?.image
    return {
      url: url(`/categories/${cat.slug}`),
      changeFrequency: "weekly",
      priority: 0.8,
      ...(cover ? { images: [url(cover)] } : {}),
    }
  })

  const productRoutes: MetadataRoute.Sitemap = categoriesWithItems.flatMap((cat) =>
    cat.items.map((item) => {
      const imgs = (item.images && item.images.length > 0 ? item.images : item.image ? [item.image] : []).map(url)
      return {
        url: url(`/products/${cat.slug}/${item.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        ...(imgs.length > 0 ? { images: imgs } : {}),
      }
    }),
  )

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: url(`/blog/${post.slug}`),
    lastModified: new Date(post.publishedAt),
    changeFrequency: "yearly",
    priority: 0.6,
    images: [url(post.coverImage)],
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes]
}
