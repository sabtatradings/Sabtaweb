import Link from "next/link"
import type { ReactNode } from "react"
import type { SeoSection } from "@/lib/seo-content"

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g

/** Renders text with [anchor](/path) links. Internal paths use <Link>, everything else a plain <a>. */
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(LINK_RE)) {
    const [whole, label, href] = m
    const start = m.index ?? 0
    if (start > last) parts.push(text.slice(last, start))
    parts.push(
      href.startsWith("/") ? (
        <Link key={start} href={href} className="font-semibold text-accent underline-offset-4 hover:underline">
          {label}
        </Link>
      ) : (
        <a key={start} href={href} className="font-semibold text-accent underline-offset-4 hover:underline">
          {label}
        </a>
      ),
    )
    last = start + whole.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

/** Search-driven content sections (see lib/seo-content.ts). Server-rendered so crawlers see them. */
export function SeoSections({ sections }: { sections?: SeoSection[] }) {
  if (!sections || sections.length === 0) return null
  return (
    <div className="mt-16 grid gap-10 border-t border-border pt-12 md:mt-20 lg:grid-cols-2">
      {sections.map((section) => (
        <section key={section.heading} className={sections.length === 1 ? "lg:col-span-2 max-w-3xl" : undefined}>
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">{section.heading}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              <RichText text={p} />
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
