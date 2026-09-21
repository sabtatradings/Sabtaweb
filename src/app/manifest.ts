import type { MetadataRoute } from "next"
import { getSiteConfig } from "@/lib/db"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteConfig = await getSiteConfig()
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "browser",
    lang: "en-AE",
    background_color: "#ffffff",
    theme_color: "#1b2a80",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
