import { getSiteConfig } from "@/lib/db"
import { readAllPosts, type BlogPost } from "@/lib/blog"
import { absoluteUrl } from "@/lib/seo"

export const revalidate = 600

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

const html = (p: BlogPost) =>
  p.body
    .map((b) => (b.type === "h2" ? `<h2>${esc(b.text)}</h2>` : b.type === "ul" ? `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p>${esc(b.text)}</p>`))
    .join("")

export async function GET() {
  const [site, posts] = await Promise.all([getSiteConfig(), readAllPosts()])
  const u = (p: string) => absoluteUrl(site.url, p)
  const latest = posts[0] ? new Date(posts[0].publishedAt).toUTCString() : new Date().toUTCString()

  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${u(`/blog/${p.slug}`)}</link>
      <guid isPermaLink="true">${u(`/blog/${p.slug}`)}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <category>${esc(p.category)}</category>
      <description>${esc(p.excerpt)}</description>
      <content:encoded><![CDATA[${html(p).replace(/]]>/g, "]]&gt;")}]]></content:encoded>
    </item>`,
    )
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(site.shortName || site.name)} Blog</title>
    <link>${u("/blog")}</link>
    <atom:link href="${u("/blog/feed.xml")}" rel="self" type="application/rss+xml" />
    <description>${esc(`Buying guides and technical explainers on fasteners and marine rigging hardware from ${site.name}, Dubai.`)}</description>
    <language>en</language>
    <lastBuildDate>${latest}</lastBuildDate>
${items}
  </channel>
</rss>
`
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
    },
  })
}
