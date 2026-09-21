import type { MetadataRoute } from "next"
import { getSiteConfig } from "@/lib/db"

// Search engines and AI assistants are explicitly welcome: being quoted by
// ChatGPT, Claude, Perplexity, Gemini and Apple Intelligence is a discovery
// channel for a distributor like Sabta. A crawler that matches a named group
// ignores the "*" group, so each group repeats the same disallow list.
const AI_AND_SEARCH_BOTS = [
  "Googlebot",
  "Bingbot",
  "Applebot",
  "DuckDuckBot",
  // OpenAI (ChatGPT search, browsing and training)
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  // Anthropic (Claude)
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google Gemini / AI Overviews controls, Apple Intelligence
  "Google-Extended",
  "Applebot-Extended",
  // Others
  "DuckAssistBot",
  "Amazonbot",
  "Meta-ExternalAgent",
  "cohere-ai",
  "YouBot",
  "CCBot",
]

const PRIVATE_PATHS = ["/admin", "/api/"]

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteConfig = await getSiteConfig()
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_AND_SEARCH_BOTS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
