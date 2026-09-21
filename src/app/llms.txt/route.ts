import { buildLlmsTxt } from "@/lib/llms"

export const revalidate = 300

export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    },
  })
}
