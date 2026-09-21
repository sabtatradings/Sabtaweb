// Plain-text / Markdown views of the site for AI assistants (llmstxt.org).
// Built from the same data the pages use, so the summary can never drift from
// what is on the website.

import { getAllCategoriesWithItems, getContactInfo, getFaqs, getIndustries, getSiteConfig } from "./db"
import { readAllPosts, type BlogPost } from "./blog"
import { absoluteUrl } from "./seo"

async function load() {
  const [site, contact, categories, faqs, industries, posts] = await Promise.all([
    getSiteConfig(),
    getContactInfo(),
    getAllCategoriesWithItems(),
    getFaqs(),
    getIndustries(),
    readAllPosts(),
  ])
  return { site, contact, categories, faqs, industries, posts }
}

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim()

function summary(d: Awaited<ReturnType<typeof load>>) {
  const { site, contact, industries } = d
  return [
    `# ${site.name}`,
    "",
    `> ${oneLine(site.description)}`,
    "",
    `${site.name} (${site.shortName}) is a fastener and marine rigging hardware distributor founded in ${site.founded} in Dubai, United Arab Emirates. It stocks ${site.itemsInStock} items across ${d.categories.length} product ranges, in zinc-plated/GI, 304 stainless, 316 marine-grade stainless and mechanical grades 8.8 to 12.9, for the ${new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" }).format(industries.map((i) => i.name))} industries. Prices are quoted on request; there is no online checkout.`,
    "",
    `- Address: ${contact.address}, ${contact.city}`,
    `- Phone: ${contact.phone}`,
    `- Email: ${contact.primaryEmail}`,
    `- WhatsApp: ${contact.primaryWhatsappHref}`,
    `- Website: ${site.url}`,
  ].join("\n")
}

/** /llms.txt: short index with links. */
export async function buildLlmsTxt(): Promise<string> {
  const d = await load()
  const u = (p: string) => absoluteUrl(d.site.url, p)
  const out: string[] = [summary(d), ""]

  out.push("## Product ranges", "")
  for (const c of d.categories) {
    out.push(`- [${c.name}](${u(`/categories/${c.slug}`)}): ${oneLine(c.shortDescription)} (${c.items.length} product types)`)
  }

  out.push("", "## Buying guides", "")
  for (const p of d.posts) {
    out.push(`- [${p.title}](${u(`/blog/${p.slug}`)}): ${oneLine(p.excerpt)}`)
  }

  out.push(
    "",
    "## Company",
    "",
    `- [About ${d.site.shortName}](${u("/about")}): company profile, founder and facts at a glance`,
    `- [Contact and location](${u("/contact")}): phone, WhatsApp, email, address and enquiry form`,
    `- [FAQ](${u("/faq")}): stock, grades, sourcing and how to request a quote`,
    `- [All products](${u("/products")}): searchable catalogue of every product type`,
    "",
    "## Optional",
    "",
    `- [Full content as one file](${u("/llms-full.txt")}): every range, product type, FAQ and guide in Markdown`,
    `- [Blog RSS feed](${u("/blog/feed.xml")})`,
    `- [Sitemap](${u("/sitemap.xml")})`,
    "",
  )
  return out.join("\n")
}

function postMarkdown(p: BlogPost) {
  const body = p.body
    .map((b) => (b.type === "h2" ? `### ${b.text}` : b.type === "ul" ? b.items.map((i) => `- ${i}`).join("\n") : b.text))
    .join("\n\n")
  return `${body}`
}

/** /llms-full.txt: the whole public site as Markdown. */
export async function buildLlmsFullTxt(): Promise<string> {
  const d = await load()
  const u = (p: string) => absoluteUrl(d.site.url, p)
  const out: string[] = [summary(d), ""]

  if (d.contact.contacts.length > 0) {
    out.push("## Sales contacts", "")
    out.push(`- Office: ${d.contact.phone} (fax ${d.contact.fax})`)
    for (const c of d.contact.contacts) out.push(`- ${c.name}: ${c.phone}, ${c.email}`)
    out.push("")
  }

  out.push("## Industries served", "")
  for (const i of d.industries) out.push(`- **${i.name}**: ${oneLine(i.description)}`)
  out.push("")

  out.push("## Product ranges and product types", "")
  for (const c of d.categories) {
    out.push(`### ${c.name}`, "", `${oneLine(c.description)}${c.brandNote ? ` (${c.brandNote})` : ""}`, "", `Page: ${u(`/categories/${c.slug}`)}`, "")
    for (const item of c.items) {
      const spec = [item.grade, item.standard].filter(Boolean).join(", ")
      out.push(`- [${item.name}](${u(`/products/${c.slug}/${item.slug}`)})${spec ? ` (${spec})` : ""}: ${oneLine(item.description)}`)
    }
    out.push("")
  }

  out.push("## Frequently asked questions", "")
  for (const f of d.faqs) out.push(`**${f.question}**`, "", oneLine(f.answer), "")

  out.push("## Buying guides", "")
  for (const p of d.posts) {
    out.push(`### ${p.title}`, "", `${p.category}, published ${p.publishedAt}. ${u(`/blog/${p.slug}`)}`, "", postMarkdown(p), "")
  }
  return out.join("\n")
}
