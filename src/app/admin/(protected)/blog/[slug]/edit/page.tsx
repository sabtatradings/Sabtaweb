import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPost } from "@/lib/blog"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { BlogForm } from "@/components/admin/blog-form"

export const metadata: Metadata = {
  title: "Edit Post",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function EditBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:px-8">
      <Link
        href="/admin/blog"
        className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Blog Posts
      </Link>

      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-foreground">Edit Post</h1>
      <p className="mt-1 text-sm text-muted-foreground">{post.title}</p>
      <div className="mt-8">
        <BlogForm post={post} />
      </div>
    </div>
  )
}
