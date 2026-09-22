"use client"

import Link from "next/link"
import Image from "next/image"
import { Download, Mail, MapPin, Phone } from "lucide-react"
import { catalogPdfPath } from "@/lib/site-data"
import { usePathname } from "next/navigation"
import { useSiteData } from "@/context/site-data-context"

export function SiteFooter() {
  const pathname = usePathname()
  const { categories, contactInfo, siteConfig } = useSiteData()

  if (pathname.startsWith("/admin")) return null
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-12">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="inline-block" aria-label="Sabta Trading Co. LLC home">
              <div className="inline-flex rounded-xl bg-white p-3 shadow-md">
                <Image src="/brand/logo.png" alt="Sabta Trading Co. LLC" width={320} height={104} className="h-14 w-auto object-contain sm:h-16" />
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-primary-foreground/75">
              {siteConfig.description} Trading since {siteConfig.founded}.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Product Ranges</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categories/${cat.slug}`} className="text-sm text-primary-foreground/70 transition-colors hover:text-accent">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Quick Links</h3>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <Link href="/about" className="text-sm text-primary-foreground/70 transition-colors hover:text-accent">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-sm text-primary-foreground/70 transition-colors hover:text-accent">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-primary-foreground/70 transition-colors hover:text-accent">
                  FAQ
                </Link>
              </li>
              <li>
                <a
                  href={catalogPdfPath}
                  download="Sabta-Trading-Product-Catalog-2026.pdf"
                  className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                >
                  <Download className="size-3.5 shrink-0" aria-hidden="true" />
                  Download Catalog (PDF)
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-primary-foreground/70 transition-colors hover:text-accent">
                  Request a Quote
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Contact Us</h3>
            <ul className="mt-5 flex flex-col gap-4">
              <li>
                <a href={contactInfo.phoneHref} className="flex items-start gap-3 text-sm text-primary-foreground/70 transition-colors hover:text-accent">
                  <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{contactInfo.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contactInfo.primaryEmail}`}
                  className="flex items-start gap-3 text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                >
                  <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{contactInfo.primaryEmail}</span>
                </a>
              </li>
              <li>
                <a
                  href={contactInfo.mapsPlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {contactInfo.poBox}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-1.5 border-t border-primary-foreground/10 pt-8">
          <p className="text-center text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <a
            href="https://farwingstechsolutions.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-foreground/50 transition-colors hover:text-accent"
          >
            Developed by Farwings
          </a>
        </div>
      </div>
    </footer>
  )
}
