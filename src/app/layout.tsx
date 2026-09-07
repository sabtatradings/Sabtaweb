import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { LoadingScreen } from "@/components/loading-screen"
import { Providers } from "@/components/providers"
import { DeferredWidgets } from "@/components/deferred-widgets"
import {
  getSiteConfig,
  getContactInfo,
  getCategories,
  getIndustries,
  getFaqs,
  getChatbotContent,
  getQuickReplies,
} from "@/lib/db"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig()
  const titleDefault = `${siteConfig.name} | ${siteConfig.tagline}`
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: titleDefault,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: [
        { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/favicon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/brand/apple-touch-icon.png",
    },
    openGraph: {
      title: titleDefault,
      description: siteConfig.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: ["/brand/logo.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description: siteConfig.description,
      images: ["/brand/logo.png"],
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [
    siteConfig,
    contactInfo,
    categories,
    industries,
    faqs,
    chatbotContent,
    quickReplies,
  ] = await Promise.all([
    getSiteConfig(),
    getContactInfo(),
    getCategories(),
    getIndustries(),
    getFaqs(),
    getChatbotContent(),
    getQuickReplies(),
  ])

  const siteData = {
    siteConfig,
    contactInfo,
    categories,
    industries,
    faqs,
    chatbotContent,
    quickReplies,
  }

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo.png`,
    foundingDate: String(siteConfig.founded),
    description: siteConfig.description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: contactInfo.phone,
      contactType: "sales",
      areaServed: "AE",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: contactInfo.address,
      addressLocality: contactInfo.addressLocality,
      addressCountry: contactInfo.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contactInfo.lat,
      longitude: contactInfo.lng,
    },
  }

  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background text-foreground" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <Providers siteData={siteData}>
          <LoadingScreen />
          <a
            href="#main-content"
            className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-xl transition-transform focus:translate-y-0"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <WhatsAppButton />
          <DeferredWidgets />
        </Providers>
      </body>
    </html>
  )
}

