import { jsonLdString } from "@/lib/seo"

/** Renders a JSON-LD (schema.org) block. `<` is escaped so page content can never close the script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
}
