import { BlogPostCard } from "@/components/blog-post-card"
import type { BlogPost } from "@/lib/blog"

/** "Buying guides" strip for category / product pages (internal links to the blog). */
export function RelatedGuides({ posts, heading = "Buying Guides" }: { posts: BlogPost[]; heading?: string }) {
  if (posts.length === 0) return null
  return (
    <div className="mt-16 border-t border-border pt-12 md:mt-20">
      <h2 className="text-xl font-extrabold uppercase tracking-tight text-foreground">{heading}</h2>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
