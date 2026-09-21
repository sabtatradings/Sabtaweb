import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { JsonLd } from "@/components/json-ld"
import { getSiteConfig } from "@/lib/db"
import { breadcrumbNode, graph } from "@/lib/structured-data"

export async function Breadcrumbs({ crumbs }: { crumbs: { label: string; href?: string }[] }) {
  const siteConfig = await getSiteConfig()

  return (
    <>
      <JsonLd data={graph([breadcrumbNode(siteConfig, crumbs)])} />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Link href="/" className="flex items-center gap-1 transition-colors hover:text-accent">
          <Home className="size-3.5" aria-hidden="true" />
          Home
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            {crumb.href && i < crumbs.length - 1 ? (
              <Link href={crumb.href} className="transition-colors hover:text-accent">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground" aria-current={i === crumbs.length - 1 ? "page" : undefined}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
