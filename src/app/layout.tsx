import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { LoadingScreen } from "@/components/loading-screen"
import { Providers } from "@/components/providers"
import { DeferredWidgets } from "@/components/deferred-widgets"
import { JsonLd } from "@/components/json-ld"
import { buildMetadata } from "@/lib/seo"
import { graph, organizationNode, websiteNode } from "@/lib/structured-data"
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b2a80",
}

export async function generateMetadata(): Promise<Metadata> {
  const [siteConfig, contactInfo] = await Promise.all([getSiteConfig(), getContactInfo()])
  const home = buildMetadata(siteConfig, {
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    absoluteTitle: true,
    description: siteConfig.description,
    path: "/",
  })
  return {
    ...home,
    metadataBase: new URL(siteConfig.url),
    // Pages set their own canonical via buildMetadata(); no site-wide default,
    // so a page can never accidentally canonicalise to the homepage.
    alternates: undefined,
    title: {
      default: `${siteConfig.name} | ${siteConfig.tagline}`,
      template: `%s | ${siteConfig.shortName}`,
    },
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    category: "Industrial hardware and fasteners",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [
        { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/favicon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/brand/apple-touch-icon.png",
    },
    other: {
      // Legacy but still-read local signals for a physical Dubai business.
      "geo.region": "AE-DU",
      "geo.placename": "Dubai",
      "geo.position": `${contactInfo.lat};${contactInfo.lng}`,
      ICBM: `${contactInfo.lat}, ${contactInfo.lng}`,
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

  const siteJsonLd = graph([organizationNode(siteConfig, contactInfo, categories), websiteNode(siteConfig)])

  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background text-foreground" suppressHydrationWarning>
        <JsonLd data={siteJsonLd} />
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

